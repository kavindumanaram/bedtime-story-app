import React, { useState } from 'react';
import { Card } from '../components/Card';
import { User, Mail, Edit, Trash2, Plus, X, Check } from 'lucide-react';
import type { Child, ChildPreferences } from '@bedtime/shared';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

const AVATAR_COLORS = [
  { label: 'Green', value: '#10b981' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Pink', value: '#ec4899' },
];

const TONES = ['calm', 'adventurous', 'educational'] as const;
const LENGTHS = ['short', 'medium', 'long'] as const;

type ChildFormState = {
  name: string;
  age: number;
  avatar_color: string;
  interests: string[];
  tone: ChildPreferences['tone'];
  length: ChildPreferences['length'];
};

const defaultForm = (): ChildFormState => ({
  name: '',
  age: 6,
  avatar_color: AVATAR_COLORS[0].value,
  interests: [],
  tone: 'calm',
  length: 'medium',
});

function childToForm(child: Child): ChildFormState {
  return {
    name: child.name,
    age: child.age,
    avatar_color: child.avatar_color,
    interests: child.preferences?.interests ?? [],
    tone: child.preferences?.tone ?? 'calm',
    length: child.preferences?.length ?? 'medium',
  };
}

function InterestTags({
  interests,
  onChange,
}: {
  interests: string[];
  onChange: (next: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim().toLowerCase();
    if (val && !interests.includes(val)) {
      onChange([...interests, val]);
    }
    setInput('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {interests.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(interests.filter((t) => t !== tag))}
              className="hover:text-primary-dark"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="e.g. dragons"
          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ChildForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}: {
  form: ChildFormState;
  onChange: (f: ChildFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</span>
          <input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. Emma"
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Age</span>
          <input
            type="number"
            value={form.age}
            onChange={(e) => onChange({ ...form, age: Number(e.target.value) })}
            min={1}
            max={17}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full"
          />
        </label>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Colour</span>
        <div className="flex gap-2 pt-1">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange({ ...form, avatar_color: c.value })}
              aria-label={c.label}
              className={`w-7 h-7 rounded-full transition-all ${
                form.avatar_color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Interests</span>
        <InterestTags
          interests={form.interests}
          onChange={(interests) => onChange({ ...form, interests })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Story Tone</span>
          <div className="flex flex-col gap-1 pt-1">
            {TONES.map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.tone === t}
                  onChange={() => onChange({ ...form, tone: t })}
                  className="accent-primary"
                />
                <span className="text-sm capitalize text-gray-700">{t}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Story Length</span>
          <div className="flex flex-col gap-1 pt-1">
            {LENGTHS.map((l) => (
              <label key={l} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.length === l}
                  onChange={() => onChange({ ...form, length: l })}
                  className="accent-primary"
                />
                <span className="text-sm capitalize text-gray-700">{l}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!form.name.trim() || loading}
          className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export const Profile: React.FC = () => {
  const { profile, children, activeChild, setActiveChild, refreshChildren } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ChildFormState>(defaultForm());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<ChildFormState>(defaultForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = profile?.display_name || 'Parent';
  const initials = displayName.slice(0, 2).toUpperCase();

  const startEdit = (child: Child) => {
    setEditingId(child.id);
    setEditForm(childToForm(child));
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/children/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          age: editForm.age,
          avatar_color: editForm.avatar_color,
          preferences: { interests: editForm.interests, tone: editForm.tone, length: editForm.length },
        }),
      });
      await refreshChildren();
      setEditingId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/children', {
        method: 'POST',
        body: JSON.stringify({
          name: addForm.name.trim(),
          age: addForm.age,
          avatar_color: addForm.avatar_color,
          preferences: { interests: addForm.interests, tone: addForm.tone, length: addForm.length },
        }),
      });
      await refreshChildren();
      setShowAddForm(false);
      setAddForm(defaultForm());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (child: Child) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/children/${child.id}`, { method: 'DELETE' });
      if (activeChild?.id === child.id) {
        const remaining = children.filter((c) => c.id !== child.id);
        setActiveChild(remaining[0] ?? null);
      }
      await refreshChildren();
      setConfirmDeleteId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Parent Profile</h1>
        <p className="text-gray-600">Manage your account and children</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              {initials}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{displayName}</h2>
            <p className="text-sm text-gray-500 mb-4">{profile?.id ?? ''}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Children</span>
                <span className="text-gray-900 font-medium">{children.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Member Since</span>
                <span className="text-gray-900 font-medium">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Display Name</p>
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email Address</p>
                  <p className="text-sm font-medium text-gray-900">—</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Children Profiles */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Children Profiles</h3>
              {!showAddForm && (
                <button
                  onClick={() => { setShowAddForm(true); setEditingId(null); setAddForm(defaultForm()); }}
                  className="flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Child
                </button>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
            )}

            <div className="space-y-3">
              {children.map((child) => (
                <div key={child.id} className="rounded-xl border border-gray-100 overflow-hidden">
                  {/* Child row */}
                  <div className="flex items-center justify-between p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                        style={{ backgroundColor: child.avatar_color }}
                      >
                        {child.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{child.name}</p>
                        <p className="text-xs text-gray-500">
                          Age {child.age}
                          {child.preferences?.tone ? ` · ${child.preferences.tone}` : ''}
                          {child.preferences?.length ? ` · ${child.preferences.length}` : ''}
                        </p>
                        {(child.preferences?.interests?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {child.preferences!.interests.map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => editingId === child.id ? setEditingId(null) : startEdit(child)}
                        className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                        title="Edit"
                      >
                        {editingId === child.id ? <Check className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(child.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Confirm delete */}
                  {confirmDeleteId === child.id && (
                    <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between gap-3">
                      <p className="text-sm text-red-700">Delete {child.name}'s profile?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(child)}
                          disabled={loading}
                          className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Edit form */}
                  {editingId === child.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-white">
                      <ChildForm
                        form={editForm}
                        onChange={setEditForm}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingId(null)}
                        loading={loading}
                        submitLabel="Save Changes"
                      />
                    </div>
                  )}
                </div>
              ))}

              {children.length === 0 && !showAddForm && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No children yet.{' '}
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="text-primary hover:underline"
                  >
                    Add your first child
                  </button>
                </p>
              )}
            </div>

            {/* Add child form */}
            {showAddForm && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-800 mb-2">New Child Profile</p>
                <ChildForm
                  form={addForm}
                  onChange={setAddForm}
                  onSubmit={handleAdd}
                  onCancel={() => setShowAddForm(false)}
                  loading={loading}
                  submitLabel="Add Child"
                />
              </div>
            )}
          </Card>

          {/* Account Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 text-left transition-colors font-medium">
                Change Password
              </button>
              <button className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 text-left transition-colors font-medium">
                Export My Data
              </button>
              <button className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg text-sm text-red-600 text-left transition-colors font-medium">
                Delete Account
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
