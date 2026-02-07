export interface DriverSettlement {
	settlementId: number;
	driverId: string;
	driverName: string;
	targetMonth: string; // ISO date string
	income: number;
	incomeCash: number;
	feeSplitAmount: number;
	totalCompanyExpense: number;
	totalPersonalExpense: number;
	profitShareRatio: number;
	bonus: number;
	finalAmount: number;
	calculationVersion: string;
	createdAt: string;
	updatedAt: string;
	expenses: Expense[];
}

export interface DriverSettlementSummary {
	settlementId: number;
	driverId: string;
	driverName: string;
	targetMonth: string;
	income: number;
	incomeCash: number;
	feeSplitAmount: number;
	totalIncome: number;
	totalCompanyExpense: number;
	totalPersonalExpense: number;
	profitShareRatio: number;
	bonus: number;
	finalAmount: number;
}

export interface CreateDriverSettlement {
	driverId: string;
	targetMonth: string;
	profitShareRatio: number;
	companyExpenses: CreateExpense[];
	personalExpenses: CreateExpense[];
}

export interface UpdateDriverSettlement {
	profitShareRatio: number;
	companyExpenses: CreateExpense[];
	personalExpenses: CreateExpense[];
}

export interface Expense {
	expenseId: number;
	name: string;
	amount: number;
	category: 'company' | 'personal';
	expenseTypeId?: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateExpense {
	name: string;
	amount: number;
	expenseTypeId?: number;
}

export interface ExpenseType {
	expenseTypeId: number;
	category: 'company' | 'personal';
	name: string;
	isDefault: boolean;
	defaultAmount?: number;
	formula?: string;
	createdAt: string;
}

export interface SettlementFormData {
	driverId: string;
	targetMonth: Date;
	profitShareRatio: number;
	companyExpenses: CreateExpense[];
	personalExpenses: CreateExpense[];
}

export type FormulaType = 'fixed' | 'income_percentage' | 'income_cash_percentage' | 'total_income_percentage';

export interface CreateExpenseType {
	category: 'company' | 'personal';
	name: string;
	isDefault: boolean;
	defaultAmount?: number;
	formulaType?: FormulaType;
	formulaValue?: number;
}

export interface UpdateExpenseType {
	name: string;
	isDefault: boolean;
	defaultAmount?: number;
	formulaType?: FormulaType;
	formulaValue?: number;
}

export interface ExpenseTypeFormData {
	name: string;
	isDefault: boolean;
	amountType: 'fixed' | 'formula';
	defaultAmount?: number;
	formulaType?: FormulaType;
	formulaValue?: number;
}
