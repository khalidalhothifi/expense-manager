import React, { useState, ReactNode } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, Role } from '../types';
import { ToastContainer } from '../hooks/useNotifications';
import LanguageSwitcher from './LanguageSwitcher';

const Sidebar: React.FC<{ currentPage: Page; setCurrentPage: (page: Page) => void; isOpen: boolean }> = ({ currentPage, setCurrentPage, isOpen }) => {
    const { currentUser, t } = useAppContext();
    const navItems = [
        { id: 'dashboard', label: t('sidebar.dashboard'), icon: <HomeIcon /> },
        { id: 'expenses', label: t('sidebar.expenses'), icon: <ReceiptIcon /> },
    ];

    if (currentUser.role === Role.FINANCE_MANAGER) {
        navItems.push({ id: 'responsibilities', label: t('sidebar.responsibilities'), icon: <UsersIcon /> });
        navItems.push({ id: 'notifications', label: t('sidebar.notifications'), icon: <BellIcon /> });
        navItems.push({ id: 'userManagement', label: t('sidebar.userManagement'), icon: <CogIcon /> });
    }

    return (
        <aside className={`bg-sidebar text-text-light w-64 space-y-6 py-7 px-2 fixed inset-y-0 start-0 transform ${isOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"} transition-transform duration-200 ease-in-out z-20 md:translate-x-0`}>
            <a href="#" className="text-white flex items-center space-x-2 px-4">
                <svg className="w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8l3 5m0 0l3-5m-3 5v4m-3-5h6m-6 4h6m2-11H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" />
                </svg>
                <span className="text-2xl font-extrabold">{t('appName')}</span>
            </a>

            <nav>
                {navItems.map(item => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={() => setCurrentPage(item.id as Page)}
                        className={`w-full flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 ${
                            currentPage === item.id ? 'bg-sidebar-accent text-white' : 'hover:bg-sidebar-accent hover:text-white'
                        }`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </a>
                ))}
            </nav>
        </aside>
    );
};

const Header: React.FC<{ toggleSidebar: () => void }> = ({ toggleSidebar }) => {
    const { currentUser, logout, t } = useAppContext();
    return (
        <header className="py-4 px-6 bg-white shadow-sm flex items-center justify-between">
            <button className="text-gray-500 focus:outline-none md:hidden" onClick={toggleSidebar}>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6H20M4 12H20M4 18H11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            <div className="flex-1 text-center text-2xl font-bold text-text-main hidden md:block">
                {t('header.welcome', { name: currentUser.name })}
            </div>
            <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <span className="text-sm text-text-dim hidden sm:inline">{currentUser.name} ({t(`enums.role.${currentUser.role === Role.FINANCE_MANAGER ? 'manager' : 'user'}`)})</span>
                 <button onClick={logout} className="flex items-center text-sm font-medium text-red-500 hover:text-red-700">
                    <LogoutIcon />
                    <span className="ms-1">{t('header.logout')}</span>
                 </button>
            </div>
        </header>
    );
};

export const Layout: React.FC<{ children: ReactNode, currentPage: Page, setCurrentPage: (page: Page) => void }> = ({ children, currentPage, setCurrentPage }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { toasts, removeToast } = useAppContext();

    return (
        <div className="relative min-h-screen">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isOpen={sidebarOpen} />
            <div className="flex flex-col flex-1 md:ms-64">
                <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};


// Icons
const HomeIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ReceiptIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const UsersIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-3-5.197M15 21a9 9 0 00-9-9" /></svg>;
const BellIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const CogIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5 rtl:scale-x-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
