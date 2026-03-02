import React, { useState, useEffect } from 'react';
import {
    UsersIcon,
    NewspaperIcon,
    EyeIcon,
    ServerIcon
} from '@heroicons/react/24/outline';
import { buildAuthHeaders } from '../../utils/authHeaders';

const ICON_COLOR_CLASS = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    indigo: 'text-indigo-500'
};

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-surface-light dark:bg-surface-dark overflow-hidden rounded-lg shadow border border-border-light dark:border-border-dark">
        <div className="p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 ${ICON_COLOR_CLASS[color] || 'text-primary-500'}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark truncate">
                            {title}
                        </dt>
                        <dd>
                            <div className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark">
                                {value}
                            </div>
                        </dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        articles: 0,
        views: 0,
        systemStatus: 'Unknown'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const headers = await buildAuthHeaders();
                const [usersRes, articlesRes, healthRes] = await Promise.all([
                    fetch('/api/users?limit=100', { headers }),
                    fetch('/api/articles?limit=50'),
                    fetch('/api/health')
                ]);

                const usersPayload = usersRes.ok ? await usersRes.json() : { users: [] };
                const articlesPayload = articlesRes.ok ? await articlesRes.json() : { data: [], pagination: { total: 0 } };
                const healthPayload = healthRes.ok ? await healthRes.json() : { status: 'unavailable' };

                const users = Array.isArray(usersPayload?.users) ? usersPayload.users.length : 0;
                const articles = Number(articlesPayload?.pagination?.total || 0);
                const views = (Array.isArray(articlesPayload?.data) ? articlesPayload.data : [])
                    .reduce((sum, article) => sum + Number(article?.view_count || 0), 0);

                setStats({
                    users,
                    articles,
                    views,
                    systemStatus: healthPayload?.status === 'healthy' ? 'Healthy' : 'Unhealthy'
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
                setStats({
                    users: 0,
                    articles: 0,
                    views: 0,
                    systemStatus: 'Unavailable'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="p-4 text-center text-text-secondary-light dark:text-text-secondary-dark">Loading dashboard...</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
                Dashboard
            </h1>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={stats.users.toLocaleString()}
                    icon={UsersIcon}
                    color="blue"
                />
                <StatCard
                    title="Total Articles"
                    value={stats.articles.toLocaleString()}
                    icon={NewspaperIcon}
                    color="green"
                />
                <StatCard
                    title="Daily Views"
                    value={stats.views.toLocaleString()}
                    icon={EyeIcon}
                    color="purple"
                />
                <StatCard
                    title="System Status"
                    value={stats.systemStatus}
                    icon={ServerIcon}
                    color="indigo"
                />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Activity Placeholder */}
                <div className="bg-surface-light dark:bg-surface-dark shadow rounded-lg p-6 border border-border-light dark:border-border-dark">
                    <h2 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-4">
                        Recent Activity
                    </h2>
                    <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                        No recent activity to display.
                    </div>
                </div>

                {/* System Health Placeholder */}
                <div className="bg-surface-light dark:bg-surface-dark shadow rounded-lg p-6 border border-border-light dark:border-border-dark">
                    <h2 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-4">
                        System Health
                    </h2>
                    <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                        All systems operational.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
