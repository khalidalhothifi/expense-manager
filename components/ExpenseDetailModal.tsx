
import React from 'react';
import { Modal, Button } from './UI';
import { Expense, ExpenseStatus, User } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { useAppContext } from '../context/AppContext';

interface ExpenseDetailModalProps {
    expense: Expense;
    onClose: () => void;
}

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ expense, onClose }) => {
    const { users, t } = useAppContext();
    const submitterName = users.find(u => u.id === expense.submittedBy)?.name || t('expenses.unknown');

    const statusColor = {
        [ExpenseStatus.APPROVED]: 'bg-green-100 text-green-800',
        [ExpenseStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
        [ExpenseStatus.REJECTED]: 'bg-red-100 text-red-800',
    }[expense.status];

    return (
        <Modal isOpen={true} onClose={onClose} title={t('expenses.detailsTitle') || "Request Details"}>
            <div className="space-y-6">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{expense.vendor}</h3>
                        <p className="text-sm text-gray-500">{t('expenses.invoiceNumber')}: {expense.invoiceNumber || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusColor}`}>
                            {t(`enums.status.${expense.status}`)}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">{formatDateTime(expense.createdAt || expense.date)}</p>
                    </div>
                </div>

                {/* Main Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">{t('expenses.submittedBy')}</label>
                        <p className="text-gray-900 font-medium">{submitterName}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">{t('expenses.category')}</label>
                        <p className="text-gray-900">{expense.category}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">{t('expenses.date')}</label>
                        <p className="text-gray-900">{expense.date}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">{t('expenses.totalAmount')}</label>
                        <p className="text-xl font-bold text-primary-dark">${Number(expense.total).toFixed(2)}</p>
                        <p className="text-xs text-gray-400">({t('expenses.tax')}: ${Number(expense.tax).toFixed(2)})</p>
                    </div>
                </div>

                {/* Line Items */}
                <div>
                    <h4 className="font-semibold mb-2 border-b pb-1">{t('expenses.lineItems')}</h4>
                    <div className="bg-gray-50 rounded-md p-3">
                        {expense.lineItems && expense.lineItems.length > 0 ? (
                            <ul className="space-y-2">
                                {expense.lineItems.map((item, idx) => (
                                    <li key={idx} className="flex justify-between text-sm">
                                        <span>{item.description} <span className="text-gray-400">x{item.quantity}</span></span>
                                        <span className="font-medium">${Number(item.amount).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400">No line items.</p>
                        )}
                    </div>
                </div>

                {/* Notes */}
                {expense.notes && (
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">{t('expenses.notesPlaceholder') || "Notes"}</label>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{expense.notes}</p>
                    </div>
                )}

                {/* Attachment */}
                {expense.attachment && (
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">{t('expenses.attachment')}</label>
                        <div className="mt-1">
                            <a 
                                href={`data:${expense.attachment.fileType};base64,${expense.attachment.data}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                                <svg className="mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {t('expenses.view')} {expense.attachment.fileName || 'Document'}
                            </a>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={onClose} className="!bg-gray-500 hover:!bg-gray-600">{t('expenses.closeForm') || "Close"}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ExpenseDetailModal;
