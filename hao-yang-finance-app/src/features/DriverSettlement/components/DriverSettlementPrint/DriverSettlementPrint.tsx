import { useEffect, useRef } from 'react';

import { Print } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent } from '@mui/material';
import { format } from 'date-fns';

import { DriverSettlement } from '../../types/driver-settlement.types';
import './DriverSettlementPrint.css';

interface DriverSettlementPrintProps {
	settlement: DriverSettlement;
	open: boolean;
	onClose: () => void;
}

function DriverSettlementPrint({ settlement, open, onClose }: DriverSettlementPrintProps) {
	const printRef = useRef<HTMLDivElement>(null);

	const handlePrint = () => {
		window.print();
	};

	useEffect(() => {
		if (open && printRef.current) {
			// Focus the print content for better accessibility
			printRef.current.focus();
		}
	}, [open]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('zh-TW', {
			style: 'currency',
			currency: 'TWD',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return format(new Date(dateString), 'yyyy年MM月dd日');
	};

	const formatMonth = (dateString: string) => {
		return format(new Date(dateString), 'yyyy年MM月');
	};

	const companyExpenses = settlement.expenses?.filter((e) => e.category === 'company') || [];
	const personalExpenses = settlement.expenses?.filter((e) => e.category === 'personal') || [];

	const totalIncome = settlement.income + settlement.incomeCash;
	const profitableAmount = totalIncome - settlement.totalCompanyExpense - settlement.totalPersonalExpense;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
			<DialogContent sx={{ p: 0 }}>
				<div ref={printRef} className="driver-settlement-print" tabIndex={-1}>
					{/* Header */}
					<div className="settlement-header">
						<div className="settlement-title">司機結算表</div>
						<div className="settlement-subtitle">皓揚財務管理系統</div>
					</div>

					{/* Basic Information */}
					<div className="settlement-basic-info">
						<div>
							<strong>司機姓名：</strong>
							{settlement.driverName}
						</div>
						<div>
							<strong>結算月份：</strong>
							{formatMonth(settlement.targetMonth)}
						</div>
						<div>
							<strong>分紅比例：</strong>
							{settlement.profitShareRatio}%
						</div>
						<div>
							<strong>計算版本：</strong>
							{settlement.calculationVersion}
						</div>
					</div>

					{/* Income Section */}
					<div className="settlement-income">
						<div className="settlement-section-title">收入明細</div>
						<div className="income-summary">
							<div className="income-item">
								<div className="income-label">發票收入</div>
								<div className="income-amount">{formatCurrency(settlement.income)}</div>
							</div>
							<div className="income-item">
								<div className="income-label">現金收入</div>
								<div className="income-amount">{formatCurrency(settlement.incomeCash)}</div>
							</div>
							<div className="income-item income-total">
								<div className="income-label">收入總額</div>
								<div className="income-amount">{formatCurrency(totalIncome)}</div>
							</div>
						</div>
					</div>

					{/* Company Expenses */}
					{companyExpenses.length > 0 && (
						<div className="settlement-expenses">
							<div className="settlement-section-title">公司支出明細</div>
							<table className="expenses-table">
								<thead>
									<tr>
										<th>支出項目</th>
										<th>金額</th>
									</tr>
								</thead>
								<tbody>
									{companyExpenses.map((expense) => (
										<tr key={expense.expenseId}>
											<td>{expense.name}</td>
											<td className="amount-cell">{formatCurrency(expense.amount)}</td>
										</tr>
									))}
								</tbody>
							</table>
							<div className="expenses-total">
								公司支出總額：{formatCurrency(settlement.totalCompanyExpense)}
							</div>
						</div>
					)}

					{/* Personal Expenses */}
					{personalExpenses.length > 0 && (
						<div className="settlement-expenses">
							<div className="settlement-section-title">個人支出明細</div>
							<table className="expenses-table">
								<thead>
									<tr>
										<th>支出項目</th>
										<th>金額</th>
									</tr>
								</thead>
								<tbody>
									{personalExpenses.map((expense) => (
										<tr key={expense.expenseId}>
											<td>{expense.name}</td>
											<td className="amount-cell">{formatCurrency(expense.amount)}</td>
										</tr>
									))}
								</tbody>
							</table>
							<div className="expenses-total">
								個人支出總額：{formatCurrency(settlement.totalPersonalExpense)}
							</div>
						</div>
					)}

					{/* Calculation Summary */}
					<div className="settlement-calculation">
						<div className="calculation-title">分紅計算摘要</div>
						<div className="calculation-items">
							<div className="calculation-item">
								<span className="calculation-label">收入總額</span>
								<span className="calculation-value">{formatCurrency(totalIncome)}</span>
							</div>
							<div className="calculation-item">
								<span className="calculation-label">公司支出總額</span>
								<span className="calculation-value">
									-{formatCurrency(settlement.totalCompanyExpense)}
								</span>
							</div>
							<div className="calculation-item">
								<span className="calculation-label">個人支出總額</span>
								<span className="calculation-value">
									-{formatCurrency(settlement.totalPersonalExpense)}
								</span>
							</div>
							<div className="calculation-item">
								<span className="calculation-label">可分紅金額</span>
								<span className="calculation-value">{formatCurrency(profitableAmount)}</span>
							</div>
							<div className="calculation-item">
								<span className="calculation-label">分紅比例</span>
								<span className="calculation-value">{settlement.profitShareRatio}%</span>
							</div>
							<div className="calculation-item">
								<span className="calculation-label">分紅獎金</span>
								<span className="calculation-value">{formatCurrency(settlement.bonus)}</span>
							</div>
						</div>
						<div className="final-amount">
							<div className="final-amount-label">最終可領金額</div>
							<div className={`final-amount-value ${settlement.finalAmount < 0 ? 'negative' : ''}`}>
								{formatCurrency(settlement.finalAmount)}
							</div>
							<div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
								計算公式：分紅獎金 + 個人支出總額 - 現金收入
							</div>
						</div>
					</div>

					{/* Signatures */}
					<div className="signature-section">
						<div className="signature-box">
							<div className="signature-line" />
							<div>司機簽名</div>
						</div>
						<div className="signature-box">
							<div className="signature-line" />
							<div>會計確認</div>
						</div>
						<div className="signature-box">
							<div className="signature-line" />
							<div>主管核准</div>
						</div>
					</div>

					{/* Footer */}
					<div className="settlement-footer">
						<div>列印時間：{formatDate(new Date().toISOString())}</div>
						<div>系統版本：{settlement.calculationVersion}</div>
					</div>
				</div>
			</DialogContent>
			<DialogActions className="no-print">
				<Button onClick={onClose}>關閉</Button>
				<Button variant="contained" startIcon={<Print />} onClick={handlePrint}>
					列印
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default DriverSettlementPrint;
