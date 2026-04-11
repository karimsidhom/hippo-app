'use client';

import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Profile, CaseLog, Milestone } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthUser {
  id:    string;
  name:  string;
  email: string;
}

export interface AuthResult {
  ok:    boolean;
  error: string;
}

interface AuthContextValue {
  // Auth state
  user:    AuthUser | null;
  loading: boolean;
  // Auth actions
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  login:    (email: string, password: string) => Promise<AuthResult>;
  logout:   () => void;
  // Profile
  profile:        Profile | null;
  updateProfile:  (updates: Partial<Profile>) => Promise<void>;
  onboardingDone: boolean;
  // Cases
  cases:      CaseLog[];
  addCase:    (c: Omit<CaseLog, 'id' | 'createdAt' | 'updatedAt'>) => CaseLog;
  updateCase: (id: string, updates: Partial<CaseLog>) => void;
  deleteCase: (id: string) => void;
  // Milestones
  milestones:   Milestone[];
  addMilestone: (m: Omit<Milestone, 'id'>) => void;
  // Account
  deleteAccount: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ── Serialization helpers ─────────────────────────────────────────────────────

function deserializeCase(raw: Record<string, unknown>): CaseLog {
  return {
    ...raw,
    caseDate:  new Date(raw.caseDate  as string),
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
  } as CaseLog;
}

function deserializeMilestone(raw: Record<string, unknown>): Milestone {
  return {
    ...raw,
    achievedAt: raw.achievedAt ? new Date(raw.achievedAt as string) : new Date(),
  } as Milestone;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router     = useRouter();
  // Stable Supabase client (never recreated)
  const supabase   = useRef(createClient()).current;

  const [loading,    setLoading]    = useState(true);
  const [user,       setUser]       = useState<AuthUser | null>(null);
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [cases,      setCases]      = useState<CaseLog[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // ── Data loader ────────────────────────────────────────────────────────────

  const loadUserData = useCallback(async (
    id: string, name: string, email: string,
  ) => {
    setUser({ id, name, email });

    try {
      const [profileRes, casesRes, milestonesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/cases'),
        fetch('/api/milestones'),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile((data.profile ?? null) as Profile | null);
      }

      if (casesRes.ok) {
        const raw: Record<string, unknown>[] = await casesRes.json();
        setCases(raw.map(deserializeCase));
      }

      if (milestonesRes.ok) {
        const raw: Record<string, unknown>[] = await milestonesRes.json();
        setMilestones(raw.map(deserializeMilestone));
      }
    } catch (e) {
      console.error('[AuthContext] loadUserData error:', e);
    }
  }, []);

  // ── Auth state listener ────────────────────────────────────────────────────

  useEffect(() => {
    // Hydrate from existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const su = session.user;
        loadUserData(
          su.id,
          su.user_metadata?.name ?? su.email ?? '',
          su.email ?? '',
        ).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Keep in sync with Supabase auth changes (login from another tab, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const su = session.user;
        loadUserData(
          su.id,
          su.user_metadata?.name ?? su.email ?? '',
          su.email ?? '',
        );
      } else {
        // Signed out
        setUser(null);
        setProfile(null);
        setCases([]);
        setMilestones([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData, supabase]);

  // ── Auth actions ───────────────────────────────────────────────────────────

  const register = useCallback(async (
    name: string, email: string, password: string,
  ): Promise<AuthResult> => {
    try {
      // 1. Create user in Supabase auth + Prisma DB (server-side, service role)
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error ?? 'Registration failed. Please try again.' };
      }

      // 2. Sign in from the browser to obtain a local session cookie
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };

      router.push('/onboarding');
      return { ok: true, error: '' };
    } catch {
      return { ok: false, error: 'Network error. Please try again.' };
    }
  }, [supabase, router]);

  const login = useCallback(async (
    email: string, password: string,
  ): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };

      // Ensure DB user row exists (idempotent)
      await fetch('/api/auth/sync', { method: 'POST' }).catch(() => {});

      // Redirect based on onboarding status
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const { profile: p } = await meRes.json();
        router.push(p?.onboardingCompleted ? '/dashboard' : '/onboarding');
      } else {
        router.push('/onboarding');
      }

      return { ok: true, error: '' };
    } catch {
      return { ok: false, error: 'Network error. Please try again.' };
    }
  }, [supabase, router]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will clear the state
    router.push('/login');
  }, [supabase, router]);

  // ── Profile ────────────────────────────────────────────────────────────────

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    // Optimistic update (handle null profile for new users)
    setProfile(prev => prev
      ? { ...prev, ...updates, updatedAt: new Date() }
      : { ...updates, updatedAt: new Date() } as Profile
    );

    try {
      const res = await fetch('/api/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(updates),
      });
      if (res.ok) {
        const saved = await res.json();
        setProfile(saved as Profile);
      }
    } catch (e) {
      console.error('[AuthContext] updateProfile error:', e);
    }
  }, []);

  // ── Cases ──────────────────────────────────────────────────────────────────

  const addCase = useCallback((
    input: Omit<CaseLog, 'id' | 'createdAt' | 'updatedAt'>,
  ): CaseLog => {
    const tempId = 'tmp_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const optimistic: CaseLog = {
      ...input,
      id:        tempId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCases(prev => [optimistic, ...prev]);

    // Persist to server
    fetch('/api/cases', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...input,
        caseDate: input.caseDate instanceof Date
          ? input.caseDate.toISOString()
          : input.caseDate,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(serverCase => {
        if (serverCase) {
          setCases(prev =>
            prev.map(c => c.id === tempId ? deserializeCase(serverCase) : c),
          );
        }
      })
      .catch(e => console.error('[AuthContext] addCase error:', e));

    return optimistic;
  }, []);

  const updateCase = useCallback((id: string, updates: Partial<CaseLog>) => {
    setCases(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c),
    );

    fetch(`/api/cases/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updates),
    }).catch(e => console.error('[AuthContext] updateCase error:', e));
  }, []);

  const deleteCase = useCallback((id: string) => {
    // Optimistically remove from UI
    setCases(prev => prev.filter(c => c.id !== id));

    // Skip server call for unsaved optimistic cases (they were never in the DB)
    if (id.startsWith('tmp_')) return;

    fetch(`/api/cases/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error('[deleteCase] server error', res.status, body);
          // If the delete failed server-side, reload cases from DB to restore correct state
          fetch('/api/cases', { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(raw => {
              if (raw) setCases((raw as Record<string, unknown>[]).map(deserializeCase));
            })
            .catch(() => {});
        }
      })
      .catch(e => console.error('[AuthContext] deleteCase network error:', e));
  }, []);

  // ── Milestones ─────────────────────────────────────────────────────────────

  const addMilestone = useCallback((m: Omit<Milestone, 'id'>) => {
    const tempId = 'ms_' + Math.random().toString(36).slice(2);
    const optimistic: Milestone = { ...m, id: tempId };
    setMilestones(prev => [...prev, optimistic]);

    fetch('/api/milestones', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(m),
    })
      .then(r => r.ok ? r.json() : null)
      .then(serverMs => {
        if (serverMs) {
          setMilestones(prev =>
            prev.map(ms => ms.id === tempId ? deserializeMilestone(serverMs) : ms),
          );
        }
      })
      .catch(e => console.error('[AuthContext] addMilestone error:', e));
  }, []);

  // ── Delete account ─────────────────────────────────────────────────────────

  const deleteAccount = useCallback(async () => {
    // TODO: add DELETE /api/auth/account endpoint for full data wipe
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCases([]);
    setMilestones([]);
    router.push('/signup');
  }, [supabase, router]);

  // ── Value ──────────────────────────────────────────────────────────────────

  const onboardingDone = profile?.onboardingCompleted ?? false;

  const value: AuthContextValue = {
    user, loading,
    register, login, logout,
    profile, updateProfile, onboardingDone,
    cases, addCase, updateCase, deleteCase,
    milestones, addMilestone,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
