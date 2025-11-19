
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, Button, Input, Select, Modal, ProgressBar } from './UI';
import { BudgetModel, Role, FinancialResponsibility, ExpenseStatus, User } from '../types';
import ResponsibilityDetail from './ResponsibilityDetail';

const ResponsibilityForm: React.FC<{ onClose: () => void, initialData?: FinancialResponsibility }> = ({ onClose, initialData }) => {
    const { users, groups, addResponsibility, updateResponsibility, t } = useAppContext();
    const [name, setName] = useState(initialData?.name || '');
    const [budget, setBudget] = useState(initialData?.budget || 0);
    
    // Parse initial assignee type
    const getInitialType = () => {
        if (!initialData) return 'user';
        return initialData.assignee.type;
    };
    const [assigneeType, setAssigneeType] = useState<'user' | 'group'>(getInitialType());
    const [assigneeId, setAssigneeId] = useState(initialData?.assignee.id || (users.filter(u => u.role === Role.USER)[0]?.id || ''));
    const [model, setModel] = useState<BudgetModel>(initialData?.model || BudgetModel.SHARED);
    
    // Convert distributedAllocations array to object map for form state
    const getInitialAllocations = () => {
        const allocs: Record<string, number> = {};
        if (initialData?.distributedAllocations) {
            initialData.distributedAllocations.forEach(a => allocs[a.userId] = a.amount);
        }
        return allocs;
    };
    const [distributedAllocations, setDistributedAllocations] = useState<Record<string, number>>(getInitialAllocations());

    const selectedGroupMembers = assigneeType === 'group' 
        ? (groups.find(g => g.id === assigneeId)?.memberIds
            .map(id => users.find(u => u.id === id))
            .filter((user): user is User => !!user) ?? [])
        : [];

    const handleAllocationChange = (userId: string, amount: number) => {
        setDistributedAllocations(prev => ({ ...prev, [userId]: isNaN(amount) ? 0 : amount }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (model === BudgetModel.DISTRIBUTED && assigneeType === 'group') {
            const totalAllocated = Object.values(distributedAllocations).reduce<number>((sum, amount) => sum + (Number(amount) || 0), 0);
            if (Math.abs(totalAllocated - budget) > 0.001) { // Use tolerance for float comparison
                alert(t('responsibilities.form.reallocate.errorDistribution', { allocated: Number(totalAllocated).toFixed(2), budget: Number(budget).toFixed(2) }));
                return;
            }
        }

        const respData: Omit<FinancialResponsibility, 'id' | 'history'> = {
            name, budget, model, assignee: { type: assigneeType, id: assigneeId }
        };

        if (model === BudgetModel.DISTRIBUTED) {
            respData.distributedAllocations = Object.entries(distributedAllocations).map(([userId, amount]) => ({ userId, amount: Number(amount) }));
        }

        if (initialData) {
            await updateResponsibility(initialData.id, respData);
        } else {
            await addResponsibility(respData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('responsibilities.form.name')} required />
            <Input type="number" value={budget} onChange={e => setBudget(parseFloat(e.target.value))} placeholder={t('responsibilities.form.totalBudget')} required />
            <div className="flex space-x-4">
                <Select value={assigneeType} onChange={e => {
                    const type = e.target.value as 'user' | 'group';
                    setAssigneeType(type);
                    setAssigneeId(type === 'user' ? (users.filter(u => u.role === Role.USER)[0]?.id || '') : (groups[0]?.id || ''));
                }}>
                    <option value="user">{t('responsibilities.form.user')}</option>
                    <option value="group">{t('responsibilities.form.group')}</option>
                </Select>
                {assigneeType === 'user' ? (
                    <Select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                        {users.filter(u => u.role === Role.USER).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </Select>
                ) : (
                    <Select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </Select>
                )}
            </div>
            {assigneeType === 'group' && (
                <Select value={model} onChange={e => setModel(e.target.value as BudgetModel)}>
                    <option value={BudgetModel.SHARED}>{t('responsibilities.form.sharedBalance')}</option>
                    <option value={BudgetModel.DISTRIBUTED}>{t('responsibilities.form.distributedBalance')}</option>
                </Select>
            )}
            {model === BudgetModel.DISTRIBUTED && assigneeType === 'group' && (
                <div>
                    <h4 className="font-semibold mb-2">{t('responsibilities.form.distributeBudget', { amount: budget })}</h4>
                    {selectedGroupMembers.map(member => (
                        <div key={member.id} className="flex items-center space-x-2 mb-2">
                           <span className="w-1/3">{member.name}</span>
                           <Input type="number" value={distributedAllocations[member.id] || ''} onChange={e => handleAllocationChange(member.id, parseFloat(e.target.value))} placeholder={t('expenses.amount')} />
                        </div>
                    ))}
                </div>
            )}
            <Button type="submit" className="w-full">{initialData ? t('responsibilities.form.update') : t('responsibilities.form.create')}</Button>
        </form>
    );
};

const ReallocationForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { responsibilities, reallocateBudget, t } = useAppContext();
    const [fromId, setFromId] = useState(responsibilities[0]?.id || '');
    const [toId, setToId] = useState(responsibilities.length > 1 ? responsibilities[1].id : (responsibilities[0]?.id || ''));
    const [amount, setAmount] = useState(0);
    const [error, setError] = useState('');

    const fromBudget = responsibilities.find(r => r.id === fromId)?.budget || 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (fromId === toId) {
            setError(t('responsibilities.form.reallocate.errorSame'));
            return;
        }
        if (amount <= 0) {
            setError(t('responsibilities.form.reallocate.errorPositive'));
            return;
        }
        if (amount > fromBudget) {
            setError(t('responsibilities.form.reallocate.errorExceeds'));
            return;
        }
        const success = await reallocateBudget(fromId, toId, amount);
        if (success) {
            onClose();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-dim mb-1">{t('responsibilities.form.reallocate.from')}</label>
                <Select value={fromId} onChange={e => setFromId(e.target.value)}>
                    {responsibilities.map(r => <option key={r.id} value={r.id}>{r.name} ({t('dashboard.budget', { amount: Number(r.budget).toFixed(2) })})</option>)}
                </Select>
            </div>
            <div>
                <label className="block text-sm font-medium text-text-dim mb-1">{t('responsibilities.form.reallocate.to')}</label>
                <Select value={toId} onChange={e => setToId(e.target.value)}>
                    {responsibilities.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
            </div>
            <div>
                 <label className="block text-sm font-medium text-text-dim mb-1">{t('responsibilities.form.reallocate.amount')}</label>
                 <Input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} placeholder={t('responsibilities.form.reallocate.placeholder')} required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">{t('responsibilities.form.reallocate.submit')}</Button>
        </form>
    );
};

const Responsibilities: React.FC = () => {
    const { responsibilities, users, groups, expenses, t } = useAppContext();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isReallocateModalOpen, setIsReallocateModalOpen] = useState(false);
    const [selectedResponsibility, setSelectedResponsibility] = useState<FinancialResponsibility | null>(null);
    const [editingResponsibility, setEditingResponsibility] = useState<FinancialResponsibility | undefined>(undefined);
    
    // Filter State
    const [searchName, setSearchName] = useState('');

    const filteredResponsibilities = useMemo(() => {
        return responsibilities.filter(r => r.name.toLowerCase().includes(searchName.toLowerCase()));
    }, [responsibilities, searchName]);

    const totals = useMemo(() => {
        return filteredResponsibilities.reduce((acc, curr) => {
            const spent = expenses
                .filter(e => e.responsibilityId === curr.id && e.status === ExpenseStatus.APPROVED)
                .reduce((sum, e) => sum + e.total, 0);
            return {
                budget: acc.budget + curr.budget,
                spent: acc.spent + spent
            };
        }, { budget: 0, spent: 0 });
    }, [filteredResponsibilities, expenses]);


    const openEditModal = () => {
        setEditingResponsibility(selectedResponsibility || undefined);
        setSelectedResponsibility(null);
        setIsCreateModalOpen(true);
    }

    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false);
        setEditingResponsibility(undefined);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-main">{t('responsibilities.title')}</h1>
                <div className="space-x-2">
                    <Button onClick={() => setIsReallocateModalOpen(true)} className="!bg-yellow-500 hover:!bg-yellow-600">{t('responsibilities.reallocate')}</Button>
                    <Button onClick={() => setIsCreateModalOpen(true)}>{t('responsibilities.newResponsibility')}</Button>
                </div>
            </div>

            <Card className="bg-blue-50 border border-blue-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="w-full md:w-1/3">
                         <Input 
                            placeholder={t('filters.searchByName')} 
                            value={searchName} 
                            onChange={(e) => setSearchName(e.target.value)} 
                         />
                    </div>
                    <div className="flex gap-6 text-sm">
                         <div className="text-center">
                             <p className="text-text-dim">{t('filters.totalBudget')}</p>
                             <p className="text-xl font-bold text-primary">${Number(totals.budget).toFixed(2)}</p>
                         </div>
                         <div className="text-center">
                             <p className="text-text-dim">{t('filters.totalSpent')}</p>
                             <p className="text-xl font-bold text-secondary">${Number(totals.spent).toFixed(2)}</p>
                         </div>
                    </div>
                </div>
            </Card>

            <Modal isOpen={isCreateModalOpen} onClose={handleCreateModalClose} title={editingResponsibility ? t('responsibilities.editResponsibilityTitle') : t('responsibilities.newResponsibilityTitle')}>
                <ResponsibilityForm onClose={handleCreateModalClose} initialData={editingResponsibility} />
            </Modal>
             <Modal isOpen={isReallocateModalOpen} onClose={() => setIsReallocateModalOpen(false)} title={t('responsibilities.reallocateTitle')}>
                <ReallocationForm onClose={() => setIsReallocateModalOpen(false)} />
            </Modal>
            {selectedResponsibility && (
                <ResponsibilityDetail
                    responsibility={selectedResponsibility}
                    onClose={() => setSelectedResponsibility(null)}
                    onEdit={openEditModal}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResponsibilities.map(resp => {
                    const assigneeName = (resp.assignee.type === 'user' 
                        ? users.find(u => u.id === resp.assignee.id)?.name 
                        : groups.find(g => g.id === resp.assignee.id)?.name) || '';
                    const spent = expenses.filter(e => e.responsibilityId === resp.id && e.status === ExpenseStatus.APPROVED).reduce((sum, e) => sum + e.total, 0);

                    return (
                        <Card key={resp.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedResponsibility(resp)}>
                            <h3 className="text-lg font-bold">{resp.name}</h3>
                            <p className="text-sm text-text-dim mb-2">{t('responsibilities.assignedTo', { name: assigneeName })}</p>
                            <p className="text-sm text-text-dim mb-4">{resp.model}</p>
                            <div className="flex justify-between text-sm text-text-dim mb-1">
                                <span>{t('dashboard.spent', { amount: Number(spent).toFixed(2) })}</span>
                                <span>{t('dashboard.budget', { amount: Number(resp.budget).toFixed(2) })}</span>
                            </div>
                            <ProgressBar value={spent} max={resp.budget} />
                        </Card>
                    );
                })}
                 {filteredResponsibilities.length === 0 && (
                    <p className="col-span-full text-center text-text-dim">{t('filters.noResults')}</p>
                )}
            </div>
        </div>
    );
};

export default Responsibilities;
