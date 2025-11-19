import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, Button, Input, Spinner } from './UI';
import LanguageSwitcher from './LanguageSwitcher';

const Login: React.FC = () => {
    const { login, isLoading, t, dataSource, setDataSource } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = await login(email, password);
        if (!success) {
            setError(t('login.error'));
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative">
             <div className="absolute top-5 ltr:right-5 rtl:left-5">
                <LanguageSwitcher />
            </div>
             <div className="flex items-center space-x-2 mb-8">
                 <svg className="w-10 h-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8l3 5m0 0l3-5m-3 5v4m-3-5h6m-6 4h6m2-11H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" />
                </svg>
                <span className="text-4xl font-extrabold text-text-main">{t('appName')}</span>
            </div>
            <Card className="max-w-md w-full">
                <h2 className="text-2xl font-bold text-center text-text-main mb-6">{t('login.title')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-text-dim mb-2">{t('login.dataSource')}</label>
                        <div className="flex rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={() => setDataSource('demo')}
                                className={`px-4 py-2 text-sm font-medium rounded-s-lg border transition-colors ${dataSource === 'demo' ? 'bg-primary text-white border-primary' : 'bg-white text-text-main border-gray-200 hover:bg-gray-50'}`}
                            >
                                {t('login.demoData')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDataSource('real')}
                                className={`px-4 py-2 text-sm font-medium rounded-e-lg border border-s-0 transition-colors ${dataSource === 'real' ? 'bg-primary text-white border-primary' : 'bg-white text-text-main border-gray-200 hover:bg-gray-50'}`}
                            >
                                {t('login.realDatabase')}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-dim mb-1">{t('login.emailLabel')}</label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('login.emailPlaceholder')}
                        />
                    </div>
                    <div>
                         <label htmlFor="password" className="block text-sm font-medium text-text-dim mb-1">{t('login.passwordLabel')}</label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('login.passwordPlaceholder')}
                        />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div>
                        <Button type="submit" className="w-full flex justify-center" disabled={isLoading}>
                            {isLoading ? <Spinner /> : t('login.signIn')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Login;