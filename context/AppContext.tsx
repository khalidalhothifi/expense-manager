import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import {
  User,
  Role,
  Group,
  FinancialResponsibility,
  Expense,
  ExpenseStatus,
  NotificationSettings,
  UserNotificationPreferences,
  NotificationTrigger,
  Vendor,
} from "../types";
import {
  INITIAL_NOTIFICATION_SETTINGS,
  INITIAL_USER_PREFERENCES,
} from "../constants";
import { useNotifications } from "../hooks/useNotifications";
import * as mockApi from "../services/apiService.mock";
import * as realApi from "../services/apiService.real";

type Language = "en" | "ar";
type DataSource = "demo" | "real";

interface AppContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: User[];
  addUser: (userData: Omit<User, "id">, groupIds: string[]) => Promise<void>;
  updateUser: (
    userId: string,
    userData: Partial<Omit<User, "id" | "password">>,
    groupIds?: string[]
  ) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resetPassword: (userId: string) => Promise<void>;
  groups: Group[];
  vendors: Vendor[];
  responsibilities: FinancialResponsibility[];
  expenses: Expense[];
  addExpense: (
    expense: Omit<Expense, "id" | "status" | "submittedBy">
  ) => Promise<void>;
  updateExpenseStatus: (
    expenseId: string,
    status: ExpenseStatus
  ) => Promise<void>;
  addResponsibility: (
    resp: Omit<FinancialResponsibility, "id" | "history">
  ) => Promise<void>;
  updateResponsibility: (
    id: string,
    data: Partial<Omit<FinancialResponsibility, "id" | "history">>
  ) => Promise<void>;
  reallocateBudget: (
    fromId: string,
    toId: string,
    amount: number
  ) => Promise<boolean>;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<
    React.SetStateAction<NotificationSettings>
  >;
  saveNotificationSettings: (settings: NotificationSettings) => Promise<void>;
  userNotificationPreferences: UserNotificationPreferences;
  setUserNotificationPreferences: React.Dispatch<
    React.SetStateAction<UserNotificationPreferences>
  >;
  sendNotification: (
    trigger: NotificationTrigger,
    details: Record<string, string | number>,
    recipients: string[]
  ) => void;
  toasts: { id: number; message: string; type: "success" | "error" }[];
  addToast: (message: string, type: "success" | "error") => void;
  removeToast: (id: number) => void;
  isLoading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [responsibilities, setResponsibilities] = useState<
    FinancialResponsibility[]
  >([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(INITIAL_NOTIFICATION_SETTINGS);
  const [userNotificationPreferences, setUserNotificationPreferences] =
    useState<UserNotificationPreferences>(INITIAL_USER_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, addToast, removeToast } = useNotifications();
  const [translations, setTranslations] = useState<{ en: any; ar: any } | null>(
    null
  );
  const [dataSource, setDataSource] = useState<DataSource>("demo");

  const api = dataSource === "demo" ? mockApi : realApi;

  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem("language") as Language) || "en"
  );

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const [enRes, arRes] = await Promise.all([
          fetch("/i18n/locales/en.json"),
          fetch("/i18n/locales/ar.json"),
        ]);
        const en = await enRes.json();
        const ar = await arRes.json();
        setTranslations({ en, ar });
      } catch (error) {
        console.error("Failed to load translations:", error);
        setTranslations({ en: {}, ar: {} });
      }
    };
    fetchTranslations();
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = useCallback(
    (key: string, replacements?: Record<string, string | number>): string => {
      if (!translations) {
        return key;
      }
      let translation = key
        .split(".")
        .reduce((obj: any, k) => obj?.[k], translations[language]);

      if (typeof translation !== "string") {
        translation = key
          .split(".")
          .reduce((obj: any, k) => obj?.[k], translations.en);
        if (typeof translation !== "string") return key;
      }

      if (replacements) {
        Object.keys(replacements).forEach((placeholder) => {
          const regex = new RegExp(`{${placeholder}}`, "g");
          translation = translation.replace(
            regex,
            String(replacements[placeholder])
          );
        });
      }

      return translation;
    },
    [language, translations]
  );

  // Fetch all data including settings
  const fetchData = useCallback(async () => {
    if (currentUser && translations) {
      setIsLoading(true);
      const [
        fetchedUsers,
        fetchedGroups,
        fetchedVendors,
        fetchedResponsibilities,
        fetchedExpenses,
        fetchedSettings,
      ] = await Promise.all([
        api.getUsers(),
        api.getGroups(),
        api.getVendors(),
        api.getResponsibilities(),
        api.getExpenses(),
        api.getNotificationSettings
          ? api.getNotificationSettings()
          : Promise.resolve(INITIAL_NOTIFICATION_SETTINGS),
      ]);
      setUsers(fetchedUsers);
      setGroups(fetchedGroups);
      setVendors(fetchedVendors);
      setResponsibilities(fetchedResponsibilities);
      setExpenses(fetchedExpenses);

      // Merge fetched settings with defaults to ensure structure integrity
      if (fetchedSettings) {
        setNotificationSettings((prev) => ({ ...prev, ...fetchedSettings }));
      }

      setIsLoading(false);
    } else if (translations && !currentUser) {
      setIsLoading(false);
    }
  }, [currentUser, translations, api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const user = await api.login(email, password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setUsers([]);
    setGroups([]);
    setVendors([]);
    setResponsibilities([]);
    setExpenses([]);
  };

  const updateGroupMemberships = async (userId: string, groupIds: string[]) => {
    const groupUpdates = groups.map(async (group) => {
      const isSelected = groupIds.includes(group.id);
      const isMember = group.memberIds.includes(userId);

      if (isSelected && !isMember) {
        const newMemberIds = [...group.memberIds, userId];
        await api.updateGroup(group.id, { memberIds: newMemberIds });
      } else if (!isSelected && isMember) {
        const newMemberIds = group.memberIds.filter((id) => id !== userId);
        await api.updateGroup(group.id, { memberIds: newMemberIds });
      }
    });
    await Promise.all(groupUpdates);
    const updatedGroups = await api.getGroups();
    setGroups(updatedGroups);
  };

  const addUser = async (userData: Omit<User, "id">, groupIds: string[]) => {
    const newUser = await api.addUser(userData);
    setUsers((prev) => [...prev, newUser]);
    if (groupIds.length > 0) {
      await updateGroupMemberships(newUser.id, groupIds);
    }
    addToast("User added successfully!", "success");
  };

  const updateUser = async (
    userId: string,
    userData: Partial<Omit<User, "id" | "password">>,
    groupIds?: string[]
  ) => {
    const updatedUser = await api.updateUser(userId, userData);
    if (updatedUser) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      if (groupIds) {
        await updateGroupMemberships(userId, groupIds);
      }
      addToast("User updated successfully!", "success");
    }
  };

  const deleteUser = async (userId: string) => {
    const success = await api.deleteUser(userId);
    if (success) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      addToast("User deleted successfully!", "success");
    } else {
      addToast("Failed to delete user.", "error");
    }
  };

  const resetPassword = async (userId: string) => {
    const success = await api.resetPassword(userId);
    if (success) {
      addToast("Password reset link sent to user email.", "success");
    } else {
      addToast("Failed to send reset link.", "error");
    }
  };

  const saveNotificationSettings = async (settings: NotificationSettings) => {
    if (api.saveNotificationSettings) {
      await api.saveNotificationSettings(settings);
      setNotificationSettings(settings);
      addToast("Notification settings saved!", "success");
    }
  };

  const sendNotification = useCallback(
    async (
      trigger: NotificationTrigger,
      details: Record<string, string | number>,
      recipients: string[]
    ) => {
      const templates = notificationSettings.templates[trigger];
      if (!templates) return;

      // Use current app language for the email template, or fallback to English
      const template = templates[language] || templates["en"];

      let subject = template.subject;
      let body = template.body;

      for (const key in details) {
        const regex = new RegExp(`{${key}}`, "g");
        subject = subject.replace(regex, String(details[key]));
        body = body.replace(regex, String(details[key]));
      }

      if (recipients.length > 0) {
        // Join multiple recipients with comma for Nodemailer
        await api.sendEmail(recipients.join(","), subject, body);
      }

      const toastMessage = details._toastMessage
        ? String(details._toastMessage)
        : `[Email Sent] Subject: ${subject}`;
      addToast(toastMessage, "success");
    },
    [notificationSettings.templates, addToast, api, language]
  );

  const addExpense = async (
    expenseData: Omit<Expense, "id" | "status" | "submittedBy">
  ) => {
    if (!currentUser) return;

    const existingVendor = vendors.find(
      (v) => v.name.toLowerCase() === expenseData.vendor.toLowerCase()
    );
    if (!existingVendor) {
      const newVendor = await api.addVendor({ name: expenseData.vendor });
      setVendors((prev) => [...prev, newVendor]);
    }

    const newExpense = await api.addExpense(expenseData, currentUser.id);
    setExpenses((prev) => [newExpense, ...prev]);

    // Notify all Finance Managers about the new invoice
    const managers = users
      .filter((u) => u.role === Role.FINANCE_MANAGER)
      .map((u) => u.email);

    sendNotification(
      NotificationTrigger.NEW_INVOICE,
      {
        vendor: newExpense.vendor,
        total: newExpense.total,
        userName: currentUser.name,
      },
      managers
    );

    addToast("Expense submitted successfully!", "success");
  };

  const updateExpenseStatus = async (
    expenseId: string,
    status: ExpenseStatus
  ) => {
    const updatedExpense = await api.updateExpenseStatus(expenseId, status);
    if (updatedExpense) {
      setExpenses((prev) =>
        prev.map((exp) => (exp.id === expenseId ? updatedExpense : exp))
      );
      const trigger =
        status === ExpenseStatus.APPROVED
          ? NotificationTrigger.EXPENSE_APPROVED
          : NotificationTrigger.EXPENSE_REJECTED;

      // Notify the submitter
      const submitter = users.find((u) => u.id === updatedExpense.submittedBy);
      if (submitter) {
        sendNotification(
          trigger,
          { vendor: updatedExpense.vendor, total: updatedExpense.total },
          [submitter.email]
        );
      }

      addToast(`Expense ${status.toLowerCase()}`, "success");
    }
  };

  const addResponsibility = async (
    respData: Omit<FinancialResponsibility, "id" | "history">
  ) => {
    if (!currentUser) return;
    const newResp = await api.addResponsibility(respData, currentUser.name);
    setResponsibilities((prev) => [...prev, newResp]);

    // Notify Assignee(s)
    let recipients: string[] = [];
    if (newResp.assignee.type === "user") {
      const user = users.find((u) => u.id === newResp.assignee.id);
      if (user) recipients.push(user.email);
    } else {
      const group = groups.find((g) => g.id === newResp.assignee.id);
      if (group) {
        recipients = users
          .filter((u) => group.memberIds.includes(u.id))
          .map((u) => u.email);
      }
    }

    sendNotification(
      NotificationTrigger.RESPONSIBILITY_ASSIGNED,
      {
        responsibilityName: newResp.name,
        budget: newResp.budget,
      },
      recipients
    );

    addToast("Financial responsibility created!", "success");
  };

  const updateResponsibility = async (
    id: string,
    respData: Partial<Omit<FinancialResponsibility, "id" | "history">>
  ) => {
    if (!currentUser) return;
    const updated = await api.updateResponsibility(id, {
      ...respData,
      editorName: currentUser.name,
    });
    if (updated) {
      setResponsibilities((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
      addToast("Responsibility updated successfully!", "success");
    } else {
      addToast("Failed to update responsibility.", "error");
    }
  };

  const reallocateBudget = async (
    fromId: string,
    toId: string,
    amount: number
  ) => {
    if (!currentUser) return false;
    const result = await api.reallocateBudget(
      fromId,
      toId,
      amount,
      currentUser.name
    );
    if (result.success) {
      setResponsibilities((prev) =>
        prev.map((r) => {
          const updated = result.updatedResponsibilities.find(
            (ur) => ur.id === r.id
          );
          return updated ? updated : r;
        })
      );
      addToast("Budget reallocated successfully!", "success");
    } else {
      addToast("Budget reallocation failed. Insufficient funds.", "error");
    }
    return result.success;
  };

  const value = {
    currentUser,
    login,
    logout,
    users,
    addUser,
    updateUser,
    deleteUser,
    resetPassword,
    groups,
    vendors,
    responsibilities,
    expenses,
    addExpense,
    updateExpenseStatus,
    addResponsibility,
    updateResponsibility,
    reallocateBudget,
    notificationSettings,
    setNotificationSettings,
    saveNotificationSettings,
    userNotificationPreferences,
    setUserNotificationPreferences,
    sendNotification,
    toasts,
    addToast,
    removeToast,
    isLoading,
    language,
    setLanguage,
    t,
    dataSource,
    setDataSource,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
