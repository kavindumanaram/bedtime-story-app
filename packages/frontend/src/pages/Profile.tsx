import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Mail, Edit2, Trash2, Plus, X, ChevronRight } from 'lucide-react';
import type { Child, ChildPreferences } from '@bedtime/shared';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

const AVATAR_COLORS = [
  { label: 'Green',  value: '#10b981' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Blue',   value: '#3b82f6' },
  { label: 'Amber',  value: '#f59e0b' },
  { label: 'Pink',   value: '#ec4899' },
];

const TONES   = ['calm', 'adventurous', 'educational'] as const;
const LENGTHS = ['short', 'medium', 'long']           as const;

type ChildFormState = {
  name: string;
  age: number;
  avatar_color: string;
  interests: string[];
  tone: ChildPreferences['tone'];
  length: ChildPreferences['length'];
};

const defaultForm = (): ChildFormState => ({
  name: '', age: 6, avatar_color: AVATAR_COLORS[0].value,
  interests: [], tone: 'calm', length: 'medium',
});

function childToForm(child: Child): ChildFormState {
  return {
    name: child.name, age: child.age, avatar_color: child.avatar_color,
    interests: child.preferences?.interests ?? [],
    tone: child.preferences?.tone ?? 'calm',
    length: child.preferences?.length ?? 'medium',
  };
}

function InterestTags({ interests, onChange }: { interests: string[]; onChange: (next: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const val = input.trim().toLowerCase();
    if (val && !interests.includes(val)) onChange([...interests, val]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {interests.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
            {tag}
            <button type="button" onClick={() => onChange(interests.filter((t) => t !== tag))}>
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
          className="flex-1 px-3 py-2 rounded-2xl text-sm focus:outline-none"
          style={{ background: '#F4F3F9', border: '1.5px solid #E5E7EB', color: '#374151' }}
        />
        <button type="button" onClick={add}
          className="px-4 py-2 rounded-2xl text-sm font-bold transition-colors"
          style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
          Add
        </button>
      </div>
    </div>
  );
}

function SegmentPicker<T extends string>({
  options, value, onChange,
}: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className="px-3 py-2 rounded-2xl text-xs font-bold transition-all capitalize text-left"
          style={value === opt
            ? { background: '#0b1220', color: '#fff' }
            : { background: '#F4F3F9', color: '#6B7280', border: '1.5px solid #E5E7EB' }
          }
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ChildForm({
  form, onChange, onSubmit, onCancel, loading, submitLabel,
}: {
  form: ChildFormState;
  onChange: (f: ChildFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9CA3AF' }}>Name</p>
          <input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. Emma"
            className="w-full px-3 py-2.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: '#F4F3F9', border: '1.5px solid #E5E7EB', color: '#374151' }}
          />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9CA3AF' }}>Age</p>
          <input
            type="number" value={form.age} min={1} max={17}
            onChange={(e) => onChange({ ...form, age: Number(e.target.value) })}
            className="w-full px-3 py-2.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: '#F4F3F9', border: '1.5px solid #E5E7EB', color: '#374151' }}
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Colour</p>
        <div className="flex gap-2">
          {AVATAR_COLORS.map((c) => (
            <button key={c.value} type="button" onClick={() => onChange({ ...form, avatar_color: c.value })}
              aria-label={c.label}
              className="w-8 h-8 rounded-full transition-all"
              style={{
                backgroundColor: c.value,
                boxShadow: form.avatar_color === c.value ? `0 0 0 3px #fff, 0 0 0 5px ${c.value}` : 'none',
                transform: form.avatar_color === c.value ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Interests</p>
        <InterestTags interests={form.interests} onChange={(interests) => onChange({ ...form, interests })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Story Tone</p>
          <SegmentPicker options={TONES} value={form.tone} onChange={(tone) => onChange({ ...form, tone })} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Story Length</p>
          <SegmentPicker options={LENGTHS} value={form.length} onChange={(length) => onChange({ ...form, length })} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onSubmit} disabled={!form.name.trim() || loading}
          className="flex-1 py-2.5 rounded-2xl text-sm font-black transition-all"
          style={{ background: '#0b1220', color: '#fff', opacity: (!form.name.trim() || loading) ? 0.4 : 1 }}>
          {loading ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors"
          style={{ background: '#F4F3F9', color: '#6B7280', border: '1.5px solid #E5E7EB' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export const Profile: React.FC = () => {
  const { profile, children, activeChild, setActiveChild, refreshChildren } = useAuth();
  const [searchParams] = useSearchParams();

  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [editForm,       setEditForm]       = useState<ChildFormState>(defaultForm());
  const [showAddForm,    setShowAddForm]    = useState(false);
  const [addForm,        setAddForm]        = useState<ChildFormState>(defaultForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('addChild') === 'true') {
      setShowAddForm(true);
      setEditingId(null);
      setAddForm(defaultForm());
    }
  }, [searchParams]);

  const displayName = profile?.display_name || 'Parent';
  const initials    = displayName.slice(0, 2).toUpperCase();

  const startEdit = (child: Child) => {
    setEditingId(child.id);
    setEditForm(childToForm(child));
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setLoading(true); setError(null);
    try {
      await apiFetch(`/api/children/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(), age: editForm.age, avatar_color: editForm.avatar_color,
          preferences: { interests: editForm.interests, tone: editForm.tone, length: editForm.length },
        }),
      });
      await refreshChildren();
      setEditingId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    setLoading(true); setError(null);
    try {
      await apiFetch('/api/children', {
        method: 'POST',
        body: JSON.stringify({
          name: addForm.name.trim(), age: addForm.age, avatar_color: addForm.avatar_color,
          preferences: { interests: addForm.interests, tone: addForm.tone, length: addForm.length },
        }),
      });
      await refreshChildren();
      setShowAddForm(false);
      setAddForm(defaultForm());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add child');
    } finally { setLoading(false); }
  };

  const handleDelete = async (child: Child) => {
    setLoading(true); setError(null);
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
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">

      {/* ── Dark hero header ─────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f0e23,#1a1535,#0d1117)', minHeight: 170 }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(124,58,237,0.3) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '5%', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(6,182,212,0.25) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {['👨‍👩‍👧', '⭐', '✨'].map((ch, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${15 + i * 25}%`, right: `${8 + i * 10}%`,
            fontSize: 20 + i * 5, opacity: 0.5, pointerEvents: 'none',
            animation: `floatProfile ${6 + i}s ease-in-out ${i * 0.8}s infinite`,
          }}>{ch}</div>
        ))}

        <div className="relative z-10 p-7 pb-6 flex items-end gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(124,58,237,0.8)' }}>
                Parent Account
              </span>
            </div>
            <h1 className="text-white font-black mb-0.5" style={{ fontSize: 'clamp(20px,4vw,28px)', letterSpacing: '-0.02em' }}>
              {displayName}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              {children.length} {children.length === 1 ? 'child' : 'children'} · member since{' '}
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Personal Information ─────────────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: '#fff', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 12px rgba(16,24,40,0.06)' }}>
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid #F4F3F9' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(124,58,237,0.1)' }}>
            <User className="w-5 h-5" style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <h3 className="font-black text-[#0b1220]" style={{ fontSize: 15 }}>Personal Information</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Your account details</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: '#F4F3F9' }}>
          <div className="flex items-center gap-4 px-6 py-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#F4F3F9' }}>
              <User className="w-4 h-4" style={{ color: '#9CA3AF' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#9CA3AF' }}>Display Name</p>
              <p className="text-sm font-semibold" style={{ color: '#0b1220' }}>{displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6 py-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#F4F3F9' }}>
              <Mail className="w-4 h-4" style={{ color: '#9CA3AF' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#9CA3AF' }}>Email Address</p>
              <p className="text-sm font-semibold" style={{ color: '#0b1220' }}>—</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Children Profiles ────────────────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: '#fff', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 12px rgba(16,24,40,0.06)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #F4F3F9' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(6,182,212,0.1)' }}>
              <span style={{ fontSize: 18 }}>👧</span>
            </div>
            <div>
              <h3 className="font-black text-[#0b1220]" style={{ fontSize: 15 }}>Children Profiles</h3>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{children.length} profile{children.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {!showAddForm && (
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null); setAddForm(defaultForm()); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold transition-all"
              style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}
            >
              <Plus className="w-4 h-4" />
              Add Child
            </button>
          )}
        </div>

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <div className="divide-y" style={{ borderColor: '#F9FAFB' }}>
          {children.map((child) => (
            <div key={child.id}>
              {/* Child row */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-sm"
                    style={{ background: `linear-gradient(135deg,${child.avatar_color},${child.avatar_color}cc)` }}>
                    {child.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: '#0b1220' }}>{child.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                      Age {child.age}
                      {child.preferences?.tone   ? ` · ${child.preferences.tone}`   : ''}
                      {child.preferences?.length ? ` · ${child.preferences.length}` : ''}
                    </p>
                    {(child.preferences?.interests?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {child.preferences!.interests.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}>
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
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                    style={{ background: editingId === child.id ? 'rgba(124,58,237,0.1)' : '#F4F3F9',
                      color: editingId === child.id ? '#7c3aed' : '#9CA3AF' }}
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(confirmDeleteId === child.id ? null : child.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                    style={{ background: confirmDeleteId === child.id ? 'rgba(239,68,68,0.1)' : '#F4F3F9',
                      color: confirmDeleteId === child.id ? '#ef4444' : '#9CA3AF' }}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Confirm delete */}
              {confirmDeleteId === child.id && (
                <div className="mx-6 mb-4 px-4 py-3 rounded-2xl flex items-center justify-between gap-3"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>
                    Delete {child.name}'s profile?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(child)} disabled={loading}
                      className="px-4 py-1.5 rounded-xl text-xs font-black transition-colors"
                      style={{ background: '#ef4444', color: '#fff', opacity: loading ? 0.5 : 1 }}>
                      Delete
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold transition-colors"
                      style={{ background: '#F4F3F9', color: '#6B7280', border: '1.5px solid #E5E7EB' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Edit form */}
              {editingId === child.id && (
                <div className="px-6 pb-5" style={{ borderTop: '1px solid #F4F3F9', background: '#FAFAFE' }}>
                  <ChildForm
                    form={editForm} onChange={setEditForm}
                    onSubmit={handleUpdate} onCancel={() => setEditingId(null)}
                    loading={loading} submitLabel="Save Changes"
                  />
                </div>
              )}
            </div>
          ))}

          {children.length === 0 && !showAddForm && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold mb-1" style={{ color: '#9CA3AF' }}>No children yet</p>
              <button onClick={() => setShowAddForm(true)}
                className="text-sm font-bold transition-colors"
                style={{ color: '#7c3aed' }}>
                Add your first child →
              </button>
            </div>
          )}
        </div>

        {/* Add child form */}
        {showAddForm && (
          <div className="px-6 pb-6" style={{ borderTop: '1px solid #F4F3F9', background: '#FAFAFE' }}>
            <p className="text-sm font-black text-[#0b1220] pt-4 mb-0.5">New Child Profile</p>
            <ChildForm
              form={addForm} onChange={setAddForm}
              onSubmit={handleAdd} onCancel={() => setShowAddForm(false)}
              loading={loading} submitLabel="Add Child"
            />
          </div>
        )}
      </div>

      {/* ── Account Actions ──────────────────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: '#fff', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 12px rgba(16,24,40,0.06)' }}>
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #F4F3F9' }}>
          <h3 className="font-black text-[#0b1220]" style={{ fontSize: 15 }}>Account Actions</h3>
        </div>
        {[
          { label: 'Change Password',  color: '#374151' },
          { label: 'Export My Data',   color: '#374151' },
          { label: 'Delete Account',   color: '#ef4444' },
        ].map(({ label, color }, i, arr) => (
          <button key={label}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold transition-colors hover:bg-[#FAFAFE]"
            style={{ color, borderBottom: i < arr.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
            {label}
            <ChevronRight className="w-4 h-4" style={{ color: '#D1D5DB' }} />
          </button>
        ))}
      </div>

      <style>{`
        @keyframes floatProfile {
          0%,100% { transform: translateY(0px) rotate(-4deg); }
          50%      { transform: translateY(-14px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};
