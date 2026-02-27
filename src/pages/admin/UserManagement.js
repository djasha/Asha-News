import React, { useState, useEffect } from 'react';
import {
    PencilSquareIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users?limit=100');
                const payload = response.ok ? await response.json() : { users: [] };
                const items = Array.isArray(payload?.users) ? payload.users : [];

                const normalized = items.map((user) => ({
                    id: user.id,
                    name: user.display_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown User',
                    email: user.email || '-',
                    role: user.role || 'user',
                    status: user.status || 'active'
                }));

                setUsers(normalized);
            } catch (error) {
                console.error('Error fetching users:', error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return <div className="p-4 text-center text-text-secondary-light dark:text-text-secondary-dark">Loading users...</div>;
    }

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">Users</h1>
                    <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        A list of all users in your account including their name, title, email and role.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
                    >
                        Add user
                    </button>
                </div>
            </div>

            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-border-light dark:ring-border-dark md:rounded-lg bg-surface-light dark:bg-surface-dark">
                            <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                                <thead className="bg-background-light dark:bg-background-dark">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-text-primary-light dark:text-text-primary-dark sm:pl-6">
                                            Name
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                                            Email
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                                            Role
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                                            Status
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Edit</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark bg-surface-light dark:bg-surface-dark">
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                No users available.
                                            </td>
                                        </tr>
                                    )}
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-text-primary-light dark:text-text-primary-dark sm:pl-6">
                                                {user.name}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                {user.email}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${user.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                {user.status}
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4">
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                    <span className="sr-only">Edit, {user.name}</span>
                                                </button>
                                                <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                                    <TrashIcon className="h-5 w-5" />
                                                    <span className="sr-only">Delete, {user.name}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
