import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { API_BASE } from '../../config/api';

const emptyTier = {
  name: '',
  slug: '',
  description: '',
  price_monthly: 0,
  price_yearly: 0,
  features: [],
  limits: { articles_per_day: 10, saved_articles: 20 },
  is_active: true,
  sort_order: 0,
  badge_color: '#6B7280',
};

function TierForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...emptyTier, ...initial });
  const [featuresText, setFeaturesText] = useState(
    (initial?.features || []).join('\n')
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when switching between edit targets
  useEffect(() => {
    setForm({ ...emptyTier, ...initial });
    setFeaturesText((initial?.features || []).join('\n'));
    setError(null);
  }, [initial]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const features = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);
      await onSave({ ...form, features });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {initial?.id ? 'Edit Tier' : 'New Tier'}
      </h3>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            required
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price_monthly}
            onChange={(e) => handleChange('price_monthly', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yearly Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price_yearly}
            onChange={(e) => handleChange('price_yearly', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Badge Color</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={form.badge_color}
              onChange={(e) => handleChange('badge_color', e.target.value)}
              className="h-9 w-12 rounded border border-gray-300 dark:border-slate-600 cursor-pointer"
            />
            <input
              type="text"
              value={form.badge_color}
              onChange={(e) => handleChange('badge_color', e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Features (one per line)
        </label>
        <textarea
          rows={5}
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          placeholder="Unlimited articles&#10;Full bias analysis&#10;Ad-free experience"
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Articles/day (-1 = unlimited)</label>
          <input
            type="number"
            value={form.limits?.articles_per_day ?? 10}
            onChange={(e) => handleChange('limits', { ...form.limits, articles_per_day: parseInt(e.target.value, 10) })}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Saved articles (-1 = unlimited)</label>
          <input
            type="number"
            value={form.limits?.saved_articles ?? 20}
            onChange={(e) => handleChange('limits', { ...form.limits, saved_articles: parseInt(e.target.value, 10) })}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sort Order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => handleChange('sort_order', parseInt(e.target.value, 10) || 0)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => handleChange('is_active', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : initial?.id ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

function TierCard({ tier, onEdit, onDelete }) {
  const features = Array.isArray(tier.features) ? tier.features : [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: tier.badge_color || '#6B7280' }}
          />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tier.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          {tier.is_active ? (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          ) : (
            <XCircleIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{tier.description}</p>

      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          ${tier.price_monthly || 0}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
        {tier.price_yearly > 0 && (
          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
            (${tier.price_yearly}/yr)
          </span>
        )}
      </div>

      <ul className="flex-1 space-y-1 mb-4">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={() => onEdit(tier)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-md"
        >
          <PencilSquareIcon className="w-4 h-4" />
          Edit
        </button>
        {!tier.is_default && (
          <button
            onClick={() => onDelete(tier)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-md"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionTiers() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | tier object
  const [error, setError] = useState(null);

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/subscription-tiers?all=true`);
      if (!res.ok) throw new Error('Failed to fetch tiers');
      const json = await res.json();
      setTiers(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const handleSave = async (data) => {
    const isUpdate = data.id;
    const url = isUpdate
      ? `${API_BASE}/subscription-tiers/${data.id}`
      : `${API_BASE}/subscription-tiers`;
    const method = isUpdate ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'Save failed');
    }

    setEditing(null);
    fetchTiers();
  };

  const handleDelete = async (tier) => {
    if (!window.confirm(`Delete tier "${tier.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/subscription-tiers/${tier.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Delete failed');
      }
      fetchTiers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Subscription Tiers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage pricing, features, and limits for each subscription tier.
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            <PlusIcon className="w-4 h-4" />
            Add Tier
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            dismiss
          </button>
        </div>
      )}

      {editing && (
        <TierForm
          initial={editing === 'new' ? emptyTier : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            onEdit={(t) => setEditing(t)}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {tiers.length === 0 && !editing && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No subscription tiers configured. Click "Add Tier" to create one.
        </div>
      )}
    </div>
  );
}
