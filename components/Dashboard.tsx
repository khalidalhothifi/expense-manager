
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, ProgressBar } from './UI';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CATEGORIES } from '../constants';
import { ExpenseStatus, Role } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CategoryPieChart: React.FC<{ relevantExpenses: any[] }> = ({ relevantExpenses }) => {
    const { t } = useAppContext();
    const data = CATEGORIES.map(category => {
        const total = relevantExpenses
            .filter(exp => exp.category === category && exp.status === ExpenseStatus.APPROVED)
            .reduce((sum, exp) => sum + exp.total, 0);
        return { name: category, value: total };
    }).filter(d => d.value > 0);

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.spendingByCategory')}</h3>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}>
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${Number(value).toFixed(2)}`} />
                    </PieChart>
                </ResponsiveContainer>
            ) : <p className="text-text-dim">{t('dashboard.noApprovedExpenses')}</p>}
        </Card>
    );
};

const SpendingTimelineChart: React.FC<{ relevantExpenses: any[] }> = ({ relevantExpenses }) => {
    const { t, language } = useAppContext();
    const data = relevantExpenses
        .filter(e => e.status === ExpenseStatus.APPROVED)
        .reduce((acc, exp) => {
            const month = new Date(exp.date).toLocaleString(language, { month: 'short' });
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += exp.total;
            return acc;
        }, {} as Record<string, number>);

    const chartData = Object.keys(data).map(month => ({ name: month, total: data[month] }));

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.monthlySpending')}</h3>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `$${Number(value).toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="total" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            ) : <p className="text-text-dim">{t('dashboard.noApprovedExpenses')}</p>}
        </Card>
    );
};

const Dashboard: React.FC = () => {
    const { currentUser, expenses, responsibilities, groups, t } = useAppContext();
    const isManager = currentUser.role === Role.FINANCE_MANAGER;

    // Data filtering based on role
    // If Manager, they see ALL expenses for the Global stats, but the cards below differentiate.
    // However, the prompt asks for "Spending by Category graph per user". 
    // To keep it simple for dashboard: 
    // Admin sees Global Graphs. User sees Personal Graphs.
    
    const graphExpenses = isManager ? expenses : expenses.filter(e => e.submittedBy === currentUser.id);

    // Stats Cards Data
    // For Admin, show Global Stats. For User, show Personal Stats.
    const statsExpenses = isManager ? expenses : expenses.filter(e => e.submittedBy === currentUser.id);

    const totalSubmitted = {
        count: statsExpenses.length,
        amount: statsExpenses.reduce((sum, e) => sum + e.total, 0),
    };

    const approvedExpenses = statsExpenses.filter(e => e.status === ExpenseStatus.APPROVED);
    const approvedStats = {
        count: approvedExpenses.length,
        amount: approvedExpenses.reduce((sum, e) => sum + e.total, 0),
    };
    
    const pendingExpenses = statsExpenses.filter(e => e.status === ExpenseStatus.PENDING);
    const pendingStats = {
        count: pendingExpenses.length,
        amount: pendingExpenses.reduce((sum, e) => sum + e.total, 0),
    };

    const rejectedExpenses = statsExpenses.filter(e => e.status === ExpenseStatus.REJECTED);
    const rejectedStats = {
        count: rejectedExpenses.length,
        amount: rejectedExpenses.reduce((sum, e) => sum + e.total, 0),
    };
    
    // Pending Approvals (Specific to Admin Dashboard context)
    let pendingApprovals = { count: 0, amount: 0 };
    if (isManager) {
        const allPending = expenses.filter(e => e.status === ExpenseStatus.PENDING);
        pendingApprovals = {
            count: allPending.length,
            amount: allPending.reduce((sum, e) => sum + e.total, 0),
        };
    }

    const myResponsibilities = responsibilities.filter(r => {
        if (r.assignee.type === 'user') {
            return r.assignee.id === currentUser.id;
        }
        const group = groups.find(g => g.id === r.assignee.id);
        return group?.memberIds.includes(currentUser.id) ?? false;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <h1 className="text-3xl font-bold text-text-main">{t('dashboard.title')}</h1>
                {isManager && <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{t('dashboard.viewingGlobal')}</span>}
            </div>
            
            {isManager && (
                 <Card className="bg-blue-50 border border-blue-200">
                    <h4 className="font-semibold text-text-dim">{t('dashboard.pendingApprovals')}</h4>
                    <div className="flex items-baseline justify-between mt-1">
                        <p className="text-3xl font-bold text-blue-600">{pendingApprovals.count}</p>
                        <p className="text-lg font-semibold text-blue-500">${Number(pendingApprovals.amount).toFixed(2)}</p>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <h4 className="font-semibold text-text-dim">{t('dashboard.totalExpenses')}</h4>
                    <p className="text-3xl font-bold text-primary">{totalSubmitted.count}</p>
                    <p className="text-md font-semibold text-primary-dark">${Number(totalSubmitted.amount).toFixed(2)}</p>
                </Card>
                <Card>
                    <h4 className="font-semibold text-text-dim">{t('dashboard.approvedSpending')}</h4>
                    <p className="text-3xl font-bold text-secondary">{approvedStats.count}</p>
                    <p className="text-md font-semibold text-green-700">${Number(approvedStats.amount).toFixed(2)}</p>
                </Card>
                <Card>
                    <h4 className="font-semibold text-text-dim">{t('dashboard.pendingExpenses')}</h4>
                    <p className="text-3xl font-bold text-yellow-500">{pendingStats.count}</p>
                     <p className="text-md font-semibold text-yellow-600">${Number(pendingStats.amount).toFixed(2)}</p>
                </Card>
                 <Card>
                    <h4 className="font-semibold text-text-dim">{t('dashboard.rejectedExpenses')}</h4>
                    <p className="text-3xl font-bold text-red-500">{rejectedStats.count}</p>
                    <p className="text-md font-semibold text-red-600">${Number(rejectedStats.amount).toFixed(2)}</p>
                </Card>
            </div>

            {/* Responsibilities - Mostly relevant for Users or Managers monitoring specific budget lines assigned to them */}
            {myResponsibilities.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {myResponsibilities.map(resp => {
                        const spent = expenses.filter(e => e.responsibilityId === resp.id && e.status === ExpenseStatus.APPROVED).reduce((sum, e) => sum + e.total, 0);
                        return (
                            <Card key={resp.id}>
                                <h3 className="text-lg font-semibold mb-2">{resp.name}</h3>
                                <div className="flex justify-between text-sm text-text-dim mb-1">
                                    <span>{t('dashboard.spent', {amount: Number(spent).toFixed(2)})}</span>
                                    <span>{t('dashboard.budget', {amount: Number(resp.budget).toFixed(2)})}</span>
                                </div>
                                <ProgressBar value={spent} max={resp.budget} />
                            </Card>
                        )
                     })}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryPieChart relevantExpenses={graphExpenses} />
                <SpendingTimelineChart relevantExpenses={graphExpenses} />
            </div>
        </div>
    );
};

export default Dashboard;
