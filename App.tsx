import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Responsibilities from './components/Responsibilities';
import Notifications from './components/Notifications';
import UserManagement from './components/UserManagement'; // New
import Login from './components/Login'; // New
import { Page } from './types';
import { Spinner } from './components/UI';

const AppContent: React.FC = () => {
    const { isLoading, currentUser } = useAppContext();
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'expenses':
                return <Expenses />;
            case 'responsibilities':
                return <Responsibilities />;
            case 'notifications':
                return <Notifications />;
            case 'userManagement':
                return <UserManagement />;
            default:
                return <Dashboard />;
        }
    };

    // This loading state is for after login when fetching data
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner />
            </div>
        );
    }
    
    return (
        <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
            {renderPage()}
        </Layout>
    );
};

const Root: React.FC = () => {
    const { currentUser, isLoading } = useAppContext();

    if (isLoading) {
        return (
             <div className="flex items-center justify-center h-screen">
                <Spinner />
            </div>
        )
    }

    if (!currentUser) {
        return <Login />;
    }

    return <AppContent />;
}


const App: React.FC = () => {
    return (
        <AppProvider>
            <Root />
        </AppProvider>
    );
};

export default App;
