
import React, { useState } from 'react';
import { FinancialResponsibility, ExpenseStatus, Role, Expense } from '../types';
import { Modal, ProgressBar, Card, Button } from './UI';
import { useAppContext } from '../context/AppContext';
import { formatDateTime } from '../utils/dateUtils';
import ExpenseDetailModal from './ExpenseDetailModal';

interface ResponsibilityDetailProps {
    responsibility: FinancialResponsibility;
    onClose: () => void;
    onEdit: () => void;
}

const ResponsibilityDetail: React.FC<ResponsibilityDetailProps> = ({ responsibility, onClose, onEdit }) => {
    const { expenses, users, currentUser, t } = useAppContext();
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    const associatedExpenses = expenses.filter(e => e.responsibilityId === responsibility.id);
    const spent = associatedExpenses
        .filter(e => e.status === ExpenseStatus.APPROVED)
        .reduce((sum, e) => sum + e.total, 0);

    const isManager = currentUser?.role === Role.FINANCE_MANAGER;

    return (
        <Modal isOpen={true} onClose={onClose} title={responsibility.name}>
            <div className="space-y-6">
                <div className="flex justify-end">
                     {isManager && <Button onClick={onEdit} className="text-sm !bg-blue-500 hover:!bg-blue-600">{t('responsibilityDetail.edit')}</Button>}
                </div>

                {/* Summary Card */}
                <Card>
                    <h3 className="text-lg font-bold mb-2">{t('responsibilityDetail.budgetOverview')}</h3>
                    <div className="flex justify-between text-sm text-text-dim mb-1">
                        <span>{t('dashboard.spent', {amount: Number(spent).toFixed(2)})}</span>
                        <span>{t('dashboard.budget', {amount: Number(responsibility.budget).toFixed(2)})}</span>
                    </div>
                    <ProgressBar value={spent} max={responsibility.budget} />
                    <p className="text-sm text-text-dim mt-2">{responsibility.model}</p>
                </Card>

                {/* Associated Expenses */}
                <Card>
                    <h3 className="text-lg font-bold mb-4">{t('responsibilityDetail.associatedExpenses', {count: associatedExpenses.length})}</h3>
                    <div className="overflow-y-auto max-h-60">
                        {associatedExpenses.length > 0 ? (
                             <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-start text-xs font-medium text-text-dim uppercase">{t('expenses.date')}</th>
                                        <th className="px-4 py-2 text-start text-xs font-medium text-text-dim uppercase">{t('expenses.invoiceNumber')}</th>
                                        <th className="px-4 py-2 text-start text-xs font-medium text-text-dim uppercase">{t('expenses.submittedBy')}</th>
                                        <th className="px-4 py-2 text-start text-xs font-medium text-text-dim uppercase">{t('expenses.vendor')}</th>
                                        <th className="px-4 py-2 text-start text-xs font-medium text-text-dim uppercase">{t('expenses.total')}</th>
                                        <th className="px-4 py-2 text-start text-xs font-medium text-text-dim uppercase">{t('expenses.status')}</th>
                                        <th className="px-4 py-2 text-start text-xs font-medium text-text-dim uppercase">{t('expenses.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {associatedExpenses.map(exp => {
                                        const requester = users.find(u => u.id === exp.submittedBy)?.name || t('expenses.unknown');
                                        return (
                                            <tr key={exp.id}>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDateTime(exp.createdAt || exp.date)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">{exp.invoiceNumber || '-'}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">{requester}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">{exp.vendor}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">${Number(exp.total).toFixed(2)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">{t(`enums.status.${exp.status}`)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                    <Button onClick={() => setSelectedExpense(exp)} className="text-xs !bg-gray-500 hover:!bg-gray-600 px-2 py-1">
                                                        {t('expenses.view')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-text-dim text-center py-4">{t('responsibilityDetail.noExpenses')}</p>
                        )}
                    </div>
                </Card>

                {/* History & Audit Log */}
                <Card>
                     <h3 className="text-lg font-bold mb-4">{t('responsibilityDetail.history')}</h3>
                     <ul className="space-y-2 text-sm text-text-dim list-disc list-inside">
                        {responsibility.history.slice().reverse().map((entry, index) => (
                            <li key={index}>{entry}</li>
                        ))}
                     </ul>
                </Card>
            </div>
            {selectedExpense && (
                <ExpenseDetailModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} />
            )}
        </Modal>
    );
};

export default ResponsibilityDetail;
