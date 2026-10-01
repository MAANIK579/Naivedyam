import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { SpinnerIcon, AlertIcon, CheckIcon, CashIcon } from '../components/Icons';

const STATUSES = ['placed','confirmed','preparing','out_for_delivery','delivered','cancelled'];

function fmtCurrency(n) {
  if (n == null) return '—';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>{value ?? '—'}</span>
    </div>
  );
}

/**
 * OrderDetailModal
 * Props:
 *   orderId          (string | null)
 *   open             (bool)
 *   onClose          (func)
 *   onStatusUpdated  (func, optional)
 */
export default function OrderDetailModal({ orderId, open, onClose, onStatusUpdated }) {
  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [newStatus,  setNewStatus]  = useState('');
  const [updating,   setUpdating]   = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    if (!open || !orderId) { setOrder(null); return; }
    setLoading(true);
    setError('');
    api.getOrderDetail(orderId)
      .then((res) => {
        const o = res.data?.order ?? res.data;
        setOrder(o);
        setNewStatus(o?.status ?? '');
      })
      .catch((err) => setError(err?.response?.data?.message ?? 'Failed to load order.'))
      .finally(() => setLoading(false));
  }, [open, orderId]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order?.status) return;
    setUpdating(true);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated');
      setOrder((prev) => ({ ...prev, status: newStatus }));
      if (onStatusUpdated) onStatusUpdated();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setUpdatingPayment(true);
    try {
      await api.updatePaymentStatus(orderId, 'paid');
      toast.success('Payment marked as paid');
      setOrder((prev) => ({ ...prev, payment_status: 'paid' }));
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update payment status');
    } finally {
      setUpdatingPayment(false);
    }
  };

  const items        = order?.items        ?? order?.order_items ?? [];
  const billSummary  = order?.bill_summary ?? order?.billSummary ?? {};
  const customer     = order?.customer     ?? order?.user ?? {};
  const address      = order?.delivery_address ?? order?.deliveryAddress ?? {};

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={order ? `Order #${order.display_id ?? orderId?.slice(-6)?.toUpperCase()}` : 'Order Details'}
      size="lg"
    >
      {loading && (
        <div className="loading-center">
          <div className="loading-spinner" />
          Loading…
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <AlertIcon size={36} color="var(--error)" />
          </div>
          <p style={{ color: 'var(--error)' }}>{error}</p>
        </div>
      )}

      {order && !loading && (
        <div>
          {/* Top row: status + actions */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            background:     'var(--cream)',
            border:         '1.5px solid var(--border)',
            borderRadius:   10,
            padding:        '12px 16px',
            marginBottom:   20,
            flexWrap:       'wrap',
            gap:            10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status:</span>
              <StatusBadge status={order.status} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem', borderRadius: 6, border: '1.5px solid var(--border)' }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === order.status}
              >
                {updating
                  ? <SpinnerIcon size={13} color="#fff" />
                  : <CheckIcon   size={13} color="#fff" strokeWidth={2.5} />
                }
                {updating ? 'Updating…' : 'Update'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => window.print()}
              >
                Print
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Customer info */}
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Customer
              </h3>
              <InfoRow label="Name"    value={customer.name} />
              <InfoRow label="Phone"   value={customer.phone} />
              <InfoRow label="Email"   value={customer.email} />
              <InfoRow label="Ordered" value={fmtDate(order.created_at ?? order.createdAt)} />
            </div>

            {/* Delivery address */}
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Delivery Address
              </h3>
              <InfoRow label="Label"    value={address.label ?? address.type} />
              <InfoRow label="Line 1"   value={address.line1 ?? address.address_line1 ?? address.street} />
              <InfoRow label="Line 2"   value={address.line2 ?? address.address_line2} />
              <InfoRow label="City"     value={address.city} />
              <InfoRow label="Pincode"  value={address.pincode ?? address.zip} />
            </div>
          </div>

          {/* Payment info */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Payment
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Method</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {(order.payment_method ?? order.paymentMethod) === 'cod' ? 'Cash on Delivery' :
                   (order.payment_method ?? order.paymentMethod) === 'upi' ? 'UPI Payment' : 'Online (Razorpay)'}
                </div>
              </div>
              <div style={{
                background: (order.payment_status ?? order.paymentStatus) === 'paid' ? 'var(--green-pale)' : 'var(--warning-pale)',
                border: `1px solid ${(order.payment_status ?? order.paymentStatus) === 'paid' ? 'var(--green-border)' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '10px 12px'
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</div>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: (order.payment_status ?? order.paymentStatus) === 'paid' ? 'var(--green)' : 'var(--warning)'
                }}>
                  {order.payment_status ?? order.paymentStatus ?? 'pending'}
                </div>
              </div>
              <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Transaction</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{order.payment_id ?? order.paymentId ?? '—'}</div>
              </div>
            </div>
            {/* Mark as Paid button for COD/UPI orders (not Razorpay - auto-verified) */}
            {(order.payment_method !== 'razorpay') && (order.payment_status !== 'paid') && (
              <button
                className="btn btn-primary"
                onClick={handleMarkAsPaid}
                disabled={updatingPayment}
                style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {updatingPayment
                  ? <SpinnerIcon size={14} color="#fff" />
                  : <CashIcon size={14} color="#fff" />
                }
                {updatingPayment ? 'Updating…' : 'Mark Payment as Received'}
              </button>
            )}
          </div>

          {/* Items table */}
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Items
          </h3>
          <div className="table-wrap" style={{ marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const menuItem   = item.menu_item ?? item.item ?? item;
                  const name       = menuItem.name ?? item.name ?? `Item ${idx + 1}`;
                  const emoji      = menuItem.emoji ?? '';
                  const qty        = item.quantity ?? item.qty ?? 1;
                  const unitPrice  = item.unit_price ?? item.price ?? menuItem.price ?? 0;
                  const subtotal   = item.subtotal   ?? (qty * unitPrice);
                  return (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {emoji && <span style={{ fontSize: '1.1rem' }}>{emoji}</span>}
                          <span style={{ fontWeight: 600 }}>{name}</span>
                        </div>
                        {item.customizations?.length > 0 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {item.customizations.map((c) => c.name ?? c).join(', ')}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{qty}</td>
                      <td style={{ textAlign: 'right' }}>{fmtCurrency(unitPrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtCurrency(subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bill summary */}
          <div style={{ maxWidth: 320, marginLeft: 'auto' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Bill Summary
            </h3>
            <div style={{ background: 'var(--cream)', border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {[
                { label: 'Items Total',    value: billSummary.item_total    ?? billSummary.itemTotal    ?? order.item_total },
                { label: 'Delivery Charge',value: billSummary.delivery_fee  ?? billSummary.deliveryFee  ?? order.delivery_fee },
                { label: 'GST',            value: billSummary.gst           ?? billSummary.tax          ?? order.gst },
                { label: 'Discount',       value: billSummary.discount      ?? order.discount, isDiscount: true },
              ].filter(({ value }) => value != null).map(({ label, value, isDiscount }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isDiscount ? 'var(--green)' : 'var(--text)' }}>
                    {isDiscount ? '−' : ''}{fmtCurrency(value)}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--brown)' }}>
                <span style={{ fontSize: '0.925rem', fontWeight: 700, color: '#FFFFFF' }}>Grand Total</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--saffron-light, #4ADE80)' }}>
                  {fmtCurrency(order.total_amount ?? order.totalAmount ?? billSummary.grand_total ?? billSummary.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--warning-pale)', border: '1px solid var(--warning)', opacity: 0.8, borderRadius: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)' }}>Order Notes: </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{order.notes}</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
