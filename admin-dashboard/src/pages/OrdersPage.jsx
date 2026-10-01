import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { api, WS_URL } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import OrderDetailModal from './OrderDetailModal';
import { OrdersIcon, SearchIcon, FilterIcon, RefreshIcon, AlertIcon, ChevronRightIcon } from '../components/Icons';

const STATUSES = ['placed','confirmed','preparing','out_for_delivery','delivered','cancelled'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function fmtCurrency(n) {
  if (n == null) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export default function OrdersPage() {
  const [orders,         setOrders]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [page,           setPage]           = useState(1);
  const [totalPages,     setTotalPages]     = useState(1);
  const [totalCount,     setTotalCount]     = useState(0);
  const [selectedId,     setSelectedId]     = useState(null);

  /* Filters */
  const [statusFilter, setStatusFilter]   = useState('');
  const [search,       setSearch]         = useState('');
  const [dateFrom,     setDateFrom]       = useState('');
  const [dateTo,       setDateTo]         = useState('');

  /* Inline status update */
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20 };
      if (statusFilter) params.status   = statusFilter;
      if (search)       params.search   = search;
      if (dateFrom)     params.date_from = dateFrom;
      if (dateTo)       params.date_to   = dateTo;

      const res  = await api.getAllOrders(params);
      const body = res.data;

      setOrders(body.orders ?? body.data ?? body ?? []);
      setTotalPages(body.total_pages ?? body.totalPages ?? 1);
      setTotalCount(body.total ?? body.count ?? 0);
      setPage(pg);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  /* Real-time */
  useEffect(() => {
    const socket = io(WS_URL, {
      auth: { token: localStorage.getItem('admin_token') },
      transports: ['websocket'],
    });

    socket.emit('join:kitchen');
    socket.emit('join_room', 'kitchen');

    const handleNewOrder = () => {
      toast.success('New order arrived!');
      if (page === 1) fetchOrders(1);
    };

    socket.on('new:order', handleNewOrder);
    socket.on('kitchen:new_order', handleNewOrder);

    return () => socket.disconnect();
  }, [fetchOrders, page]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      toast.success('Status updated');
      fetchOrders(page);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{totalCount} total orders</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: 170 }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by order ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchOrders(1)}
          style={{ maxWidth: 200 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ maxWidth: 155 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ maxWidth: 155 }} />
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => fetchOrders(1)}>
          Apply
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setStatusFilter(''); setSearch(''); setDateFrom(''); setDateTo('');
          }}
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center">
            <div className="loading-spinner" />
            Loading orders…
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon"><AlertIcon size={24} color="var(--error)" /></div>
            <h3>Failed to load orders</h3>
            <p style={{ color: 'var(--error)' }}>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => fetchOrders(1)}>
              <RefreshIcon size={14} color="currentColor" /> Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><OrdersIcon size={24} color="var(--text-muted)" /></div>
            <h3>No orders found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const id = order._id ?? order.id;
                  return (
                    <tr key={id}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--saffron)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          #{order.display_id ?? id?.slice(-6)?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.customer?.name ?? order.user?.name ?? '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer?.phone ?? order.user?.phone}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {(order.items ?? order.order_items ?? []).length} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{fmtCurrency(order.total_amount ?? order.totalAmount)}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{
                            fontSize:     '0.72rem',
                            fontWeight:   600,
                            color:        'var(--text-muted)',
                            textTransform:'uppercase',
                          }}>
                            {order.payment_method === 'cod' ? 'COD' : order.payment_method === 'upi' ? 'UPI' : 'Online'}
                          </span>
                          <span style={{
                            display:      'inline-block',
                            padding:      '2px 8px',
                            borderRadius: 99,
                            fontSize:     '0.72rem',
                            fontWeight:   600,
                            background:   order.payment_status === 'paid' ? 'var(--green-pale)' : 'var(--warning-pale)',
                            color:        order.payment_status === 'paid' ? 'var(--green)' : 'var(--warning)',
                            border:       `1px solid ${order.payment_status === 'paid' ? 'var(--green-border)' : 'var(--border)'}`,
                            textTransform:'capitalize',
                            width:        'fit-content',
                          }}>
                            {order.payment_status ?? 'pending'}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {fmtDate(order.created_at ?? order.createdAt)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedId(id)}
                          >
                            View
                          </button>
                          <select
                            value={order.status}
                            disabled={updatingId === id}
                            onChange={(e) => handleStatusUpdate(id, e.target.value)}
                            style={{
                              width:        'auto',
                              padding:      '4px 8px',
                              fontSize:     '0.78rem',
                              borderRadius: 6,
                              border:       '1.5px solid var(--border)',
                              background:   'var(--white)',
                              cursor:       'pointer',
                              color:        'var(--text)',
                            }}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="pagination">
            <span>Page {page} of {totalPages} &nbsp;·&nbsp; {totalCount} orders</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => fetchOrders(page - 1)}
              >
                ← Prev
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => fetchOrders(page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      <OrderDetailModal
        orderId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        onStatusUpdated={() => fetchOrders(page)}
      />
    </div>
  );
}
