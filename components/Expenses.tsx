
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, Button, Input, Select, Modal, Spinner } from './UI';
import { Expense, ExpenseStatus, ExtractedInvoiceData, Role, LineItem } from '../types';
import { CATEGORIES } from '../constants';
import { preprocessImage } from '../utils/imageUtils';
import { extractInvoiceData } from '../services/geminiService';
import { formatDateTime } from '../utils/dateUtils';
import ExpenseDetailModal from './ExpenseDetailModal';


const ExpenseForm: React.FC<{ onFormSubmit: () => void }> = ({ onFormSubmit }) => {
    const { addExpense, currentUser, responsibilities, groups, vendors, t } = useAppContext();
    const [formData, setFormData] = useState<Omit<Expense, 'id' | 'status' | 'submittedBy'>>({
        vendor: '', invoiceNumber: '', date: new Date().toISOString().split('T')[0], lineItems: [], tax: 0, total: 0, notes: '', category: CATEGORIES[0], responsibilityId: '', attachment: undefined
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    
    if (!currentUser) return null;

    useEffect(() => {
        const subtotal = formData.lineItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
        const newTotal = subtotal + (Number(formData.tax) || 0);
        
        // To avoid infinite loops and unnecessary re-renders, only update if the value has changed.
        if (newTotal !== formData.total) {
            setFormData(prev => ({ ...prev, total: newTotal }));
        }
    }, [formData.lineItems, formData.tax, formData.total]);

    const myResponsibilities = responsibilities.filter(r => {
        if (r.assignee.type === 'user') return r.assignee.id === currentUser.id;
        const group = groups.find(g => g.id === r.assignee.id);
        return group?.memberIds.includes(currentUser.id) ?? false;
    });

    const updateFormWithExtractedData = (data: ExtractedInvoiceData) => {
        setFormData(prev => ({
            ...prev,
            vendor: data.vendorName || '',
            invoiceNumber: data.invoiceNumber || '',
            date: data.date || '',
            lineItems: data.lineItems || [],
            tax: data.taxes || 0,
            total: data.totalAmount || 0,
        }));
    };

    const processInvoice = async (file: File) => {
        setError('');
        setIsProcessing(true);
        try {
            const base64 = await preprocessImage(file);
            setFormData(prev => ({
                ...prev,
                attachment: { fileName: file.name, fileType: file.type, data: base64 }
            }));

            const extractedData = await extractInvoiceData(base64, file.type as 'image/jpeg' | 'image/png');
            if (extractedData) {
                updateFormWithExtractedData(extractedData);
            } else {
                setError(t('expenses.error.extract'));
            }
        } catch (err) {
            setError(t('expenses.error.processing'));
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            await processInvoice(file);
        } else if (file) {
            setError(t('expenses.error.upload'));
        }
    };
    
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
    };

    const handleCapture = async () => {
        if (canvasRef.current && videoRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                    await processInvoice(file);
                    stopCamera();
                }
            }, 'image/jpeg');
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraOpen(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(t('expenses.error.camera'));
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Ensure tax is a number for calculation
        if (name === 'tax') {
            setFormData({ ...formData, [name]: parseFloat(value) || 0 });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
        const updatedLineItems = [...formData.lineItems];
        updatedLineItems[index] = { ...updatedLineItems[index], [field]: value };
        setFormData({ ...formData, lineItems: updatedLineItems });
    };

    const addLineItem = () => {
        setFormData({ ...formData, lineItems: [...formData.lineItems, { description: '', quantity: 1, amount: 0 }] });
    };

    const removeLineItem = (index: number) => {
        const updatedLineItems = formData.lineItems.filter((_, i) => i !== index);
        setFormData({ ...formData, lineItems: updatedLineItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.responsibilityId) {
            setError(t('expenses.error.responsibility'));
            return;
        }
        await addExpense(formData);
        onFormSubmit();
        setFormData({ vendor: '', invoiceNumber: '', date: '', lineItems: [], tax: 0, total: 0, notes: '', category: CATEGORIES[0], responsibilityId: '', attachment: undefined });
    };

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="flex space-x-2">
                    <Button type="button" onClick={() => fileInputRef.current?.click()}>{t('expenses.uploadInvoice')}</Button>
                    <Button type="button" onClick={startCamera}>{t('expenses.scanWithCamera')}</Button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/jpeg, image/png" />
                
                {isProcessing && <div className="flex items-center space-x-2 text-text-dim"><Spinner /> <span>{t('expenses.processingInvoice')}</span></div>}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Input list="vendors-list" name="vendor" value={formData.vendor} onChange={handleChange} placeholder={t('expenses.vendor')} required />
                        <datalist id="vendors-list">
                            {vendors.map(v => <option key={v.id} value={v.name} />)}
                        </datalist>
                    </div>
                    <Input name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} placeholder={t('expenses.invoiceNumber')} />
                    <Input name="date" type="date" value={formData.date} onChange={handleChange} required />
                    <Select name="category" value={formData.category} onChange={handleChange}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                    <Select name="responsibilityId" value={formData.responsibilityId} onChange={handleChange} required>
                        <option value="">{t('expenses.selectResponsibility')}</option>
                        {myResponsibilities.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                </div>
                
                <div>
                    <h4 className="font-semibold mb-2">{t('expenses.lineItems')}</h4>
                    {formData.lineItems.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                            <Input value={item.description} onChange={(e) => handleLineItemChange(index, 'description', e.target.value)} placeholder={t('expenses.description')} className="flex-grow"/>
                            <Input type="number" value={item.quantity} onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value))} placeholder={t('expenses.qty')} className="w-20"/>
                            <Input type="number" value={item.amount} onChange={(e) => handleLineItemChange(index, 'amount', parseFloat(e.target.value))} placeholder={t('expenses.amount')} className="w-24"/>
                            <button type="button" onClick={() => removeLineItem(index)} className="text-red-500">{t('expenses.remove')}</button>
                        </div>
                    ))}
                    <Button type="button" onClick={addLineItem} className="text-sm !bg-gray-200 !text-black">{t('expenses.addLineItem')}</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="tax" type="number" value={formData.tax} onChange={handleChange} placeholder={t('expenses.tax')} />
                    <Input name="total" type="number" value={formData.total} onChange={handleChange} placeholder={t('expenses.totalAmount')} required readOnly className="bg-gray-100" />
                </div>
                
                <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder={t('expenses.notesPlaceholder')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
                
                <Button type="submit" className="w-full" disabled={isProcessing}>{t('expenses.submitExpense')}</Button>
            </form>
            <Modal isOpen={isCameraOpen} onClose={stopCamera} title={t('expenses.scanInvoiceTitle')}>
                 <video ref={videoRef} autoPlay className="w-full rounded-md"></video>
                 <canvas ref={canvasRef} className="hidden"></canvas>
                 <Button onClick={handleCapture} className="w-full mt-4">{t('expenses.capture')}</Button>
            </Modal>
        </Card>
    );
};

const ExpenseList: React.FC = () => {
    const { expenses, currentUser, updateExpenseStatus, users, vendors, t } = useAppContext();
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    
    if (!currentUser) return null;
    const isManager = currentUser.role === Role.FINANCE_MANAGER;

    // Filter State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterVendor, setFilterVendor] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof Expense, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    const relevantExpenses = isManager ? expenses : expenses.filter(e => e.submittedBy === currentUser.id);

    const filteredExpenses = useMemo(() => {
        let filtered = relevantExpenses.filter(exp => {
            const matchesDate = (!startDate || exp.date >= startDate) && (!endDate || exp.date <= endDate);
            const matchesVendor = filterVendor === '' || exp.vendor.toLowerCase().includes(filterVendor.toLowerCase());
            const matchesStatus = filterStatus === 'all' || exp.status === filterStatus;
            const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
            return matchesDate && matchesVendor && matchesStatus && matchesCategory;
        });

        // Sort Logic
        filtered.sort((a, b) => {
            // Sort by createdAt if available, otherwise date
            const valA = sortConfig.key === 'date' ? (a.createdAt || a.date) : a[sortConfig.key];
            const valB = sortConfig.key === 'date' ? (b.createdAt || b.date) : b[sortConfig.key];

            if (valA < valB) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return filtered;
    }, [relevantExpenses, startDate, endDate, filterVendor, filterStatus, filterCategory, sortConfig]);

    const requestSort = (key: keyof Expense) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const totals = useMemo(() => {
        return filteredExpenses.reduce((acc, curr) => ({
            total: acc.total + curr.total,
            tax: acc.tax + (curr.tax || 0)
        }), { total: 0, tax: 0 });
    }, [filteredExpenses]);

    const renderSortIcon = (key: keyof Expense) => {
        if (sortConfig.key !== key) return <span className="ml-1 opacity-30">↕</span>;
        return sortConfig.direction === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
    };

    return (
        <Card>
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                    <label className="text-xs text-text-dim block mb-1">{t('filters.startDate')}</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm" />
                </div>
                <div>
                    <label className="text-xs text-text-dim block mb-1">{t('filters.endDate')}</label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm" />
                </div>
                <div>
                    <label className="text-xs text-text-dim block mb-1">{t('filters.vendor')}</label>
                    <Select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)} className="text-sm">
                        <option value="">{t('filters.allVendors')}</option>
                        {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="text-xs text-text-dim block mb-1">{t('filters.status')}</label>
                    <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm">
                        <option value="all">{t('filters.allStatuses')}</option>
                        {Object.values(ExpenseStatus).map(s => <option key={s} value={s}>{t(`enums.status.${s}`)}</option>)}
                    </Select>
                </div>
                 <div>
                    <label className="text-xs text-text-dim block mb-1">{t('filters.category')}</label>
                    <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="text-sm">
                        <option value="all">{t('filters.allCategories')}</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th onClick={() => requestSort('date')} className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider cursor-pointer hover:text-text-main">{t('expenses.date')} {renderSortIcon('date')}</th>
                            <th onClick={() => requestSort('invoiceNumber')} className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider cursor-pointer hover:text-text-main">{t('expenses.invoiceNumber')} {renderSortIcon('invoiceNumber')}</th>
                            <th onClick={() => requestSort('vendor')} className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider cursor-pointer hover:text-text-main">{t('expenses.vendor')} {renderSortIcon('vendor')}</th>
                            <th onClick={() => requestSort('category')} className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider cursor-pointer hover:text-text-main">{t('expenses.category')} {renderSortIcon('category')}</th>
                            <th className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider">{t('expenses.submittedBy')}</th>
                            <th onClick={() => requestSort('total')} className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider cursor-pointer hover:text-text-main">{t('expenses.total')} {renderSortIcon('total')}</th>
                            <th className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider">{t('expenses.attachment')}</th>
                            <th onClick={() => requestSort('status')} className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider cursor-pointer hover:text-text-main">{t('expenses.status')} {renderSortIcon('status')}</th>
                            <th className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider">{t('expenses.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredExpenses.length > 0 ? filteredExpenses.map(exp => {
                             const submitter = users.find(u => u.id === exp.submittedBy)?.name || t('expenses.unknown');
                             const statusColor = {
                                [ExpenseStatus.APPROVED]: 'bg-green-100 text-green-800',
                                [ExpenseStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
                                [ExpenseStatus.REJECTED]: 'bg-red-100 text-red-800',
                             }[exp.status];
                            return (
                                <tr key={exp.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(exp.createdAt || exp.date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{exp.invoiceNumber || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{exp.vendor}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{exp.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{submitter}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">${Number(exp.total).toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {exp.attachment ? (
                                            <a href={`data:${exp.attachment.fileType};base64,${exp.attachment.data}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t('expenses.view')}</a>
                                        ) : t('expenses.na')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                                            {t(`enums.status.${exp.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <Button onClick={() => setSelectedExpense(exp)} className="!bg-gray-500 hover:!bg-gray-600 text-xs px-2 py-1">{t('expenses.view')}</Button>
                                        {isManager && exp.status === ExpenseStatus.PENDING && (
                                            <>
                                                <Button onClick={() => updateExpenseStatus(exp.id, ExpenseStatus.APPROVED)} className="!bg-secondary !text-white text-xs px-2 py-1">{t('expenses.approve')}</Button>
                                                <Button onClick={() => updateExpenseStatus(exp.id, ExpenseStatus.REJECTED)} className="!bg-red-500 !text-white text-xs px-2 py-1">{t('expenses.reject')}</Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )
                        }) : (
                             <tr>
                                <td colSpan={9} className="px-6 py-4 text-center text-sm text-text-dim">{t('filters.noResults')}</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-100 font-semibold">
                        <tr>
                            <td colSpan={5} className="px-6 py-3 text-end text-sm">{t('filters.total')}</td>
                            <td className="px-6 py-3 text-sm text-primary-dark">${Number(totals.total).toFixed(2)}</td>
                            <td colSpan={3} className="px-6 py-3 text-sm">
                                <span className="text-text-dim text-xs font-normal">({t('expenses.tax')}: ${Number(totals.tax).toFixed(2)})</span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            {selectedExpense && (
                <ExpenseDetailModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} />
            )}
        </Card>
    );
};

const Expenses: React.FC = () => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const { t } = useAppContext();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-main">{t('expenses.title')}</h1>
                <Button onClick={() => setIsFormVisible(prev => !prev)}>{isFormVisible ? t('expenses.closeForm') : t('expenses.newExpense')}</Button>
            </div>
            {isFormVisible && <ExpenseForm onFormSubmit={() => setIsFormVisible(false)} />}
            <ExpenseList />
        </div>
    );
};

export default Expenses;
