
import { 
    User, Group, Vendor, FinancialResponsibility, Expense, ExpenseStatus, NotificationSettings,
} from '../types';
import { USERS, GROUPS, VENDORS, RESPONSIBILITIES, EXPENSES, INITIAL_NOTIFICATION_SETTINGS } from '../constants';

// --- In-memory Database ---
let users: User[] = [...USERS];
let groups: Group[] = [...GROUPS];
let vendors: Vendor[] = [...VENDORS];
let responsibilities: FinancialResponsibility[] = [...RESPONSIBILITIES];
let expenses: Expense[] = [...EXPENSES];
let settings: NotificationSettings = { ...INITIAL_NOTIFICATION_SETTINGS };

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const formatDateForHistory = () => {
    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// --- Auth Functions ---
export const login = async (email: string, password: string): Promise<User | null> => {
    await simulateDelay(300);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    return null;
}

export const resetPassword = async (userId: string): Promise<boolean> => {
    await simulateDelay(300);
    return true;
};

// --- Settings Functions ---
export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
    await simulateDelay(200);
    return settings;
}

export const saveNotificationSettings = async (newSettings: NotificationSettings): Promise<boolean> => {
    await simulateDelay(300);
    settings = newSettings;
    return true;
}


// --- API Functions ---

export const sendEmail = async (to: string, subject: string, text: string): Promise<boolean> => {
    await simulateDelay(200);
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Body: ${text}`);
    return true;
};

export const getUsers = async (): Promise<User[]> => {
    await simulateDelay(200);
    return users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    }).sort((a, b) => a.name.localeCompare(b.name));
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    await simulateDelay(200);
    const newUser: User = { ...userData, id: `user${Date.now()}` };
    users.push(newUser);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id' | 'password'>>): Promise<User | null> => {
    await simulateDelay(200);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...userData };
        const { password, ...userWithoutPassword } = users[userIndex];
        return userWithoutPassword;
    }
    return null;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
    await simulateDelay(200);
    // Mock soft delete by just removing from the list returned by API
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    return users.length < initialLength;
};

export const getGroups = async (): Promise<Group[]> => {
    await simulateDelay(200);
    return groups.sort((a, b) => a.name.localeCompare(b.name));
};

export const updateGroup = async (groupId: string, data: Partial<Group>): Promise<Group | null> => {
    await simulateDelay(200);
    const idx = groups.findIndex(g => g.id === groupId);
    if (idx > -1) {
        groups[idx] = { ...groups[idx], ...data };
        return groups[idx];
    }
    return null;
};

export const getVendors = async (): Promise<Vendor[]> => {
    await simulateDelay(200);
    return vendors.sort((a, b) => a.name.localeCompare(b.name));
};

export const getResponsibilities = async (): Promise<FinancialResponsibility[]> => {
    await simulateDelay(300);
    return responsibilities.sort((a, b) => a.name.localeCompare(b.name));
};

export const getExpenses = async (): Promise<Expense[]> => {
    await simulateDelay(400);
    return expenses.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
};

export const addVendor = async (vendorData: Omit<Vendor, 'id'>): Promise<Vendor> => {
    await simulateDelay(150);
    const newVendor: Vendor = {
        ...vendorData,
        id: `vendor${Date.now()}`
    };
    vendors.push(newVendor);
    return newVendor;
}

export const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'status' | 'submittedBy'>,
    submittedById: string
): Promise<Expense> => {
    await simulateDelay(500);
    const newExpense: Expense = {
        ...expenseData,
        id: `exp${Date.now()}`,
        status: ExpenseStatus.PENDING,
        submittedBy: submittedById,
        createdAt: new Date().toISOString(),
        attachments: expenseData.attachments || []
    };
    expenses = [newExpense, ...expenses];
    return newExpense;
};

export const updateExpenseStatus = async (
    expenseId: string,
    status: ExpenseStatus
): Promise<Expense | null> => {
    await simulateDelay(300);
    const expenseIndex = expenses.findIndex(exp => exp.id === expenseId);
    if (expenseIndex > -1) {
        expenses[expenseIndex] = { ...expenses[expenseIndex], status };
        return expenses[expenseIndex];
    }
    return null;
};

export const addResponsibility = async (
    respData: Omit<FinancialResponsibility, 'id' | 'history'>,
    creatorName: string
): Promise<FinancialResponsibility> => {
    await simulateDelay(400);
    const newResp: FinancialResponsibility = {
        ...respData,
        id: `resp${Date.now()}`,
        history: [`Created by ${creatorName} on ${formatDateForHistory()} with a budget of $${Number(respData.budget).toFixed(2)}`]
    };
    responsibilities.push(newResp);
    return newResp;
};

export const updateResponsibility = async (
    id: string,
    data: Partial<FinancialResponsibility> & { editorName: string }
): Promise<FinancialResponsibility | null> => {
    await simulateDelay(400);
    const index = responsibilities.findIndex(r => r.id === id);
    if (index === -1) return null;

    const current = responsibilities[index];
    const history = [...current.history];
    
    if (data.budget !== undefined && Number(data.budget) !== Number(current.budget)) {
        history.push(`Budget updated manually from $${Number(current.budget).toFixed(2)} to $${Number(data.budget).toFixed(2)} by ${data.editorName} on ${formatDateForHistory()}`);
    } else {
        history.push(`Details updated by ${data.editorName} on ${formatDateForHistory()}`);
    }

    responsibilities[index] = {
        ...current,
        ...data,
        history
    };
    
    return responsibilities[index];
}

export const reallocateBudget = async (
    fromId: string,
    toId: string,
    amount: number,
    reallocatorName: string
): Promise<{ success: boolean, updatedResponsibilities: FinancialResponsibility[] }> => {
    await simulateDelay(500);
    const fromRespIndex = responsibilities.findIndex(r => r.id === fromId);
    const toRespIndex = responsibilities.findIndex(r => r.id === toId);

    if (fromRespIndex === -1 || toRespIndex === -1) {
        return { success: false, updatedResponsibilities: [] };
    }

    const fromResp = { ...responsibilities[fromRespIndex] };
    const toResp = { ...responsibilities[toRespIndex] };

    if (fromResp.budget < amount) {
        return { success: false, updatedResponsibilities: [] }; // Insufficient funds
    }

    fromResp.budget -= amount;
    toResp.budget += amount;

    const date = formatDateForHistory();
    const fromHistory = `Reallocated -$${Number(amount).toFixed(2)} to '${toResp.name}' by ${reallocatorName} on ${date}`;
    const toHistory = `Reallocated +$${Number(amount).toFixed(2)} from '${fromResp.name}' by ${reallocatorName} on ${date}`;
    
    fromResp.history = [...fromResp.history, fromHistory];
    toResp.history = [...toResp.history, toHistory];

    responsibilities[fromRespIndex] = fromResp;
    responsibilities[toRespIndex] = toResp;

    return { success: true, updatedResponsibilities: [fromResp, toResp] };
};
