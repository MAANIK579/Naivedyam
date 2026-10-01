import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AuthContext';
import { FlameIcon, PhoneIcon, LockIcon, EyeIcon, EyeOffIcon, AlertIcon, SpinnerIcon } from '../components/Icons';

export default function LoginPage() {
  const { login }   = useAdminAuth();
  const navigate    = useNavigate();

  const [phone,       setPhone]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message
        ?? err?.response?.data?.error
        ?? err?.message
        ?? 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:      '100vh',
      background:     'linear-gradient(135deg, #060806 0%, #0D1A13 50%, #122519 100%)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        24,
      position:       'relative',
      overflow:       'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: '-15%', right: '-8%', width: 480, height: 480, borderRadius: '50%', background: 'rgba(22,163,74,0.10)', pointerEvents: 'none', filter: 'blur(60px)' }} />
      <div style={{ position: 'fixed', bottom: '-15%', left: '-8%', width: 420, height: 420, borderRadius: '50%', background: 'rgba(34,197,94,0.08)', pointerEvents: 'none', filter: 'blur(60px)' }} />

      <div style={{
        position:     'relative',
        width:        '100%',
        maxWidth:     420,
        background:   'var(--white)',
        borderRadius: 20,
        boxShadow:    '0 24px 64px rgba(0,0,0,0.35)',
        overflow:     'hidden',
        animation:    'slideDown 0.28s ease both',
      }}>
        {/* Top brand strip */}
        <div style={{
          background:  'linear-gradient(135deg, #166534, #16A34A, #4ADE80)',
          padding:     '32px 32px 28px',
          textAlign:   'center',
          position:    'relative',
          overflow:    'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

          <div style={{
            width:          56,
            height:         56,
            borderRadius:   16,
            background:     'rgba(255,255,255,0.2)',
            border:         '1.5px solid rgba(255,255,255,0.3)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 14px',
            backdropFilter: 'blur(8px)',
          }}>
            <FlameIcon size={28} color="#fff" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', marginBottom: 4 }}>
            Navedyam
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
            Admin Panel
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '32px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.01em' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Sign in to manage your restaurant
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <AlertIcon size={16} color="currentColor" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <div className="input-wrap">
                <span className="input-icon-left">
                  <PhoneIcon size={15} color="var(--text-muted)" />
                </span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="9999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoFocus
                  className="has-left-icon"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-wrap" style={{ position: 'relative' }}>
                <span className="input-icon-left">
                  <LockIcon size={15} color="var(--text-muted)" />
                </span>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="has-left-icon"
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position:  'absolute',
                    right:     10,
                    color:     'var(--text-muted)',
                    lineHeight: 0,
                    cursor:    'pointer',
                  }}
                  tabIndex={-1}
                >
                  {showPw
                    ? <EyeOffIcon size={15} color="currentColor" />
                    : <EyeIcon    size={15} color="currentColor" />
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', borderRadius: 10, marginTop: 4 }}
            >
              {loading ? (
                <>
                  <SpinnerIcon size={16} color="#fff" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p style={{ marginTop: 22, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-light)' }}>
            Navedyam Kitchen · Protected Access
          </p>
        </div>
      </div>
    </div>
  );
}
