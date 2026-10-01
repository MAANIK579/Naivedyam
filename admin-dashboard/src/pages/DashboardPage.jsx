import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { api, WS_URL } from '../api/client';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import OrderDetailModal from './OrderDetailModal';
import {
  ShoppingBagIcon, CurrencyIcon, ZapIcon, UsersIcon,
  OrdersIcon, MenuIcon, RefreshIcon, SpinnerIcon, AlertIcon, ChevronRightIcon,
} from '../components/Icons';
import colors from '../theme/colors';

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN');
}

function fmtCurrency(n) {
  if (n == null) return '—';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const [data,            setData]           = useState(null);
  const [loading,         setLoading]        = useState(true);
  const [error,           setError]          = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const navigate = useNavigate();

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.getDashboard();
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  /* Real-time Socket.IO */
  useEffect(() => {
    const socket = io(WS_URL, {
      auth:       { token: localStorage.getItem('admin_token') },
      transports: ['websocket'],
    });

    socket.emit('join:kitchen');
    socket.emit('join_room', 'kitchen');

    const handleNewOrder = (order) => {
      const orderCode = order?.display_id || order?.orderId || '';
      toast.success(`New order ${orderCode ? '#' + orderCode : ''} received!`, { duration: 5000 });
      fetchDashboard();
    };

    socket.on('new:order', handleNewOrder);
    socket.on('kitchen:new_order', handleNewOrder);

    return () => socket.disconnect();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="loading-spinner" />
        Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <AlertIcon size={40} color="var(--error)" />
        </div>
        <p style={{ color: 'var(--error)', marginBottom: 16, fontSize: '0.9rem' }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboard}>
          <RefreshIcon size={15} color="currentColor" />
          Retry
        </button>
      </div>
    );
  }

  const stats        = data?.stats       ?? data ?? {};
  const recentOrders = data?.recent_orders ?? data?.recentOrders ?? [];
  const popularItems = data?.popular_items ?? data?.popularItems ?? [];

  const todayOrders  = stats.today_orders  ?? stats.todayOrders  ?? 0;
  const todayRevenue = stats.today_revenue ?? stats.todayRevenue ?? 0;
  const activeOrders = stats.active_orders ?? stats.activeOrders ?? 0;
  const totalUsers   = stats.total_users   ?? stats.totalUsers   ?? 0;

  const RANK_COLORS = [
    { bg: '#DCFCE7', num: '#14532D', border: '#86EFAC' },
    { bg: 'var(--cream-dark)', num: 'var(--text-muted)', border: 'var(--border)' },
    { bg: '#DCFCE7', num: '#166534', border: '#86EFAC' },
  ];

  return (
    <div className="fade-in">
      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard
          title="Today's Orders"
          value={fmt(todayOrders)}
          icon={<ShoppingBagIcon size={20} color={colors.saffron} strokeWidth={1.8} />}
          color={colors.saffron}
        />
        <StatCard
          title="Today's Revenue"
          value={fmtCurrency(todayRevenue)}
          icon={<CurrencyIcon size={20} color={colors.green} strokeWidth={1.8} />}
          color={colors.green}
        />
        <StatCard
          title="Active Orders"
          value={fmt(activeOrders)}
          icon={<ZapIcon size={20} color={colors.saffronLight} strokeWidth={1.8} />}
          color={colors.saffronLight}
        />
        <StatCard
          title="Total Users"
          value={fmt(totalUsers)}
          icon={<UsersIcon size={20} color={colors.brown} strokeWidth={1.8} />}
          color={colors.brown}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Recent orders table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{
            padding:       '14px 20px',
            background:    'var(--cream)',
            borderBottom:  '1.5px solid var(--border)',
            marginBottom:  0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <OrdersIcon size={16} color="var(--saffron)" />
              <span className="card-title">Recent Orders</span>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/orders')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              View all
              <ChevronRightIcon size={14} color="currentColor" />
            </button>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            {recentOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <OrdersIcon size={24} color="var(--text-muted)" />
                </div>
                <h3>No recent orders</h3>
                <p>Orders placed will appear here</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 10).map((order) => (
                    <tr
                      key={order._id ?? order.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedOrderId(order._id ?? order.id)}
                    >
                      <td>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--saffron)', fontSize: '0.82rem' }}>
                          #{order.display_id ?? order.id?.slice(-6)?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.customer?.name ?? order.user?.name ?? '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer?.phone ?? order.user?.phone}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{fmtCurrency(order.total_amount ?? order.totalAmount)}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{fmtDate(order.created_at ?? order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Popular items */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{
            padding:      '14px 20px',
            background:   'var(--cream)',
            borderBottom: '1.5px solid var(--border)',
            marginBottom: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MenuIcon size={16} color="var(--saffron)" />
              <span className="card-title">Popular Items</span>
            </div>
          </div>
          <div style={{ padding: '4px 0' }}>
            {popularItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <MenuIcon size={24} color="var(--text-muted)" />
                </div>
                <h3>No data</h3>
                <p>Order data will appear here</p>
              </div>
            ) : (
              popularItems.slice(0, 8).map((item, idx) => {
                const rank = RANK_COLORS[idx] ?? RANK_COLORS[2];
                return (
                  <div
                    key={item._id ?? item.id ?? idx}
                    style={{
                      display:       'flex',
                      alignItems:    'center',
                      gap:           10,
                      padding:       '10px 16px',
                      borderBottom:  idx < popularItems.length - 1 ? '1px solid var(--border-light)' : 'none',
                      transition:    'background var(--transition)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cream)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                  >
                    <span style={{
                      width:          26,
                      height:         26,
                      borderRadius:   8,
                      background:     rank.bg,
                      border:         `1px solid ${rank.border}`,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      fontSize:       '0.75rem',
                      fontWeight:     800,
                      color:          rank.num,
                      flexShrink:     0,
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>{item.emoji ?? '🍽️'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                        {fmt(item.order_count ?? item.orderCount)} orders
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Order detail modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
