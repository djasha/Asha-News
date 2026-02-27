import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
    UsersIcon,
    Cog6ToothIcon,
    ChartBarIcon,
    NewspaperIcon,
    ArrowLeftOnRectangleIcon,
    CreditCardIcon,
    RssIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
    const location = useLocation();
    const { logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: ChartBarIcon },
        { name: 'Site Settings', href: '/admin/settings', icon: Cog6ToothIcon },
        { name: 'User Management', href: '/admin/users', icon: UsersIcon },
        { name: 'Content', href: '/admin/content', icon: NewspaperIcon },
        { name: 'RSS Sources', href: '/admin/rss', icon: RssIcon },
        { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCardIcon },
    ];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark shadow-lg z-10 hidden md:flex flex-col">
                <div className="flex items-center justify-center h-16 border-b border-border-light dark:border-border-dark">
                    <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        Asha News Admin
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="px-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                                            : 'text-text-secondary-light hover:bg-background-light dark:text-text-secondary-dark dark:hover:bg-background-dark'
                                        }`}
                                >
                                    <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-border-light dark:border-border-dark">
                    <button
                        onClick={logout}
                        className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-20 md:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed inset-y-0 left-0 w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark shadow-lg z-30 flex flex-col">
                        <div className="flex items-center justify-between h-16 px-4 border-b border-border-light dark:border-border-dark">
                            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">Admin</span>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-md text-text-secondary-light hover:bg-background-light dark:text-text-secondary-dark dark:hover:bg-background-dark">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                                            : 'text-text-secondary-light hover:bg-background-light dark:text-text-secondary-dark dark:hover:bg-background-dark'
                                        }`}
                                    >
                                        <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="p-4 border-t border-border-light dark:border-border-dark">
                            <button
                                onClick={logout}
                                className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md"
                            >
                                <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between h-16 px-4 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
                    <Link to="/" className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        Asha Admin
                    </Link>
                    <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-md text-text-secondary-light hover:bg-background-light dark:text-text-secondary-dark dark:hover:bg-background-dark">
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                </div>

                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
