import { 
    User, Group, Vendor, FinancialResponsibility, Expense, ExpenseStatus, Role,
} from '../types';
import { USERS, GROUPS, VENDORS, RESPONSIBILITIES, EXPENSES } from '../constants';

// --- In-memory Database ---
// This is a mock database. In a real application, this data would live in a SQL database.
// The SQL queries to interact with that database can be found in `queries.txt`.
let users: User[] = [...USERS];
let groups: Group[] = [...GROUPS];
let vendors: Vendor[] = [...VENDORS];
let responsibilities: FinancialResponsibility[] = [...RESPONSIBILITIES];
let expenses: Expense[] = [...EXPENSES];

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Auth Functions ---
export const login = async (email: string, password: string): Promise<User | null> => {
    // REAL DB QUERY: SELECT id, name, email, role FROM users WHERE email = ? AND password_hash = ?;
    // (The provided password would be hashed before comparison)
    await simulateDelay(300);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
        // In a real app, never send the password back
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    return null;
}

// --- API Functions ---

export const getUsers = async (): Promise<User[]> => {
    // REAL DB QUERY: SELECT id, name, email, role FROM users ORDER BY name;
    await simulateDelay(200);
    // In a real app, never send the password back
    return users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    // REAL DB QUERY: INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?) RETURNING id, name, email, role;
    await simulateDelay(200);
    const newUser: User = { ...userData, id: `user${Date.now()}` };
    users.push(newUser);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id' | 'password'>>): Promise<User | null> => {
    // REAL DB QUERY: UPDATE users SET name = ?, email = ?, role = ? WHERE id = ? RETURNING id, name, email, role;
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
    // REAL DB QUERY: DELETE FROM users WHERE id = ?;
    await simulateDelay(200);
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    return users.length < initialLength;
};


export const getGroups = async (): Promise<Group[]> => {
    // REAL DB QUERY: SELECT * FROM groups ORDER BY name;
    await simulateDelay(200);
    return groups;
};

export const getVendors = async (): Promise<Vendor[]> => {
    // REAL DB QUERY: SELECT id, name FROM vendors ORDER BY name;
    await simulateDelay(200);
    return vendors;
};

export const getResponsibilities = async (): Promise<FinancialResponsibility[]> => {
    // REAL DB QUERY: SELECT * FROM financial_responsibilities ORDER BY name;
    await simulateDelay(300);
    return responsibilities;
};

export const getExpenses = async (): Promise<Expense[]> => {
    // REAL DB QUERY: SELECT * FROM expenses ORDER BY date DESC;
    await simulateDelay(400);
    return expenses;
};

export const addVendor = async (vendorData: Omit<Vendor, 'id'>): Promise<Vendor> => {
    // REAL DB QUERY: INSERT INTO vendors (name) VALUES (?) RETURNING id, name;
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
    // REAL DB QUERY: INSERT INTO expenses (...) VALUES (...) RETURNING *;
    await simulateDelay(500);
    const newExpense: Expense = {
        ...expenseData,
        id: `exp${Date.now()}`,
        status: ExpenseStatus.PENDING,
        submittedBy: submittedById,
    };
    expenses = [newExpense, ...expenses];
    return newExpense;
};

export const updateExpenseStatus = async (
    expenseId: string,
    status: ExpenseStatus
): Promise<Expense | null> => {
    // REAL DB QUERY: UPDATE expenses SET status = ? WHERE id = ? RETURNING *;
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
    // REAL DB QUERY: INSERT INTO financial_responsibilities (...) VALUES (...) RETURNING *;
    await simulateDelay(400);
    const newResp: FinancialResponsibility = {
        ...respData,
        id: `resp${Date.now()}`,
        history: [`Created by ${creatorName} on ${new Date().toLocaleDateString()} with a budget of $${respData.budget.toFixed(2)}`]
    };
    responsibilities.push(newResp);
    return newResp;
};

export const reallocateBudget = async (
    fromId: string,
    toId: string,
    amount: number,
    reallocatorName: string
): Promise<{ success: boolean, updatedResponsibilities: FinancialResponsibility[] }> => {
    // REAL DB ACTION: This would be a transaction in a real database.
    // BEGIN TRANSACTION;
    // UPDATE financial_responsibilities SET budget = budget - ? WHERE id = ?;
    // UPDATE financial_responsibilities SET budget = budget + ? WHERE id = ?;
    // -- Add history logs...
    // COMMIT;
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

    const date = new Date().toLocaleDateString();
    const fromHistory = `Reallocated -$${amount.toFixed(2)} to '${toResp.name}' by ${reallocatorName} on ${date}`;
    const toHistory = `Reallocated +$${amount.toFixed(2)} from '${fromResp.name}' by ${reallocatorName} on ${date}`;
    
    fromResp.history = [...fromResp.history, fromHistory];
    toResp.history = [...toResp.history, toHistory];

    responsibilities[fromRespIndex] = fromResp;
    responsibilities[toRespIndex] = toResp;

    return { success: true, updatedResponsibilities: [fromResp, toResp] };
};