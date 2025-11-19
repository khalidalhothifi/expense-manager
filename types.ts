
export enum Role {
    FINANCE_MANAGER = 'Finance Manager',
    USER = 'User',
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    password?: string; 
}

export interface Group {
    id: string;
    name: string;
    memberIds: string[];
}

export interface Vendor {
    id: string;
    name: string;
}

export enum BudgetModel {
    SHARED = 'Shared Group Balance',
    DISTRIBUTED = 'Distributed Group Balance',
}

export interface DistributedBudgetAllocation {
    userId: string;
    amount: number;
}

export interface FinancialResponsibility {
    id:string;
    name: string;
    budget: number;
    model: BudgetModel;
    assignee: {
        type: 'user' | 'group';
        id: string;
    };
    distributedAllocations?: DistributedBudgetAllocation[];
    history: string[];
    isDeleted?: boolean;
}

export interface LineItem {
    description: string;
    amount: number;
    quantity: number;
}

export enum ExpenseStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}

export interface Expense {
    id: string;
    vendor: string;
    invoiceNumber: string;
    date: string;
    createdAt?: string; // Added field for submission timestamp
    lineItems: LineItem[];
    tax: number;
    total: number;
    notes: string;
    category: string;
    status: ExpenseStatus;
    submittedBy: string;
    responsibilityId: string;
    attachment?: {
        fileName: string;
        fileType: string;
        data: string;
    };
    isDeleted?: boolean;
}

export interface ExtractedInvoiceData {
    vendorName: string;
    invoiceNumber: string;
    date: string;
    lineItems: LineItem[];
    taxes: number;
    totalAmount: number;
}

export type Page = 'dashboard' | 'expenses' | 'responsibilities' | 'notifications' | 'userManagement';

export enum NotificationTrigger {
    NEW_INVOICE = 'New Invoice Submitted',
    EXPENSE_APPROVED = 'Expense Approved',
    EXPENSE_REJECTED = 'Expense Rejected',
    BUDGET_THRESHOLD = 'Budget Threshold Warning',
    RESPONSIBILITY_ASSIGNED = 'Responsibility Assigned/Modified',
}

export interface LocalizedTemplate {
    subject: string;
    body: string;
}

export interface EmailTemplate {
    en: LocalizedTemplate;
    ar: LocalizedTemplate;
}

export interface NotificationSettings {
    smtp: {
        server: string;
        port: number;
        user: string;
        pass: string;
    };
    templates: Record<NotificationTrigger, EmailTemplate>;
}

export interface UserNotificationPreferences {
    [userId: string]: {
        [key in NotificationTrigger]?: boolean;
    } & { frequency: 'instant' | 'daily' | 'weekly' };
}
