
import { User, Group, FinancialResponsibility, Expense, Role, BudgetModel, ExpenseStatus, NotificationTrigger, NotificationSettings, UserNotificationPreferences, Vendor } from './types';

export const USERS: User[] = [
    { id: 'user1', name: 'Alice', email: 'alice@example.com', role: Role.FINANCE_MANAGER, password: 'password123' },
    { id: 'user2', name: 'Bob', email: 'bob@example.com', role: Role.USER, password: 'password123' },
    { id: 'user3', name: 'Charlie', email: 'charlie@example.com', role: Role.USER, password: 'password123' },
    { id: 'user4', name: 'Diana', email: 'diana@example.com', role: Role.USER, password: 'password123' },
];

export const GROUPS: Group[] = [
    { id: 'group1', name: 'Marketing Team', memberIds: ['user2', 'user3'] },
    { id: 'group2', name: 'Engineering Team', memberIds: ['user4'] },
];

export const VENDORS: Vendor[] = [
    { id: 'vendor1', name: 'AdCreative Inc.' },
    { id: 'vendor2', name: 'Cloud Services LLC' },
    { id: 'vendor3', name: 'Office Supplies Co.' },
];

export const RESPONSIBILITIES: FinancialResponsibility[] = [
    {
        id: 'resp1',
        name: 'Marketing Q3 Budget',
        budget: 5000,
        model: BudgetModel.SHARED,
        assignee: { type: 'group', id: 'group1' },
        history: ['Created on 2024-07-01'],
    },
    {
        id: 'resp2',
        name: 'Diana\'s Software Subscription',
        budget: 500,
        model: BudgetModel.SHARED, 
        assignee: { type: 'user', id: 'user4' },
        history: ['Created on 2024-07-01'],
    },
    {
        id: 'resp3',
        name: 'Engineering Projects Q3',
        budget: 10000,
        model: BudgetModel.DISTRIBUTED,
        assignee: { type: 'group', id: 'group2' },
        distributedAllocations: [
            { userId: 'user4', amount: 10000 },
        ],
        history: ['Created on 2024-07-10'],
    },
];

export const EXPENSES: Expense[] = [
    {
        id: 'exp1',
        vendor: 'AdCreative Inc.',
        invoiceNumber: 'INV-001',
        date: '2024-07-15',
        lineItems: [{ description: 'Social Media Campaign', amount: 1200, quantity: 1 }],
        tax: 120,
        total: 1320,
        notes: 'July campaign launch',
        category: 'Marketing',
        status: ExpenseStatus.APPROVED,
        submittedBy: 'user2',
        responsibilityId: 'resp1',
    },
    {
        id: 'exp2',
        vendor: 'Cloud Services LLC',
        invoiceNumber: 'INV-002',
        date: '2024-07-20',
        lineItems: [{ description: 'Server Hosting', amount: 350, quantity: 1 }],
        tax: 0,
        total: 350,
        notes: '',
        category: 'Software',
        status: ExpenseStatus.PENDING,
        submittedBy: 'user4',
        responsibilityId: 'resp2',
    },
];

export const CATEGORIES = ['Marketing', 'Software', 'Travel', 'Office Supplies', 'Utilities', 'Other'];

export const INITIAL_NOTIFICATION_SETTINGS: NotificationSettings = {
    smtp: {
        server: 'smtp.example.com',
        port: 587,
        user: 'noreply@example.com',
        pass: 'password',
    },
    templates: {
        [NotificationTrigger.NEW_INVOICE]: {
            en: {
                subject: 'New Expense Submitted: {vendor}',
                body: 'A new expense from {vendor} for ${total} has been submitted by {userName} and is awaiting your approval.',
            },
            ar: {
                subject: 'تم تقديم مصروف جديد: {vendor}',
                body: 'تم تقديم مصروف جديد من {vendor} بمبلغ ${total} بواسطة {userName} وهو بانتظار موافقتك.',
            }
        },
        [NotificationTrigger.EXPENSE_APPROVED]: {
            en: {
                subject: 'Expense Approved: {vendor}',
                body: 'Your expense from {vendor} for ${total} has been approved.',
            },
            ar: {
                subject: 'تمت الموافقة على المصروف: {vendor}',
                body: 'تمت الموافقة على مصروفك من {vendor} بمبلغ ${total}.',
            }
        },
        [NotificationTrigger.EXPENSE_REJECTED]: {
            en: {
                subject: 'Expense Rejected: {vendor}',
                body: 'Your expense from {vendor} for ${total} has been rejected. Please review and contact your manager.',
            },
            ar: {
                subject: 'تم رفض المصروف: {vendor}',
                body: 'تم رفض مصروفك من {vendor} بمبلغ ${total}. يرجى المراجعة والتواصل مع مديرك.',
            }
        },
        [NotificationTrigger.BUDGET_THRESHOLD]: {
            en: {
                subject: 'Budget Warning: {responsibilityName}',
                body: 'The budget for "{responsibilityName}" has reached {usagePercentage}% of its limit.',
            },
            ar: {
                subject: 'تحذير الميزانية: {responsibilityName}',
                body: 'وصلت ميزانية "{responsibilityName}" إلى {usagePercentage}% من حدها.',
            }
        },
        [NotificationTrigger.RESPONSIBILITY_ASSIGNED]: {
            en: {
                subject: 'New Financial Responsibility Assigned',
                body: 'You have been assigned a new financial responsibility: "{responsibilityName}" with a budget of ${budget}.',
            },
            ar: {
                subject: 'تم تعيين مسؤولية مالية جديدة',
                body: 'تم تعيين مسؤولية مالية جديدة لك: "{responsibilityName}" بميزانية قدرها ${budget}.',
            }
        },
    }
};

export const INITIAL_USER_PREFERENCES: UserNotificationPreferences = {
    'user1': { frequency: 'instant', [NotificationTrigger.NEW_INVOICE]: true },
    'user2': { frequency: 'daily', [NotificationTrigger.EXPENSE_APPROVED]: true, [NotificationTrigger.EXPENSE_REJECTED]: true },
    'user3': { frequency: 'daily', [NotificationTrigger.EXPENSE_APPROVED]: true, [NotificationTrigger.EXPENSE_REJECTED]: true },
    'user4': { frequency: 'instant', [NotificationTrigger.EXPENSE_APPROVED]: true, [NotificationTrigger.EXPENSE_REJECTED]: true, [NotificationTrigger.RESPONSIBILITY_ASSIGNED]: true },
};
