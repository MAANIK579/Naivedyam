import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../api/client';
import colors from '../theme/colors';
import { AnalyticsIcon, RefreshIcon, AlertIcon } from '../components/Icons';

/* ---- Date helpers ---- */
function subtractDays(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function fmtCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

const RANGE_OPTIONS = [
  { label: 'Last 7 days',  value: 7  },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

const STATUS_COLORS = {
  placed:           '#22C55E',
  confirmed:        '#22C55E',
  preparing:        '#16A34A',
  out_for_delivery: '#43A047',
  delivered:        '#2E7D32',
  cancelled:        '#166534',
};

const CHART_COLORS = [
  colors.saffron, colors.brown, colors.green, colors.saffronLight,
  '#22C55E', '#16A34A', '#166534', '#166534',
];

/* ---- Tiny section wrapper ---- */
function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

/* ---- Custom Tooltip ---- */
function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   'var(--white)',
      border:       '1.5px solid var(--border)',
      borderRadius: 8,
      padding:      '10px 14px',
      boxShadow:    'var(--shadow-md)',
      fontSize:     '0.8rem',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{currency ? fmtCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [range,   setRange]   = useState(30);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        date_from: subtractDays(range),
        date_to:   new Date().toISOString().slice(0, 10),
        range,
      };
      const res  = await api.getAnalytics(params);
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load analytics.');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  /* ---- process data ---- */
  const revenueByDate = (data?.revenue_by_date ?? data?.revenue_by_day ?? data?.revenueByDate ?? []).map((d) => ({
    date:    d.date ?? d._id,
    Revenue: d.revenue ?? d.total ?? 0,
  }));

  const ordersByDate = (data?.orders_by_date ?? data?.orders_by_day ?? data?.ordersByDate ?? []).map((d) => ({
    date:   d.date ?? d._id,
    Orders: d.count ?? d.orders ?? 0,
  }));

  const rawOrdersByStatus =
    data?.orders_by_status_map ??
    data?.ordersByStatusMap ??
    data?.orders_by_status ??
    data?.ordersByStatus ??
    {};

  const ordersByStatus = Array.isArray(rawOrdersByStatus)
    ? rawOrdersByStatus.map((entry) => ({
      name: entry.name ?? entry._id,
      value: Number(entry.value ?? entry.count ?? 0),
    }))
    : Object.entries(rawOrdersByStatus).map(([name, value]) => ({ name, value: Number(value) }));

  const peakHours = (data?.peak_hours ?? data?.peakHours ?? []).map((h) => ({
    hour:   `${String(h.hour ?? h._id).padStart(2, '0')}:00`,
    Orders: h.count ?? h.orders ?? 0,
  }));

  const topItems = (data?.top_items ?? data?.topItems ?? []).map((i) => ({
    name:   `${i.emoji ?? ''} ${i.name ?? i.item_name ?? i._id ?? 'Item'}`.trim(),
    Orders: i.order_count ?? i.total_ordered ?? i.count ?? 0,
  })).slice(0, 10);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Business insights and performance metrics</p>
        </div>

        {/* Range selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          {RANGE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className="btn btn-sm"
              style={{
                background:   range === value ? 'var(--saffron)' : 'var(--white)',
                color:        range === value ? 'var(--white)'   : 'var(--text-muted)',
                borderColor:  range === value ? 'var(--saffron)' : 'var(--border)',
                border:       '1.5px solid',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading-center" style={{ height: 300 }}>
          <div className="loading-spinner" />
          Loading analytics…
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <AlertIcon size={40} color="var(--error)" />
          </div>
          <p style={{ color: 'var(--error)', marginBottom: 16 }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchAnalytics}>
            <RefreshIcon size={14} color="currentColor" /> Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div>
          {/* Revenue over time */}
          <ChartCard title="Revenue Over Time" subtitle={`Last ${range} days`}>
            {revenueByDate.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon"><AnalyticsIcon size={22} color="var(--text-muted)" /></div><h3>No data</h3></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueByDate} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tickFormatter={(v) => '₹' + (v >= 1000 ? `${(v/1000).toFixed(0)}k` : v)} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip currency />} />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke={colors.saffron}
                    strokeWidth={2.5}
                    dot={{ fill: colors.saffron, r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Orders count over time */}
          <ChartCard title="Orders Over Time" subtitle={`Last ${range} days`}>
            {ordersByDate.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon"><AnalyticsIcon size={22} color="var(--text-muted)" /></div><h3>No data</h3></div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={ordersByDate} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={colors.brown} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={colors.brown} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Orders"
                    stroke={colors.brown}
                    strokeWidth={2.5}
                    fill="url(#ordersGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Orders by status – PieChart */}
            <ChartCard title="Orders by Status">
              {ordersByStatus.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon"><AnalyticsIcon size={22} color="var(--text-muted)" /></div><h3>No data</h3></div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={ordersByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {ordersByStatus.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name] ?? CHART_COLORS[0]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name.replace(/_/g, ' ')]} />
                    <Legend
                      formatter={(value) => value.replace(/_/g, ' ')}
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ fontSize: '0.78rem' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Peak hours – BarChart */}
            <ChartCard title="Peak Hours" subtitle="Orders by hour of day">
              {peakHours.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon"><AnalyticsIcon size={22} color="var(--text-muted)" /></div><h3>No data</h3></div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={peakHours} margin={{ top: 5, right: 15, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Orders" fill={colors.saffronLight} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Top 10 items – Horizontal BarChart */}
          <ChartCard title="Top 10 Menu Items" subtitle="By order count">
            {topItems.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🍽️</div><p>No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(250, topItems.length * 36)}>
                <BarChart
                  layout="vertical"
                  data={topItems}
                  margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={160}
                    tick={{ fontSize: 12, fill: 'var(--text)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Orders" fill={colors.brown} radius={[0, 4, 4, 0]}>
                    {topItems.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}
