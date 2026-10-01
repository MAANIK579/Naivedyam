import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AuthContext';
import {
  DashboardIcon, OrdersIcon, MenuIcon, CouponIcon,
  UsersIcon, AnalyticsIcon, LogoutIcon, FlameIcon,
} from './Icons';

const NAV_ITEMS = [
  { to: '/',          Icon: DashboardIcon, label: 'Dashboard'  },
  { to: '/orders',    Icon: OrdersIcon,    label: 'Orders'     },
  { to: '/menu',      Icon: MenuIcon,      label: 'Menu'       },
  { to: '/coupons',   Icon: CouponIcon,    label: 'Coupons'    },
  { to: '/users',     Icon: UsersIcon,     label: 'Users'      },
  { to: '/analytics', Icon: AnalyticsIcon, label: 'Analytics'  },
];

const PAGE_TITLES = {
  '/':          'Dashboard',
  '/orders':    'Orders',
  '/menu':      'Menu Management',
  '/coupons':   'Coupons',
  '/users':     'Users',
  '/analytics': 'Analytics',
};

export default function Layout({ children }) {
  const { admin, logout } = useAdminAuth();
  const navigate          = useNavigate();
  const location          = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Admin';

  const [theme, setTheme] = useState(() => localStorage.getItem('admin-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="admin-layout">
      {/* ---- Sidebar ---- */}
      <aside className="admin-sidebar">
        {/* Logo */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--saffron), var(--saffron-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: 'var(--shadow-sm)',
          }}>
            <FlameIcon size={18} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--sidebar-text)', letterSpacing: '-0.01em' }}>
              Navedyam
            </div>
            <div style={{ fontSize: '0.64rem', color: 'var(--sidebar-text-mut)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Admin Panel
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display:        'flex',
                alignItems:     'center',
                gap:            10,
                padding:        '9px 12px',
                borderRadius:   8,
                marginBottom:   2,
                fontSize:       '0.875rem',
                fontWeight:     isActive ? 700 : 500,
                color:          isActive ? 'var(--saffron)' : 'var(--sidebar-text-mut)',
                background:     isActive ? 'var(--sidebar-hover)' : 'transparent',
                borderLeft:     isActive ? '3px solid var(--saffron)' : '3px solid transparent',
                textDecoration: 'none',
                transition:     'var(--transition)',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    color={isActive ? 'var(--saffron)' : 'var(--sidebar-text-mut)'}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '10px 8px 16px', borderTop: '1px solid var(--border)' }}>
          {admin && (
            <div style={{
              padding: '8px 12px', marginBottom: 6, borderRadius: 8,
              background: 'var(--sidebar-hover)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'var(--saffron-pale)',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--saffron)' }}>
                  {(admin.name ?? admin.phone ?? 'A')[0].toUpperCase()}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.8rem', fontWeight: 600, color: 'var(--sidebar-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {admin.name ?? admin.phone ?? 'Admin'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--sidebar-text-mut)' }}>Administrator</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          8,
              width:        '100%',
              padding:      '9px 12px',
              borderRadius: 8,
              fontSize:     '0.875rem',
              fontWeight:   500,
              color:        'var(--sidebar-text-mut)',
              background:   'transparent',
              cursor:       'pointer',
              transition:   'var(--transition)',
              border:       '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background  = 'var(--sidebar-hover)';
              e.currentTarget.style.color       = 'var(--saffron)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background  = 'transparent';
              e.currentTarget.style.color       = 'var(--sidebar-text-mut)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <LogoutIcon size={15} color="currentColor" strokeWidth={2} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ---- Main area ---- */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {pageTitle}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                width: 36, height: 36, borderRadius: 'var(--radius-full)',
                background: 'var(--glass-strong)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--saffron)',
                cursor: 'pointer', transition: 'var(--transition)'
              }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              <div style={{ fontSize: '1.2rem', lineHeight: 1 }}>{theme === 'light' ? '🌙' : '☀️'}</div>
            </button>

            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          7,
              background:   'var(--saffron-pale)',
              border:       '1px solid var(--border)',
              borderRadius: 'var(--radius-full)',
              padding:      '5px 14px 5px 8px',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: 'linear-gradient(135deg, var(--saffron), var(--saffron-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FlameIcon size={12} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--saffron)' }}>
                Navedyam
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
