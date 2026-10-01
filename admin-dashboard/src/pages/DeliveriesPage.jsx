import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { api, WS_URL } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  BikeIcon,
  PhoneIcon,
  LocationIcon,
  ClockIcon,
  RefreshIcon,
  SpinnerIcon,
  AlertIcon,
} from '../components/Icons';

function fmtCurrency(n) {
  if (n == null) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h ${diffMins % 60}m ago`;
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState({});

  const fetchDeliveries = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.getActiveDeliveries();
      const list = res.data?.deliveries || [];
      setDeliveries(list);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load active deliveries.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh interval
  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(() => {
      fetchDeliveries(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  // Socket.IO live order updates
  useEffect(() => {
    let socket;
    try {
      socket = io(WS_URL, { transports: ['websocket', 'polling'] });
      socket.on('connect', () => {
        socket.emit('join:kitchen');
      });

      socket.on('new:order', () => {
        fetchDeliveries(true);
      });

      socket.on('order:status_update', () => {
        fetchDeliveries(true);
      });

      socket.on('kitchen:order_cancelled', () => {
        fetchDeliveries(true);
      });
    } catch (err) {
      console.warn('Socket connection error:', err);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [fetchDeliveries]);

  // Handle status update action
  const handleUpdateStatus = async (orderId, newStatus, actionLabel) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      await api.updateOrderStatus(orderId, newStatus);
      toast.success(`Order marked as ${actionLabel}!`);
      // Optimistic update or refresh
      setDeliveries((prev) =>
        prev
          .map((ord) => (ord._id === orderId ? { ...ord, status: newStatus } : ord))
          .filter((ord) => ['preparing', 'out_for_delivery'].includes(ord.status))
      );
      fetchDeliveries(true);
    } catch (err) {
      toast.error(err?.response?.data?.error || `Failed to mark order as ${actionLabel}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Filtered deliveries
  const preparingList = deliveries.filter((d) => d.status === 'preparing');
  const outForDeliveryList = deliveries.filter((d) => d.status === 'out_for_delivery');

  const displayedList =
    filterStatus === 'preparing'
      ? preparingList
      : filterStatus === 'out_for_delivery'
      ? outForDeliveryList
      : deliveries;

  return (
    <div className="page-container" style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <BikeIcon size={28} color="var(--saffron)" />
            Delivery Fulfillment
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Dispatch, track, and complete customer deliveries in real time
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => fetchDeliveries()}
            disabled={loading}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {loading ? <SpinnerIcon size={16} /> : <RefreshIcon size={16} />}
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          onClick={() => setFilterStatus('all')}
          style={{
            background: filterStatus === 'all' ? 'var(--saffron-pale)' : 'var(--card-bg, #fff)',
            border: `1px solid ${filterStatus === 'all' ? 'var(--saffron)' : 'var(--border)'}`,
            borderRadius: 14,
            padding: '18px 22px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
            Total Active
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {deliveries.length}
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('preparing')}
          style={{
            background: filterStatus === 'preparing' ? 'rgba(234, 88, 12, 0.10)' : 'var(--card-bg, #fff)',
            border: `1px solid ${filterStatus === 'preparing' ? '#ea580c' : 'var(--border)'}`,
            borderRadius: 14,
            padding: '18px 22px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ color: '#ea580c', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
            Ready for Pickup
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {preparingList.length}
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('out_for_delivery')}
          style={{
            background: filterStatus === 'out_for_delivery' ? 'rgba(16, 185, 129, 0.10)' : 'var(--card-bg, #fff)',
            border: `1px solid ${filterStatus === 'out_for_delivery' ? '#10b981' : 'var(--border)'}`,
            borderRadius: 14,
            padding: '18px 22px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
            Out for Delivery
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {outForDeliveryList.length}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            padding: '14px 18px',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <AlertIcon size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Deliveries list grid */}
      {loading && deliveries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <SpinnerIcon size={32} />
          <p style={{ marginTop: 12, fontWeight: 500 }}>Loading active deliveries…</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: 'var(--card-bg)',
            borderRadius: 14,
            border: '1px dashed var(--border)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🛵</div>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            {filterStatus === 'all'
              ? 'No active deliveries'
              : filterStatus === 'preparing'
              ? 'No orders waiting for pickup'
              : 'No orders currently on the road'}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            All orders have been fulfilled or kitchen is preparing new tickets.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: 20,
          }}
        >
          {displayedList.map((order) => {
            const customer = order.user || {};
            const address = order.delivery_address || {};
            const fullAddress = address.full_address || address.address || 'Address not specified';
            const instructions = address.delivery_instructions || '';
            const phone = customer.phone || address.phone || '';
            const hasCoords = address.lat && address.lng;
            const mapsUrl = hasCoords
              ? `https://www.google.com/maps/dir/?api=1&destination=${address.lat},${address.lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

            const isPreparing = order.status === 'preparing';
            const isOutForDelivery = order.status === 'out_for_delivery';
            const isBusy = actionLoading[order._id];

            return (
              <div
                key={order._id}
                style={{
                  background: 'var(--card-bg, #fff)',
                  border: isOutForDelivery
                    ? '1px solid #10b981'
                    : isPreparing
                    ? '1px solid rgba(234, 88, 12, 0.7)'
                    : '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                }}
              >
                {/* Card Top: Order ID & Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      #{order.display_id || String(order._id).slice(-6)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      <ClockIcon size={13} />
                      {timeAgo(order.created_at)}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Customer Details & Call Link */}
                <div
                  style={{
                    background: 'var(--cream-dark)',
                    padding: '12px 14px',
                    borderRadius: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {customer.name || 'Customer'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {phone || 'No phone provided'}
                    </div>
                  </div>
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#10b981',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      <PhoneIcon size={14} />
                      Call
                    </a>
                  )}
                </div>

                {/* Delivery Address & Instructions */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <LocationIcon size={18} color="var(--saffron)" />
                    <div style={{ flex: 1 }}>
                      {address.label && (
                        <span
                          style={{
                            background: 'rgba(234, 88, 12, 0.1)',
                            color: 'var(--saffron)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            marginRight: 6,
                          }}
                        >
                          {address.label.toUpperCase()}
                        </span>
                      )}
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {fullAddress}
                      </span>
                      {address.landmark && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Landmark: {address.landmark}
                        </div>
                      )}
                      {hasCoords && (
                        <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: 2, fontWeight: 600 }}>
                          📍 GPS Pinned ({address.lat.toFixed(4)}, {address.lng.toFixed(4)})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Instructions note */}
                  {instructions && (
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        padding: '10px 14px',
                        borderRadius: 8,
                        fontSize: '0.82rem',
                        color: 'var(--text-primary)',
                        marginTop: 8,
                      }}
                    >
                      <span style={{ color: '#d97706', fontWeight: 700 }}>Note: </span>
                      {instructions}
                    </div>
                  )}

                  {/* Navigation Maps Link */}
                  <div style={{ marginTop: 10 }}>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      🧭 Open in Google Maps
                    </a>
                  </div>
                </div>

                {/* Items & Payment summary */}
                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: 12,
                    fontSize: '0.84rem',
                  }}
                >
                  <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, fontSize: '0.76rem' }}>
                    ORDER ITEMS ({order.items?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 90, overflowY: 'auto' }}>
                    {(order.items || []).map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span>
                          {it.quantity}x {it.item_name || it.name || it.menu_item?.name || 'Item'}
                        </span>
                        <span>{fmtCurrency(it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 10,
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--saffron)' }}>{fmtCurrency(order.grand_total || order.total)}</span>
                  </div>
                </div>

                {/* Fulfillment Action Buttons */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 'auto' }}>
                  {isPreparing && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'out_for_delivery', 'Picked Up (Out for Delivery)')}
                      disabled={isBusy}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#ea580c',
                        borderColor: '#ea580c',
                        cursor: 'pointer',
                      }}
                    >
                      {isBusy ? <SpinnerIcon size={16} /> : <BikeIcon size={18} />}
                      Mark Picked Up & Out for Delivery
                    </button>
                  )}

                  {isOutForDelivery && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'delivered', 'Delivered')}
                      disabled={isBusy}
                      className="btn"
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {isBusy ? <SpinnerIcon size={16} /> : '✅'}
                      Mark Delivered (Handed to Customer)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
