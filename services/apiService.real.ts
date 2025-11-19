
import { 
    User, Group, Vendor, FinancialResponsibility, Expense, ExpenseStatus, NotificationSettings,
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper to handle fetch responses
const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

// --- Auth Functions ---
export const login = async (email: string, password: string): Promise<User | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error("Login failed:", error);
        return null;
    }
}

export const resetPassword = async (userId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
            method: 'POST'
        });
        return response.ok;
    } catch (error) {
        console.error("Reset password failed:", error);
        return false;
    }
};

// --- Settings Functions ---
export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        return await handleResponse<NotificationSettings>(response);
    } catch (error) {
        console.error("getNotificationSettings failed:", error);
        return null;
    }
}

export const saveNotificationSettings = async (settings: NotificationSettings): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        return response.ok;
    } catch (error) {
        console.error("saveNotificationSettings failed:", error);
        return false;
    }
}

// --- API Functions ---

export const sendEmail = async (to: string, subject: string, text: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, text, html: text.replace(/\n/g, '<br>') })
        });
        return response.ok;
    } catch (error) {
        console.error("Email sending failed:", error);
        return false;
    }
};

export const getUsers = async (): Promise<User[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        return await handleResponse<User[]>(response);
    } catch (error) {
        console.error("getUsers failed:", error);
        return [];
    }
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    return await handleResponse<User>(response);
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id' | 'password'>>): Promise<User | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return await handleResponse<User>(response);
    } catch (error) {
        console.error("updateUser failed:", error);
        return null;
    }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error("deleteUser failed:", error);
        return false;
    }
};

export const getGroups = async (): Promise<Group[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups`);
        return await handleResponse<Group[]>(response);
    } catch (error) {
        console.error("getGroups failed:", error);
        return [];
    }
};

export const updateGroup = async (groupId: string, data: Partial<Group>): Promise<Group | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await handleResponse<Group>(response);
    } catch (error) {
        console.error("updateGroup failed:", error);
        return null;
    }
};

export const getVendors = async (): Promise<Vendor[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/vendors`);
        return await handleResponse<Vendor[]>(response);
    } catch (error) {
        console.error("getVendors failed:", error);
        return [];
    }
};

export const getResponsibilities = async (): Promise<FinancialResponsibility[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/responsibilities`);
        return await handleResponse<FinancialResponsibility[]>(response);
    } catch (error) {
        console.error("getResponsibilities failed:", error);
        return [];
    }
};

export const getExpenses = async (): Promise<Expense[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/expenses`);
        return await handleResponse<Expense[]>(response);
    } catch (error) {
        console.error("getExpenses failed:", error);
        return [];
    }
};

export const addVendor = async (vendorData: Omit<Vendor, 'id'>): Promise<Vendor> => {
    const response = await fetch(`${API_BASE_URL}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData)
    });
    return await handleResponse<Vendor>(response);
}

export const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'status' | 'submittedBy'>,
    submittedById: string
): Promise<Expense> => {
    const payload = { ...expenseData, submittedBy: submittedById };
    const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return await handleResponse<Expense>(response);
};

export const updateExpenseStatus = async (
    expenseId: string,
    status: ExpenseStatus
): Promise<Expense | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return await handleResponse<Expense>(response);
    } catch (error) {
        console.error("updateExpenseStatus failed:", error);
        return null;
    }
};

export const addResponsibility = async (
    respData: Omit<FinancialResponsibility, 'id' | 'history'>,
    creatorName: string
): Promise<FinancialResponsibility> => {
    const response = await fetch(`${API_BASE_URL}/responsibilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...respData, creatorName })
    });
    return await handleResponse<FinancialResponsibility>(response);
};

export const updateResponsibility = async (
    id: string,
    data: Partial<FinancialResponsibility> & { editorName: string }
): Promise<FinancialResponsibility | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/responsibilities/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await handleResponse<FinancialResponsibility>(response);
    } catch (error) {
        console.error("updateResponsibility failed:", error);
        return null;
    }
};

export const reallocateBudget = async (
    fromId: string,
    toId: string,
    amount: number,
    reallocatorName: string
): Promise<{ success: boolean, updatedResponsibilities: FinancialResponsibility[] }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/responsibilities/reallocate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fromId, toId, amount, reallocatorName })
        });
        
        if (response.ok) {
            const data = await response.json();
            return { success: true, updatedResponsibilities: data.updatedResponsibilities };
        }
        return { success: false, updatedResponsibilities: [] };
    } catch (error) {
        console.error("reallocateBudget failed:", error);
        return { success: false, updatedResponsibilities: [] };
    }
};
