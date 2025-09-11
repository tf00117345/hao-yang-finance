# 權限管理系統整合指南

## 概述
權限管理系統已完成實作，包括：
1. 後端 RoleController 提供權限 API
2. 前端 PermissionContext 和 PermissionGuard 組件
3. UI 組件中的權限檢查整合

## 如何在 App.tsx 中整合 PermissionProvider

在 `AuthProvider` 內部添加 `PermissionProvider`：

```tsx
import { PermissionProvider } from './contexts/PermissionContext';

function App() {
	return (
		<QueryClientProvider client={QueryClientInstance}>
			<ReactQueryDevtools initialIsOpen={false} />
			<RecoilRoot>
				<SnackbarProvider>
					<AuthProvider>
						{/* PermissionProvider 必須在 AuthProvider 內部，因為需要用戶登入資訊 */}
						<PermissionProvider>
							<MessageAlert />
							<BrowserRouter basename="/">
								<Routes>
									{/* ... existing routes */}
								</Routes>
							</BrowserRouter>
						</PermissionProvider>
					</AuthProvider>
				</SnackbarProvider>
			</RecoilRoot>
		</QueryClientProvider>
	);
}
```

## 使用範例

### 1. 在組件中檢查權限
```tsx
import { usePermission } from '../../contexts/PermissionContext';
import { Permission } from '../../types/permission.types';

function MyComponent() {
	const { hasPermission, isAdmin } = usePermission();

	if (!hasPermission(Permission.UserRead)) {
		return <div>您沒有權限訪問此功能</div>;
	}

	return (
		<div>
			{isAdmin() && <AdminOnlyButton />}
		</div>
	);
}
```

### 2. 使用 PermissionGuard 包裝組件
```tsx
import PermissionGuard from '../../components/PermissionGuard/PermissionGuard';

function MyComponent() {
	return (
		<div>
			<PermissionGuard permission={Permission.UserCreate} hideWhenNoPermission>
				<Button>新增使用者</Button>
			</PermissionGuard>
			
			<PermissionGuard 
				permissions={[Permission.UserUpdate, Permission.UserDelete]}
				requireAll={false} // 只需要其中一個權限
				fallback={<div>權限不足</div>}
			>
				<UserActions />
			</PermissionGuard>
		</div>
	);
}
```

### 3. 角色檢查
```tsx
<PermissionGuard role="Admin" hideWhenNoPermission>
	<AdminPanel />
</PermissionGuard>

<PermissionGuard roles={["Admin", "Accountant"]} hideWhenNoPermission>
	<FinancePanel />
</PermissionGuard>
```

## API 端點

後端提供以下權限相關的 API：

- `GET /api/role/permissions` - 獲取所有權限列表
- `GET /api/role/permissions/{role}` - 獲取指定角色的權限
- `GET /api/role/all` - 獲取所有角色及其權限
- `GET /api/role/my-permissions` - 獲取當前使用者的權限
- `POST /api/role/check-permission` - 檢查是否擁有指定權限

## 注意事項

1. **安全性**：前端的權限檢查僅用於 UI 顯示控制，實際的安全檢查仍然在後端進行
2. **權限更新**：當使用者權限變更時，需要重新獲取權限資訊或重新登入
3. **錯誤處理**：PermissionProvider 會處理權限獲取的錯誤狀態
4. **效能**：權限資訊會被快取，避免過多的 API 請求

## 權限列表

目前系統支援的權限：
- **託運單**: WaybillRead, WaybillCreate, WaybillUpdate, WaybillDelete
- **發票**: InvoiceRead, InvoiceCreate, InvoiceUpdate, InvoiceDelete, InvoiceVoid, InvoiceMarkPaid
- **公司**: CompanyRead, CompanyCreate, CompanyUpdate, CompanyDelete
- **司機**: DriverRead, DriverCreate, DriverUpdate, DriverDelete
- **統計**: StatisticsRead, StatisticsExport
- **使用者管理**: UserRead, UserCreate, UserUpdate, UserDelete, UserChangeRole, UserChangeStatus

## 角色權限對應
- **Admin**: 所有權限
- **Accountant**: 託運單讀取、所有發票權限、統計權限
- **Driver**: 僅託運單讀取權限