# Invoice Extra-Expense CRUD & Amount Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to create / edit / delete extra-expense items inline inside `InvoiceDialog`, fix the unselected-still-counted bug, wire the "extra expenses include tax" switch into the per-section calculation, and add a grand-total view that sums the invoice + extra-expense sections.

**Architecture:** Add three new backend endpoints (`POST` nested under waybill, `PUT`/`DELETE` flat on extra-expense). Frontend gets three matching mutation hooks; `InvoiceDialog` is refactored to (1) replace the calculation logic with a single `useMemo`, (2) add a new "總金額總計" box, and (3) replace the read-only checkbox grid with a row-based CRUD layout (inline edit/add).

**Tech Stack:**
- Backend: ASP.NET Core 8, EF Core, PostgreSQL
- Frontend: React 18, TypeScript, MUI, react-query, react-hook-form

**Spec:** [docs/superpowers/specs/2026-05-10-invoice-extra-expense-crud-design.md](../specs/2026-05-10-invoice-extra-expense-crud-design.md)

**Note on testing:** This project has **no automated test framework**. Verification per task uses (1) build/lint passing, (2) manual UI smoke-test steps via `yarn dev` and `dotnet run`, and (3) browser DevTools network inspection. The final task (Task 11) walks through the full §8 manual checklist from the spec.

---

## File Structure

### Backend (`hao-yang-finance-api/`)

| File | Action | Responsibility |
|---|---|---|
| `DTOs/WaybillDto.cs` | Modify | Add `CreateExtraExpenseRequestDto`, `UpdateExtraExpenseRequestDto` (separate from existing `ExtraExpenseDto` which is a response shape). Note: existing `ExtraExpenseDto` already has `Id` field (line 84) but not all controller mappings include it — see Task 3. |
| `Controllers/WaybillController.cs` | Modify | Add `POST api/Waybill/{waybillId}/extra-expenses`. Fix three response mappings that omit `Id = e.Id`. |
| `Controllers/ExtraExpenseController.cs` | Create | New controller for `PUT api/ExtraExpense/{id}` and `DELETE api/ExtraExpense/{id}`. |

### Frontend (`hao-yang-finance-app/src/`)

| File | Action | Responsibility |
|---|---|---|
| `features/Waybill/api/api.ts` | Modify | Add `createExtraExpense`, `updateExtraExpense`, `deleteExtraExpense` functions. |
| `features/Waybill/api/mutation.ts` | Modify | Add three mutation hooks; each invalidates both `['waybills']` and `['waybills-by-ids']`. |
| `features/Waybill/types/waybill.types.ts` | Modify | Add `CreateExtraExpenseInput`, `UpdateExtraExpenseInput` types. |
| `features/Finance/components/InvoiceDialog/InvoiceDialog.tsx` | Modify | Replace calculation, add 總金額總計 box, refactor 額外費用 section with inline CRUD. |

No new files on the frontend — all changes are colocated with existing waybill / invoice-dialog code.

---

## Task 1: Backend — Add `POST /api/Waybill/{waybillId}/extra-expenses`

**Files:**
- Modify: `hao-yang-finance-api/DTOs/WaybillDto.cs` (add new request DTO)
- Modify: `hao-yang-finance-api/Controllers/WaybillController.cs` (add endpoint)

- [ ] **Step 1: Add `CreateExtraExpenseRequestDto`**

In `hao-yang-finance-api/DTOs/WaybillDto.cs`, add this class **after the existing `ExtraExpenseDto` class** (after line 88):

```csharp
public class CreateExtraExpenseRequestDto
{
    public string Item { get; set; } = string.Empty;
    public decimal Fee { get; set; }
    public string? Notes { get; set; }
}
```

- [ ] **Step 2: Add the POST endpoint to `WaybillController`**

In `hao-yang-finance-api/Controllers/WaybillController.cs`, add this method **at the end of the controller class** (just before the final closing brace):

```csharp
// POST: api/Waybill/{waybillId}/extra-expenses
[HttpPost("{waybillId}/extra-expenses")]
[RequirePermission(Permission.WaybillUpdate)]
public async Task<ActionResult<ExtraExpenseDto>> CreateExtraExpense(
    string waybillId,
    CreateExtraExpenseRequestDto dto
)
{
    if (string.IsNullOrWhiteSpace(dto.Item))
    {
        return BadRequest(new { message = "品項為必填" });
    }

    var waybill = await _context.Waybills.FirstOrDefaultAsync(w => w.Id == waybillId);
    if (waybill == null)
    {
        return NotFound(new { message = "託運單不存在" });
    }

    if (waybill.Status == WaybillStatus.INVOICED.ToString())
    {
        return BadRequest(new { message = "已開立發票的託運單無法新增額外費用" });
    }

    var extraExpense = new ExtraExpense
    {
        WaybillId = waybillId,
        Description = dto.Item,
        Amount = dto.Fee,
        Item = dto.Item,
        Fee = dto.Fee,
        Notes = dto.Notes,
    };

    _context.ExtraExpenses.Add(extraExpense);
    await _context.SaveChangesAsync();

    return Ok(new ExtraExpenseDto
    {
        Id = extraExpense.Id,
        Item = extraExpense.Item ?? extraExpense.Description,
        Fee = extraExpense.Fee ?? extraExpense.Amount,
        Notes = extraExpense.Notes,
    });
}
```

> Note: `Description` and `Amount` are legacy required columns; `Item` and `Fee` are the new columns. Setting both keeps consistency with `CreateWaybill` at lines 273-285.

- [ ] **Step 3: Verify backend builds**

Run from `hao-yang-finance-api/`:
```
dotnet build
```
Expected: `Build succeeded` with 0 errors.

- [ ] **Step 4: Smoke-test the endpoint**

Start backend:
```
dotnet run
```
Open Swagger UI (usually `http://localhost:5xxx/swagger`). Find `POST /api/Waybill/{waybillId}/extra-expenses`, expand it, and:
1. Pick any PENDING waybill ID from the database (`SELECT id FROM waybill WHERE status = 'PENDING' LIMIT 1;`)
2. Send `{"item": "測試", "fee": 100, "notes": null}`
3. Expected: `200 OK` with body containing `id`, `item: "測試"`, `fee: 100`
4. Verify in DB: `SELECT * FROM extra_expense WHERE waybill_id = '<id>';`
5. **Cleanup**: `DELETE FROM extra_expense WHERE item = '測試';`

Also test error cases:
- Non-existent waybill ID → 404 `託運單不存在`
- Empty `item` → 400 `品項為必填`
- INVOICED waybill ID → 400 `已開立發票的託運單無法新增額外費用`

- [ ] **Step 5: Commit**

```
git add hao-yang-finance-api/DTOs/WaybillDto.cs hao-yang-finance-api/Controllers/WaybillController.cs
git commit -m "feat(api): add POST extra-expense endpoint for waybill"
```

---

## Task 2: Backend — Add `ExtraExpenseController` with `PUT` & `DELETE`

**Files:**
- Modify: `hao-yang-finance-api/DTOs/WaybillDto.cs` (add update DTO)
- Create: `hao-yang-finance-api/Controllers/ExtraExpenseController.cs`

- [ ] **Step 1: Add `UpdateExtraExpenseRequestDto`**

In `hao-yang-finance-api/DTOs/WaybillDto.cs`, add this class **right after `CreateExtraExpenseRequestDto` from Task 1**:

```csharp
public class UpdateExtraExpenseRequestDto
{
    public string Item { get; set; } = string.Empty;
    public decimal Fee { get; set; }
    public string? Notes { get; set; }
}
```

- [ ] **Step 2: Create the controller file**

Create `hao-yang-finance-api/Controllers/ExtraExpenseController.cs` with this content:

```csharp
using hao_yang_finance_api.Attributes;
using hao_yang_finance_api.Data;
using hao_yang_finance_api.DTOs;
using hao_yang_finance_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace hao_yang_finance_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ExtraExpenseController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ExtraExpenseController(ApplicationDbContext context)
        {
            _context = context;
        }

        // PUT: api/ExtraExpense/{id}
        [HttpPut("{id}")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<ActionResult<ExtraExpenseDto>> UpdateExtraExpense(
            string id,
            UpdateExtraExpenseRequestDto dto
        )
        {
            if (string.IsNullOrWhiteSpace(dto.Item))
            {
                return BadRequest(new { message = "品項為必填" });
            }

            var extraExpense = await _context
                .ExtraExpenses.Include(e => e.Waybill)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (extraExpense == null)
            {
                return NotFound(new { message = "額外費用不存在" });
            }

            if (extraExpense.Waybill.Status == WaybillStatus.INVOICED.ToString())
            {
                return BadRequest(new { message = "已開立發票的託運單無法修改額外費用" });
            }

            extraExpense.Description = dto.Item;
            extraExpense.Amount = dto.Fee;
            extraExpense.Item = dto.Item;
            extraExpense.Fee = dto.Fee;
            extraExpense.Notes = dto.Notes;

            await _context.SaveChangesAsync();

            return Ok(new ExtraExpenseDto
            {
                Id = extraExpense.Id,
                Item = extraExpense.Item ?? extraExpense.Description,
                Fee = extraExpense.Fee ?? extraExpense.Amount,
                Notes = extraExpense.Notes,
            });
        }

        // DELETE: api/ExtraExpense/{id}
        [HttpDelete("{id}")]
        [RequirePermission(Permission.WaybillUpdate)]
        public async Task<ActionResult> DeleteExtraExpense(string id)
        {
            var extraExpense = await _context
                .ExtraExpenses.Include(e => e.Waybill)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (extraExpense == null)
            {
                return NotFound(new { message = "額外費用不存在" });
            }

            if (extraExpense.Waybill.Status == WaybillStatus.INVOICED.ToString())
            {
                return BadRequest(new { message = "已開立發票的託運單無法刪除額外費用" });
            }

            var isReferenced = await _context.InvoiceExtraExpenses.AnyAsync(iee =>
                iee.ExtraExpenseId == id
            );
            if (isReferenced)
            {
                return Conflict(new { message = "此額外費用已被發票引用，無法刪除" });
            }

            _context.ExtraExpenses.Remove(extraExpense);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
```

- [ ] **Step 3: Verify backend builds**

Run from `hao-yang-finance-api/`:
```
dotnet build
```
Expected: `Build succeeded` with 0 errors.

- [ ] **Step 4: Smoke-test PUT and DELETE**

Restart backend (`dotnet run`). Use Swagger UI:

**PUT test:**
1. Create a fresh extra expense via the Task 1 endpoint, capture its `id`
2. Call `PUT /api/ExtraExpense/{id}` with `{"item": "改過", "fee": 200, "notes": "test"}`
3. Expected: `200 OK` with updated body
4. Verify DB row updated

**DELETE test:**
1. Call `DELETE /api/ExtraExpense/{id}` with the same id
2. Expected: `204 No Content`
3. Verify row gone from DB

**Error cases:**
- PUT non-existent id → 404
- PUT with empty `item` → 400
- DELETE non-existent id → 404
- DELETE an extra expense that is referenced by an invoice (find one via `SELECT extra_expense_id FROM invoice_extra_expense LIMIT 1;`) → 409 `此額外費用已被發票引用，無法刪除`

- [ ] **Step 5: Commit**

```
git add hao-yang-finance-api/DTOs/WaybillDto.cs hao-yang-finance-api/Controllers/ExtraExpenseController.cs
git commit -m "feat(api): add PUT and DELETE endpoints for extra-expense"
```

---

## Task 3: Backend — Fix missing `Id` in three existing waybill response mappings

**Why:** `ExtraExpenseDto.Id` exists in the DTO definition but is omitted in three mapping locations in `WaybillController.cs`. The frontend will rely on these IDs to track checkbox selection. Without the fix, newly fetched waybill data will have `id: undefined` and the existing `selectedExtraExpenses` mechanism will silently break.

The 3 affected response mappings (verified by `grep -n "ExtraExpenses = " WaybillController.cs`):
- Line 193 — `GetWaybill(id)`
- Line 323 — `CreateWaybill` response
- Line 507 — `UpdateWaybill` response

Two **other** mappings (lines 932 and 1005) already include `Id = e.Id` — leave those alone.

**Files:**
- Modify: `hao-yang-finance-api/Controllers/WaybillController.cs:193-200, 323-330, 507-514`

- [ ] **Step 1: Patch `GetWaybill` mapping (around line 193)**

Find:
```csharp
ExtraExpenses = waybill
    .ExtraExpenses.Select(e => new ExtraExpenseDto
    {
        Item = e.Item ?? e.Description,
        Fee = e.Fee ?? e.Amount,
        Notes = e.Notes,
    })
    .ToList(),
```

Replace with:
```csharp
ExtraExpenses = waybill
    .ExtraExpenses.Select(e => new ExtraExpenseDto
    {
        Id = e.Id,
        Item = e.Item ?? e.Description,
        Fee = e.Fee ?? e.Amount,
        Notes = e.Notes,
    })
    .ToList(),
```

- [ ] **Step 2: Patch `CreateWaybill` mapping (around line 323)**

Same diff — find the `createdWaybill.ExtraExpenses.Select(...)` block and add `Id = e.Id,` as the first property.

- [ ] **Step 3: Patch `UpdateWaybill` mapping (around line 507)**

Same diff — find the `updatedWaybill.ExtraExpenses.Select(...)` block and add `Id = e.Id,` as the first property.

- [ ] **Step 4: Verify all three are patched**

Run:
```
grep -A 2 "ExtraExpenses.Select(e => new ExtraExpenseDto" hao-yang-finance-api/Controllers/WaybillController.cs
```
Expected: every result block now contains `Id = e.Id,` (5 total occurrences after patching).

- [ ] **Step 5: Verify backend builds**

Run from `hao-yang-finance-api/`:
```
dotnet build
```
Expected: `Build succeeded` with 0 errors.

- [ ] **Step 6: Smoke-test that GET returns IDs**

Restart backend. In Swagger, call `GET /api/Waybill?startDate=2024-01-01&endDate=2026-12-31`, look at any waybill that has extraExpenses in the response. Expected: each `extraExpenses[i]` now has a non-empty `id` field.

- [ ] **Step 7: Commit**

```
git add hao-yang-finance-api/Controllers/WaybillController.cs
git commit -m "fix(api): include extra-expense id in waybill GET/POST/PUT responses"
```

---

## Task 4: Frontend — Add API functions for extra-expense CRUD

**Files:**
- Modify: `hao-yang-finance-app/src/features/Waybill/types/waybill.types.ts`
- Modify: `hao-yang-finance-app/src/features/Waybill/api/api.ts`

- [ ] **Step 1: Add request input types**

In `hao-yang-finance-app/src/features/Waybill/types/waybill.types.ts`, add at the bottom of the file:

```typescript
export interface CreateExtraExpenseInput {
	item: string;
	fee: number;
	notes?: string;
}

export interface UpdateExtraExpenseInput {
	item: string;
	fee: number;
	notes?: string;
}
```

- [ ] **Step 2: Update import line at top of `api.ts`**

Find the existing import (line 6):
```typescript
import { Waybill, WaybillFormData, CreateWaybillFeeSplit } from '../types/waybill.types';
```
Replace with:
```typescript
import {
	Waybill,
	WaybillFormData,
	CreateWaybillFeeSplit,
	ExtraExpense,
	CreateExtraExpenseInput,
	UpdateExtraExpenseInput,
} from '../types/waybill.types';
```

- [ ] **Step 3: Add the three API functions at the end of `api.ts`**

Append:

```typescript
export const createExtraExpense = async (params: {
	waybillId: string;
	input: CreateExtraExpenseInput;
}): Promise<ExtraExpense> => {
	const response = await axiosInstance.post(
		`/waybill/${params.waybillId}/extra-expenses`,
		params.input,
	);
	return response.data;
};

export const updateExtraExpense = async (params: {
	id: string;
	input: UpdateExtraExpenseInput;
}): Promise<ExtraExpense> => {
	const response = await axiosInstance.put(`/extraexpense/${params.id}`, params.input);
	return response.data;
};

export const deleteExtraExpense = async (id: string): Promise<void> => {
	await axiosInstance.delete(`/extraexpense/${id}`);
};
```

> Note on URL casing: ASP.NET attribute routing with `[Route("api/[controller]")]` derives the path from the controller class name without the `Controller` suffix, case-insensitively. So `ExtraExpenseController` → `api/extraexpense`. Lowercase used here for consistency with existing code that uses `/waybill` rather than `/Waybill`.

- [ ] **Step 4: Verify TypeScript compiles**

Run from `hao-yang-finance-app/`:
```
yarn lint
```
Expected: 0 errors related to `api.ts` or `waybill.types.ts`. (Existing warnings in unrelated files are OK.)

- [ ] **Step 5: Commit**

```
git add hao-yang-finance-app/src/features/Waybill/types/waybill.types.ts hao-yang-finance-app/src/features/Waybill/api/api.ts
git commit -m "feat(web): add API functions for extra-expense CRUD"
```

---

## Task 5: Frontend — Add mutation hooks

**Files:**
- Modify: `hao-yang-finance-app/src/features/Waybill/api/mutation.ts`

- [ ] **Step 1: Update import**

At the top of `mutation.ts`, find the existing import:

```typescript
import {
	deleteWaybill,
	insertWaybill,
	updateWaybill,
	markWaybillAsNoInvoiceNeeded,
	markWaybillAsUnpaidWithTax,
	markWaybillAsPaidWithTax,
	togglePaymentStatus,
	updatePaymentNotes,
	restoreWaybill,
	markWaybillsAsNoInvoiceNeededBatch,
	restoreWaybillsBatch,
	markWaybillsAsUnpaidWithTaxBatch,
	saveWaybillFeeSplits,
} from './api';
```

Add three more imports:
```typescript
import {
	deleteWaybill,
	insertWaybill,
	updateWaybill,
	markWaybillAsNoInvoiceNeeded,
	markWaybillAsUnpaidWithTax,
	markWaybillAsPaidWithTax,
	togglePaymentStatus,
	updatePaymentNotes,
	restoreWaybill,
	markWaybillsAsNoInvoiceNeededBatch,
	restoreWaybillsBatch,
	markWaybillsAsUnpaidWithTaxBatch,
	saveWaybillFeeSplits,
	createExtraExpense,
	updateExtraExpense,
	deleteExtraExpense,
} from './api';
```

- [ ] **Step 2: Add three mutation hooks**

Append at the end of `mutation.ts`:

```typescript
// 新增額外費用
export const useCreateExtraExpenseMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: createExtraExpense,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills-by-ids'], exact: false });
			notifySuccess('已新增額外費用');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 修改額外費用
export const useUpdateExtraExpenseMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: updateExtraExpense,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills-by-ids'], exact: false });
			notifySuccess('已更新額外費用');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 刪除額外費用
export const useDeleteExtraExpenseMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: deleteExtraExpense,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills-by-ids'], exact: false });
			notifySuccess('已刪除額外費用');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};
```

- [ ] **Step 3: Verify lint passes**

Run from `hao-yang-finance-app/`:
```
yarn lint
```
Expected: no new errors in `mutation.ts`.

- [ ] **Step 4: Commit**

```
git add hao-yang-finance-app/src/features/Waybill/api/mutation.ts
git commit -m "feat(web): add mutation hooks for extra-expense CRUD"
```

---

## Task 6: Frontend — Refactor `InvoiceDialog` calculation logic

This is the **bug-fix core** (filters by selection, adds tax-on-extra-expenses, computes grand total). Splitting into a focused task before any UI work to keep the diff readable.

**Files:**
- Modify: `hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx:256-292`

- [ ] **Step 1: Replace `calculateAmounts` and `calculateExtraExpenseAmount` with one `useMemo`**

In `InvoiceDialog.tsx`, find this block (currently lines 256-292):

```typescript
	// 計算金額
	const calculateAmounts = () => {
		// 當前選中的託運單金額
		const currentWaybillAmount = waybillList.reduce((sum, waybill) => sum + (waybill.fee || 0), 0);

		// 選中的建議託運單金額
		const suggestedWaybillAmount = filteredSuggestedWaybills
			.filter((w) => selectedSuggestedIds.includes(w.id || ''))
			.reduce((sum, waybill) => sum + (waybill.fee || 0), 0);

		// 總託運單金額
		const waybillAmount = currentWaybillAmount + suggestedWaybillAmount;

		// if (watchedValues.extraExpensesIncludeTax) {
		// 	// 額外費用包含稅率：稅額 = (託運單金額 + 額外費用) × 稅率
		// 	subtotal = waybillAmount;
		// 	tax = subtotal * watchedValues.taxRate;
		// 	total = subtotal + tax;
		// } else {
		// 額外費用不包含稅率：稅額 = 託運單金額 × 稅率
		const subtotal = waybillAmount;
		const tax = waybillAmount * watchedValues.taxRate;
		const total = subtotal + tax;
		// }

		return { waybillAmount, subtotal, tax, total };
	};

	const calculateExtraExpenseAmount = () => {
		return waybillList.reduce((sum, waybill) => {
			if (!waybill.extraExpenses) return sum;
			return sum + waybill.extraExpenses.reduce((expenseSum, expense) => expenseSum + expense.fee, 0);
		}, 0);
	};

	const { waybillAmount, subtotal, tax, total } = calculateAmounts();
	const extraExpenseAmount = calculateExtraExpenseAmount();
```

Replace with:

```typescript
	// 計算金額（單一 useMemo 計算發票區、額外費用區、總計）
	const amounts = useMemo(() => {
		// === 發票金額計算區 ===
		const currentWaybillAmount = waybillList.reduce((sum, w) => sum + (w.fee || 0), 0);
		const suggestedWaybillAmount = filteredSuggestedWaybills
			.filter((w) => selectedSuggestedIds.includes(w.id || ''))
			.reduce((sum, w) => sum + (w.fee || 0), 0);
		const waybillAmount = currentWaybillAmount + suggestedWaybillAmount;
		const waybillTax = Math.round(waybillAmount * watchedValues.taxRate);
		const waybillTotal = waybillAmount + waybillTax;

		// === 額外費用計算區（只計入勾選的）===
		const extraExpenseAmount = waybillList.reduce((sum, w) => {
			if (!w.extraExpenses) return sum;
			return (
				sum +
				w.extraExpenses
					.filter((e) => selectedExtraExpenses.includes(e.id || ''))
					.reduce((s, e) => s + e.fee, 0)
			);
		}, 0);
		const extraExpenseTax = watchedValues.extraExpensesIncludeTax
			? Math.round(extraExpenseAmount * watchedValues.taxRate)
			: 0;
		const extraExpenseTotal = extraExpenseAmount + extraExpenseTax;

		// === 總金額總計 ===
		const grandTotal = waybillTotal + extraExpenseTotal;

		return {
			waybillAmount,
			waybillTax,
			waybillTotal,
			extraExpenseAmount,
			extraExpenseTax,
			extraExpenseTotal,
			grandTotal,
		};
	}, [
		waybillList,
		filteredSuggestedWaybills,
		selectedSuggestedIds,
		selectedExtraExpenses,
		watchedValues.taxRate,
		watchedValues.extraExpensesIncludeTax,
	]);
```

> Note: `useMemo` is already imported at the top of the file (line 1). No new imports needed for this step.

- [ ] **Step 2: Update existing JSX to use new variable names**

The JSX block at lines 467-490 currently destructures the old names. Change variable references inside the existing "發票金額計算" `<Box>`:

Find:
```tsx
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">託運單金額:</Typography>
									<Typography variant="body2">${waybillAmount.toLocaleString()}</Typography>
								</Stack>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">
										稅額 ({(watchedValues.taxRate * 100).toFixed(1)}%):
									</Typography>
									<Typography variant="body2">${tax.toLocaleString()}</Typography>
								</Stack>
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h6">總計:</Typography>
									<Typography variant="h6" color="primary">
										${total.toLocaleString()}
									</Typography>
								</Stack>
```

Replace with:
```tsx
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">託運單金額:</Typography>
									<Typography variant="body2">
										${amounts.waybillAmount.toLocaleString()}
									</Typography>
								</Stack>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">
										稅額 ({(watchedValues.taxRate * 100).toFixed(1)}%):
									</Typography>
									<Typography variant="body2">${amounts.waybillTax.toLocaleString()}</Typography>
								</Stack>
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h6">總計:</Typography>
									<Typography variant="h6" color="primary">
										${amounts.waybillTotal.toLocaleString()}
									</Typography>
								</Stack>
```

- [ ] **Step 3: Update existing 額外費用計算 JSX (Task 7 will refine UI further; this step just keeps it compiling)**

Find at line 521 (the existing 總計 row inside 額外費用計算):
```tsx
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h6">總計:</Typography>
									<Typography variant="h6" color="primary">
										${extraExpenseAmount.toLocaleString()}
									</Typography>
								</Stack>
```

Replace with:
```tsx
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h6">總計:</Typography>
									<Typography variant="h6" color="primary">
										${amounts.extraExpenseTotal.toLocaleString()}
									</Typography>
								</Stack>
```

- [ ] **Step 4: Verify TypeScript and lint pass**

Run from `hao-yang-finance-app/`:
```
yarn lint
```
Expected: 0 errors in `InvoiceDialog.tsx`. (There may be unused-variable warnings on the old destructured names — those will be resolved when we delete the old destructuring, which Step 1 already did.)

- [ ] **Step 5: Manual verification — calculation correctness**

Start frontend dev server (`yarn dev`) and backend (`dotnet run`).

In the Finance page, select a few PENDING waybills, click 開立發票. Test:

1. **Case 1 — IncTax = false:** Pick a waybill with fee 10000, ensure one extra expense ($2000) is checked. Tax rate 5%. Expected display:
   - 發票金額計算: 託運單金額 $10,000 / 稅額 (5.0%) $500 / 總計 $10,500
   - 額外費用計算 總計: $2,000

2. **Case 2 — IncTax = true** (toggle on the "額外費用包含稅率" switch):
   - 發票金額計算 unchanged
   - 額外費用計算 總計: $2,100 (the new tax row will be added in Task 7's UI step; for now the **total** should already reflect 2100)

3. **Case 3 — uncheck an extra expense:** the 額外費用 總計 should drop accordingly (this fixes the existing bug where unchecked still counted).

Don't submit the invoice yet — just visually verify numbers.

- [ ] **Step 6: Commit**

```
git add hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx
git commit -m "fix(web): refactor InvoiceDialog calculation - filter by selection, add extra-expense tax, compute grand total"
```

---

## Task 7: Frontend — Update 額外費用計算 box UI (only-selected items + conditional tax row)

**Files:**
- Modify: `hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx:493-525` (the 額外費用計算 `<Box>`)

- [ ] **Step 1: Replace the entire 額外費用計算 box**

Find the existing block (currently around lines 493-525):

```tsx
						{/* 額外費用顯示 */}
						<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, bgcolor: '#f5f5f5' }}>
							<Typography variant="subtitle2" gutterBottom>
								額外費用計算
							</Typography>
							<Stack spacing={1}>
								{waybillList.map((waybill) =>
									waybill.extraExpenses && waybill.extraExpenses.length > 0 ? (
										<Stack spacing={0.5} key={waybill.id}>
											{waybill.extraExpenses.map((expense) => (
												<>
													<Stack direction="row" justifyContent="space-between">
														<Typography variant="body2">{expense.item}:</Typography>
														<Typography
															variant="body2"
															color={expense.fee > 0 ? 'success' : 'error'}
														>
															${expense.fee.toLocaleString()}
														</Typography>
													</Stack>
												</>
											))}
										</Stack>
									) : null,
								)}
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h6">總計:</Typography>
									<Typography variant="h6" color="primary">
										${amounts.extraExpenseTotal.toLocaleString()}
									</Typography>
								</Stack>
							</Stack>
						</Box>
```

Replace with:

```tsx
						{/* 額外費用計算 */}
						<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, bgcolor: '#f5f5f5' }}>
							<Typography variant="subtitle2" gutterBottom>
								額外費用計算
							</Typography>
							<Stack spacing={1}>
								{waybillList.flatMap((waybill) =>
									(waybill.extraExpenses || [])
										.filter((expense) => selectedExtraExpenses.includes(expense.id || ''))
										.map((expense) => (
											<Stack
												direction="row"
												justifyContent="space-between"
												key={`calc-${expense.id}`}
											>
												<Typography variant="body2">{expense.item}:</Typography>
												<Typography
													variant="body2"
													color={expense.fee >= 0 ? 'success.main' : 'error.main'}
												>
													${expense.fee.toLocaleString()}
												</Typography>
											</Stack>
										)),
								)}
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">小計:</Typography>
									<Typography variant="body2">
										${amounts.extraExpenseAmount.toLocaleString()}
									</Typography>
								</Stack>
								{watchedValues.extraExpensesIncludeTax && (
									<Stack direction="row" justifyContent="space-between">
										<Typography variant="body2">
											稅額 ({(watchedValues.taxRate * 100).toFixed(1)}%):
										</Typography>
										<Typography variant="body2">
											${amounts.extraExpenseTax.toLocaleString()}
										</Typography>
									</Stack>
								)}
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h6">總計:</Typography>
									<Typography variant="h6" color="primary">
										${amounts.extraExpenseTotal.toLocaleString()}
									</Typography>
								</Stack>
							</Stack>
						</Box>
```

Key changes:
- Detail rows `.filter` by `selectedExtraExpenses` (only show checked items)
- Removed the React anti-pattern `<>` fragment inside `.map` without a key
- Added a 小計 row (always shown) and a 稅額 row (only when `extraExpensesIncludeTax`)
- Color uses `>= 0` for non-negative (so $0 shows green); `success` and `error` should be `success.main` / `error.main` for MUI v5 type-correctness

- [ ] **Step 2: Verify lint passes**

Run from `hao-yang-finance-app/`:
```
yarn lint
```
Expected: 0 errors in `InvoiceDialog.tsx`.

- [ ] **Step 3: Manual verification**

In dev server, open 開立發票 dialog with a waybill that has 2+ extra expenses.

1. With `IncTax = false`: the 額外費用計算 box shows detail rows only for **checked** items. Unchecking one removes its row. 稅額 row is **not visible**.
2. With `IncTax = true`: 稅額 row appears with the right amount (sum × tax rate, rounded).
3. Negative-fee extra expense (if available) shows in red.

- [ ] **Step 4: Commit**

```
git add hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx
git commit -m "feat(web): show only selected items in 額外費用計算, add conditional tax row"
```

---

## Task 8: Frontend — Add 總金額總計 box

**Files:**
- Modify: `hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx`

- [ ] **Step 1: Insert the new box right after the 額外費用計算 box**

In `InvoiceDialog.tsx`, find the closing `</Box>` of the 額外費用計算 block (the one you replaced in Task 7). Immediately after it, insert:

```tsx
						{/* 總金額總計 */}
						<Box
							sx={{
								border: '2px solid',
								borderColor: 'primary.main',
								p: 2,
								borderRadius: 1,
								bgcolor: 'primary.50',
							}}
						>
							<Typography variant="subtitle2" gutterBottom>
								總金額總計
							</Typography>
							<Stack spacing={1}>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">發票區總計:</Typography>
									<Typography variant="body2">
										${amounts.waybillTotal.toLocaleString()}
									</Typography>
								</Stack>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">額外費用區總計:</Typography>
									<Typography variant="body2">
										${amounts.extraExpenseTotal.toLocaleString()}
									</Typography>
								</Stack>
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h5">總金額總計:</Typography>
									<Typography variant="h5" color="primary" fontWeight="bold">
										${amounts.grandTotal.toLocaleString()}
									</Typography>
								</Stack>
							</Stack>
						</Box>
```

> Note: `primary.50` is a MUI palette shade that gives a very light blue background. If the project's theme doesn't define it, swap with `'#e3f2fd'` (a static very-light blue).

- [ ] **Step 2: Verify lint passes**

Run from `hao-yang-finance-app/`:
```
yarn lint
```
Expected: 0 errors.

- [ ] **Step 3: Manual verification**

Open the dialog. Confirm 總金額總計 appears below 額外費用計算 with three rows.

- Case A (IncTax=false, waybill 10000, extra 2000): expect 發票區總計 $10,500 / 額外費用區總計 $2,000 / 總金額總計 $12,500
- Case B (IncTax=true, same numbers): expect $10,500 / $2,100 / $12,600
- Confirm the box has a heavier blue border than other boxes

- [ ] **Step 4: Commit**

```
git add hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx
git commit -m "feat(web): add 總金額總計 summary box to InvoiceDialog"
```

---

## Task 9: Frontend — Refactor 額外費用 section into row-based CRUD layout

This is the largest UI task. The existing "額外費用選擇" section (currently lines 740-778, a chip-style checkbox grid) is replaced with per-waybill rows that support inline edit, delete, and add.

**Files:**
- Modify: `hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx`

- [ ] **Step 1: Add state for inline editing**

Near the other `useState` calls (around line 62-63), add:

```typescript
	const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
	const [addingForWaybillId, setAddingForWaybillId] = useState<string | null>(null);
```

- [ ] **Step 2: Wire up the new mutation hooks**

Near the other mutation hook calls (around line 50-51), add:

```typescript
	const createExtraExpenseMutation = useCreateExtraExpenseMutation();
	const updateExtraExpenseMutation = useUpdateExtraExpenseMutation();
	const deleteExtraExpenseMutation = useDeleteExtraExpenseMutation();
```

And add the imports at the top of the file (find the existing `import { useCreateInvoiceMutation, useUpdateInvoiceMutation } from '../../api/mutation';` line and add a separate line below it):

```typescript
import {
	useCreateExtraExpenseMutation,
	useUpdateExtraExpenseMutation,
	useDeleteExtraExpenseMutation,
} from '../../../Waybill/api/mutation';
```

- [ ] **Step 3: Add a helper component for the inline expense row**

Inside `InvoiceDialog.tsx`, **before the `InvoiceDialog` function definition** (so around line 49), add a small inline component:

```typescript
type ExpenseRowProps = {
	mode: 'view' | 'edit';
	expense?: { id?: string; item: string; fee: number; notes?: string };
	checked?: boolean;
	disabled?: boolean;
	onToggle?: () => void;
	onEditStart?: () => void;
	onDelete?: () => void;
	onSave?: (input: { item: string; fee: number; notes?: string }) => void;
	onCancel?: () => void;
	saving?: boolean;
};

function ExpenseRow({
	mode,
	expense,
	checked,
	disabled,
	onToggle,
	onEditStart,
	onDelete,
	onSave,
	onCancel,
	saving,
}: ExpenseRowProps) {
	const [item, setItem] = useState(expense?.item ?? '');
	const [fee, setFee] = useState<string>(expense?.fee?.toString() ?? '');
	const [notes, setNotes] = useState(expense?.notes ?? '');

	// Reset local state when switching into edit on a different expense
	useEffect(() => {
		if (mode === 'edit') {
			setItem(expense?.item ?? '');
			setFee(expense?.fee?.toString() ?? '');
			setNotes(expense?.notes ?? '');
		}
	}, [mode, expense?.id, expense?.item, expense?.fee, expense?.notes]);

	if (mode === 'view') {
		return (
			<Stack direction="row" alignItems="center" spacing={1}>
				<Checkbox checked={!!checked} onChange={onToggle} disabled={disabled} />
				<Typography sx={{ flex: 1 }}>{expense?.item}</Typography>
				<Typography sx={{ minWidth: 100, textAlign: 'right' }}>
					${expense?.fee?.toLocaleString()}
				</Typography>
				{!disabled && (
					<>
						<Button size="small" onClick={onEditStart}>
							✏️
						</Button>
						<Button size="small" color="error" onClick={onDelete}>
							🗑️
						</Button>
					</>
				)}
			</Stack>
		);
	}

	const feeNumber = Number(fee);
	const isValid = item.trim().length > 0 && fee.trim().length > 0 && !Number.isNaN(feeNumber);

	return (
		<Stack direction="row" alignItems="center" spacing={1}>
			<TextField
				size="small"
				placeholder="品項"
				value={item}
				onChange={(e) => setItem(e.target.value)}
				sx={{ flex: 1 }}
			/>
			<TextField
				size="small"
				type="number"
				placeholder="金額"
				value={fee}
				onChange={(e) => setFee(e.target.value)}
				sx={{ width: 120 }}
			/>
			<TextField
				size="small"
				placeholder="備註"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
				sx={{ width: 160 }}
			/>
			<Button
				size="small"
				variant="contained"
				disabled={!isValid || saving}
				onClick={() => onSave?.({ item: item.trim(), fee: feeNumber, notes: notes || undefined })}
			>
				{saving ? '...' : '✓'}
			</Button>
			<Button size="small" onClick={onCancel} disabled={saving}>
				✗
			</Button>
		</Stack>
	);
}
```

> Note: this is intentionally a small file-local component; not extracting it to its own file because it has tight coupling to the dialog state and only ~80 lines.

- [ ] **Step 4: Replace the existing 額外費用選擇 section**

Find the existing block (currently lines 739-778):

```tsx
						{/* 額外費用選擇 */}
						{waybillList.some((w) => w.extraExpenses && w.extraExpenses.length > 0) && (
							<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
								<Typography variant="subtitle2" gutterBottom>
									額外費用選擇
								</Typography>
								<Stack spacing={2}>
									{waybillList.map((waybill) =>
										waybill.extraExpenses && waybill.extraExpenses.length > 0 ? (
											<Box key={waybill.id}>
												<Typography variant="body2" fontWeight="medium" gutterBottom>
													{waybill.companyName} {waybill.item} 的額外費用:
												</Typography>
												<Stack direction="row" flexWrap="wrap" gap={1}>
													{waybill.extraExpenses.map((expense) => (
														<FormControlLabel
															key={expense.id}
															control={
																<Checkbox
																	checked={selectedExtraExpenses.includes(
																		expense.id || '',
																	)}
																	onChange={(e) =>
																		handleExtraExpenseToggle(
																			expense.id || '',
																			e.target.checked,
																		)
																	}
																/>
															}
															label={`${expense.item} - $${expense.fee.toLocaleString()}`}
														/>
													))}
												</Stack>
											</Box>
										) : null,
									)}
								</Stack>
							</Box>
						)}
```

Replace with:

```tsx
						{/* 額外費用 (新增/修改/刪除) */}
						<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
							<Typography variant="subtitle2" gutterBottom>
								額外費用
							</Typography>
							<Stack spacing={2}>
								{waybillList.map((waybill) => {
									const isInvoiced = waybill.status === 'INVOICED';
									const expenses = waybill.extraExpenses || [];
									return (
										<Box key={waybill.id}>
											<Typography variant="body2" fontWeight="medium" gutterBottom>
												{waybill.companyName} {waybill.item} 的額外費用
												{isInvoiced && (
													<Typography
														component="span"
														variant="caption"
														color="text.secondary"
														sx={{ ml: 1 }}
													>
														(已開立發票，無法修改)
													</Typography>
												)}
												:
											</Typography>
											<Stack spacing={0.5}>
												{expenses.map((expense) => {
													const isEditing = editingExpenseId === expense.id;
													return (
														<ExpenseRow
															key={expense.id}
															mode={isEditing ? 'edit' : 'view'}
															expense={expense}
															checked={selectedExtraExpenses.includes(expense.id || '')}
															disabled={isInvoiced}
															onToggle={() =>
																handleExtraExpenseToggle(
																	expense.id || '',
																	!selectedExtraExpenses.includes(expense.id || ''),
																)
															}
															onEditStart={() => {
																setAddingForWaybillId(null);
																setEditingExpenseId(expense.id || null);
															}}
															onDelete={() => {
																if (!expense.id) return;
																deleteExtraExpenseMutation.mutate(expense.id, {
																	onSuccess: () => {
																		setSelectedExtraExpenses((prev) =>
																			prev.filter((id) => id !== expense.id),
																		);
																	},
																});
															}}
															onSave={(input) => {
																if (!expense.id) return;
																updateExtraExpenseMutation.mutate(
																	{ id: expense.id, input },
																	{
																		onSuccess: () => setEditingExpenseId(null),
																	},
																);
															}}
															onCancel={() => setEditingExpenseId(null)}
															saving={
																updateExtraExpenseMutation.isPending ||
																deleteExtraExpenseMutation.isPending
															}
														/>
													);
												})}
												{addingForWaybillId === waybill.id ? (
													<ExpenseRow
														mode="edit"
														onSave={(input) => {
															createExtraExpenseMutation.mutate(
																{ waybillId: waybill.id, input },
																{
																	onSuccess: (created) => {
																		if (created.id) {
																			setSelectedExtraExpenses((prev) => [
																				...prev,
																				created.id!,
																			]);
																		}
																		setAddingForWaybillId(null);
																	},
																},
															);
														}}
														onCancel={() => setAddingForWaybillId(null)}
														saving={createExtraExpenseMutation.isPending}
													/>
												) : (
													!isInvoiced && (
														<Button
															size="small"
															onClick={() => {
																setEditingExpenseId(null);
																setAddingForWaybillId(waybill.id);
															}}
															sx={{ alignSelf: 'flex-start' }}
														>
															+ 新增額外費用
														</Button>
													)
												)}
											</Stack>
										</Box>
									);
								})}
							</Stack>
						</Box>
```

Key behaviors encoded above:
- Click `[✏️]` clears any pending add row, opens edit on this expense (mutual exclusion via state setters)
- Click `[+ 新增額外費用]` clears any pending edit row, opens add row on this waybill
- After successful create, the new ID is automatically added to `selectedExtraExpenses` (per spec §4.3)
- After successful delete, the ID is removed from `selectedExtraExpenses`
- INVOICED waybill: hide all action buttons, only checkbox visible (and disabled)

- [ ] **Step 5: Verify lint passes**

Run from `hao-yang-finance-app/`:
```
yarn lint
```
Expected: 0 new errors. The unused `FormControlLabel` import (if no longer used elsewhere in the file) should be removed.

- [ ] **Step 6: Manual verification**

Test in dev server. With at least one PENDING waybill:

1. **Add**: Click `+ 新增額外費用` → enter "測試費用", $300 → click ✓ → row appears in list, automatically checked, 額外費用計算 region updates to include $300
2. **Edit**: Click ✏️ on the new row → change to $400 → click ✓ → row shows $400, calc updates
3. **Delete**: Click 🗑️ → row disappears, calc updates
4. **Cancel edit**: Click ✏️, type junk, click ✗ → row reverts, no API call (verify in DevTools network tab)
5. **Mutual exclusion**: Click ✏️ on row A, then ✏️ on row B → A reverts to view, B is in edit
6. **Validation**: In add mode, leave 品項 blank → ✓ button is disabled
7. **INVOICED waybill**: Open dialog in editing mode for a waybill that's INVOICED → all action buttons hidden, only checkbox shown and disabled

- [ ] **Step 7: Commit**

```
git add hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx
git commit -m "feat(web): replace extra-expense checkbox grid with inline CRUD rows"
```

---

## Task 10: Frontend — Reorder dialog sections per spec §6.4

The spec calls for 總金額總計 to appear right after 額外費用計算 (already done in Task 8). The 額外費用 CRUD section should be **after** the 託運單列表 / 建議的託運單 sections (current order is fine — Task 9 kept it at the bottom). This task is just a verification step to make sure ordering matches §6.4.

**Files:**
- Inspect / minor adjust: `hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx`

- [ ] **Step 1: Inspect current section order**

Within the `<Stack spacing={3}>` in `<DialogContent>`, list the JSX comment headers in order (each `{/* ... */}`). Expected after Tasks 6-9:

1. `{/* 基本資訊 */}` (invoice number / date)
2. `{/* 公司選擇 */}`
3. `{/* 公司資訊顯示 */}`
4. `{/* 稅率設定 */}`
5. `{/* 備註 */}`
6. `<Divider />`
7. `{/* 金額計算顯示 */}` → **發票金額計算**
8. `{/* 額外費用計算 */}`
9. `{/* 總金額總計 */}` (added in Task 8)
10. `{/* 託運單列表 */}`
11. `{/* 建議的託運單列表 */}`
12. `{/* 額外費用 (新增/修改/刪除) */}` (refactored in Task 9)

If the current order does not match this, move sections to align. Otherwise, no edit needed.

- [ ] **Step 2: Manual verification**

Open dialog, scroll top to bottom, confirm order matches.

- [ ] **Step 3: Commit (only if any reorder changes were made; otherwise skip)**

```
git add hao-yang-finance-app/src/features/Finance/components/InvoiceDialog/InvoiceDialog.tsx
git commit -m "chore(web): reorder InvoiceDialog sections per spec"
```

---

## Task 11: End-to-end manual verification

**Files:** none — this is the §8 spec checklist run as a final sanity pass.

- [ ] **Step 1: Start backend and frontend**

```
# terminal 1
cd hao-yang-finance-api && dotnet run

# terminal 2
cd hao-yang-finance-app && yarn dev
```

- [ ] **Step 2: Run through 金額計算 verification checklist**

For each row, set up the data, take a screenshot or note actual values, compare:

| Setup | Expected (發票區總計 / 額外費用區總計 / 總金額總計) |
|---|---|
| Waybill fee 10000, 1 extra expense $2000 checked, tax 5%, IncTax=false | 10500 / 2000 / 12500 |
| Same as above but IncTax=true | 10500 / 2100 / 12600 |
| Uncheck the $2000 expense | 10500 / 0 / 10500 (regardless of IncTax) |
| Add a -$100 extra expense, check it, IncTax=true | 10500 / -105 / 10395 (negative tax = -100*0.05 = -5; total = -100 + -5) |

Submit the invoice from one of these cases. Verify in DB that `Invoice.total` matches what was displayed:
```
SELECT invoice_number, subtotal, tax, total FROM invoice ORDER BY created_at DESC LIMIT 1;
```

- [ ] **Step 3: Run through CRUD verification checklist**

- [ ] Add a new extra expense → appears in list, predefault checked, calc reflects it
- [ ] Edit its 金額 → calc updates
- [ ] Delete it → row gone, removed from `selectedExtraExpenses`, calc updates
- [ ] On a waybill with `status = INVOICED`: + 新增 / ✏️ / 🗑️ buttons all hidden
- [ ] Try to delete an extra expense already referenced by an invoice (the one whose invoice you submitted in Step 2 is a candidate) → see snackbar "此額外費用已被發票引用，無法刪除"

- [ ] **Step 4: Run through UI state verification**

- [ ] During mutation: ✓ button shows "..." and is disabled
- [ ] Click ✏️ on row A, then ✏️ on row B → A returns to view, only B is in edit
- [ ] Click + 新增, type junk, click ✗ → row vanishes, no network request fired (verify DevTools Network tab is empty for this action)

- [ ] **Step 5: Final cleanup**

If any test data was inserted (test 費用 etc.), clean up via SQL:
```
DELETE FROM extra_expense WHERE item LIKE '測試%';
```
Voiding/deleting test invoices is up to your judgment based on which were created.

- [ ] **Step 6: Final commit (verification log only, optional)**

If you want a verification audit trail, write a short report to `docs/superpowers/verifications/2026-05-11-invoice-extra-expense-crud-verified.md` summarizing which checklist items passed. Otherwise skip — no code change to commit.

---

## Summary of commits expected

After all tasks:

1. `feat(api): add POST extra-expense endpoint for waybill`
2. `feat(api): add PUT and DELETE endpoints for extra-expense`
3. `fix(api): include extra-expense id in waybill GET/POST/PUT responses`
4. `feat(web): add API functions for extra-expense CRUD`
5. `feat(web): add mutation hooks for extra-expense CRUD`
6. `fix(web): refactor InvoiceDialog calculation - filter by selection, add extra-expense tax, compute grand total`
7. `feat(web): show only selected items in 額外費用計算, add conditional tax row`
8. `feat(web): add 總金額總計 summary box to InvoiceDialog`
9. `feat(web): replace extra-expense checkbox grid with inline CRUD rows`
10. (optional reorder commit)

10-11 commits total, each independently revertible.
