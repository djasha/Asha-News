import React, { useState, useEffect } from 'react';
import { useSiteConfig } from '../../contexts/SiteConfigContext';

const SiteSettings = () => {
    const { config, updateConfig, loading: configLoading } = useSiteConfig();
    const [formData, setFormData] = useState({
        site_name: '',
        site_description: '',
        contact_email: '',
        support_email: ''
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (config) {
            setFormData({
                site_name: config.site_name || '',
                site_description: config.site_description || '',
                contact_email: config.contact_email || '',
                support_email: config.support_email || ''
            });
        }
    }, [config]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await updateConfig(formData);
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (error) {
            console.error('Error updating settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (configLoading) {
        return <div className="p-4 text-center text-text-secondary-light dark:text-text-secondary-dark">Loading settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
                Site Settings
            </h1>

            <div className="bg-surface-light dark:bg-surface-dark shadow rounded-lg p-6 border border-border-light dark:border-border-dark">
                {message.text && (
                    <div className={`mb-4 p-4 rounded-md ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                            <label htmlFor="site_name" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                Site Name
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="site_name"
                                    id="site_name"
                                    value={formData.site_name}
                                    onChange={handleChange}
                                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-6">
                            <label htmlFor="site_description" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                Site Description
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="site_description"
                                    name="site_description"
                                    rows={3}
                                    value={formData.site_description}
                                    onChange={handleChange}
                                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark"
                                />
                            </div>
                            <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                Brief description of your site for SEO and meta tags.
                            </p>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="contact_email" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                Contact Email
                            </label>
                            <div className="mt-1">
                                <input
                                    type="email"
                                    name="contact_email"
                                    id="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleChange}
                                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="support_email" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                Support Email
                            </label>
                            <div className="mt-1">
                                <input
                                    type="email"
                                    name="support_email"
                                    id="support_email"
                                    value={formData.support_email}
                                    onChange={handleChange}
                                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${saving ? 'opacity-75 cursor-not-allowed' : ''
                                }`}
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SiteSettings;
