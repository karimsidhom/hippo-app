'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { HippoMark } from '@/components/HippoMark';

const TEAL = '#0EA5E9';
const TEAL_LO = '#0B8A8A';

const S = {
  wrap: { width: '100%', maxWidth: 400 },
  logo: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    gap: 12, marginBottom: 32,
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  logoText: { fontSize: 28, fontWeight: 700, color: '#fafafa', letterSpacing: '-.6px' },
  tagline: {
    fontSize: 13, color: TEAL, fontStyle: 'italic' as const,
    letterSpacing: '.02em', opacity: 0.8,
  },
  h1: {
    fontSize: 24, fontWeight: 700, color: '#fafafa', letterSpacing: '-.5px',
    marginBottom: 6, textAlign: 'center' as const,
  },
  sub: { fontSize: 14, color: '#71717a', textAlign: 'center' as const, marginBottom: 32 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 },
  input: {
    width: '100%', background: '#0c1117', border: '1px solid #1e2d3d',
    color: '#fafafa', borderRadius: 10, padding: '12px 14px',
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box' as const, marginBottom: 16,
    transition: 'border-color .15s',
  },
  fieldWrap: { position: 'relative' as const },
  eyeBtn: {
    position: 'absolute' as const, right: 12, top: '50%',
    transform: 'translateY(-50%)', background: 'none', border: 'none',
    cursor: 'pointer', padding: 4, color: '#52525b',
    marginTop: -8,
  },
  btn: {
    width: '100%', padding: '13px',
    background: `linear-gradient(135deg, ${TEAL}, ${TEAL_LO})`,
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, transition: 'opacity .15s',
    boxShadow: `0 4px 16px -4px rgba(14,165,233,0.35)`,
  },
  error: {
    background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.3)',
    borderRadius: 8, padding: '10px 14px', fontSize: 13,
    color: '#e05c5c', marginBottom: 16,
  },
  linkRow: { textAlign: 'center' as const, fontSize: 14, color: '#71717a', marginTop: 20 },
  link: { color: TEAL, textDecoration: 'none', fontWeight: 500 },
};

export default function LoginPage() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email.');    return; }
    if (!password)     { setError('Please enter your password.'); return; }
    setLoading(true);
    const result = await login(email.trim(), password);
    if (!result.ok) { setError(result.error); setLoading(false); }
  }

  return (
    <div style={S.wrap}>
      {/* Logo */}
      <div style={S.logo}>
        <div style={S.logoRow}>
          <HippoMark size={44} />
          <span style={S.logoText}>Hippo</span>
        </div>
        <span style={S.tagline}>Track mastery. Share growth.</span>
      </div>

      <h1 style={S.h1}>Welcome back</h1>
      <p style={S.sub}>Log in to your surgical training account</p>

      <form onSubmit={handleSubmit}>
        {error && <div style={S.error}>{error}</div>}

        <label style={S.label}>Email</label>
        <input
          style={S.input}
          type="email"
          autoComplete="email"
          placeholder="you@hospital.ca"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onFocus={e => { e.target.style.borderColor = TEAL; }}
          onBlur={e  => { e.target.style.borderColor = '#1e2d3d'; }}
        />

        <label style={S.label}>Password</label>
        <div style={S.fieldWrap}>
          <input
            style={{ ...S.input, paddingRight: 44 }}
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={e => { e.target.style.borderColor = TEAL; }}
            onBlur={e  => { e.target.style.borderColor = '#1e2d3d'; }}
          />
          <button type="button" style={S.eyeBtn} onClick={() => setShowPw(p => !p)}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button
          type="submit"
          style={{ ...S.btn, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div style={S.linkRow}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={S.link}>Create one</Link>
      </div>
    </div>
  );
}
