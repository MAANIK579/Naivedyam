import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { CouponIcon, PlusIcon, EditIcon, TrashIcon } from '../components/Icons';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const BLANK_FORM = {
  code:               '',
  description:        '',
  discount_type:      'percentage',
  discount_value:     '',
  min_order_amount:   '',
  max_discount:       '',
  usage_limit:        '',
  per_user_limit:     '',
  valid_from:         '',
  valid_until:        '',
  is_active:          true,
};

export default function CouponsPage() {
  const [coupons,     setCoupons]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState(BLANK_FORM);
  const [editingId,   setEditingId]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [deleteTarget,setDeleteTarget]= useState(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await api.getCoupons();
      const body = res.data;
      setCoupons(body.coupons ?? body.data ?? body ?? []);
    } catch { toast.error('Failed to load coupons'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openCreate = () => {
    setEditingId(null);
    setForm(BLANK_FORM);
    setModal(true);
  };

  const openEdit = (coupon) => {
    setEditingId(coupon._id ?? coupon.id);
    setForm({
      code:             coupon.code             ?? '',
      description:      coupon.description      ?? '',
      discount_type:    coupon.discount_type     ?? 'percentage',
      discount_value:   coupon.discount_value    ?? '',
      min_order_amount: coupon.min_order_amount  ?? '',
      max_discount:     coupon.max_discount      ?? '',
      usage_limit:      coupon.usage_limit       ?? '',
      per_user_limit:   coupon.per_user_limit    ?? '',
      valid_from:       coupon.valid_from  ? coupon.valid_from.slice(0, 10)  : '',
      valid_until:      coupon.valid_until ? coupon.valid_until.slice(0, 10) : '',
      is_active:        coupon.is_active   ?? true,
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        code:             form.code.toUpperCase(),
        discount_value:   Number(form.discount_value),
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : undefined,
        max_discount:     form.max_discount      ? Number(form.max_discount)     : undefined,
        usage_limit:      form.usage_limit       ? Number(form.usage_limit)      : undefined,
        per_user_limit:   form.per_user_limit    ? Number(form.per_user_limit)   : undefined,
      };
      if (editingId) {
        await api.updateCoupon(editingId, body);
        toast.success('Coupon updated');
      } else {
        await api.createCoupon(body);
        toast.success('Coupon created');
      }
      setModal(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await api.updateCoupon(coupon._id ?? coupon.id, { is_active: !coupon.is_active });
      toast.success('Coupon updated');
      fetchCoupons();
    } catch { toast.error('Failed to update'); }
  };

  const confirmDelete = async () => {
    try {
      await api.deleteCoupon(deleteTarget._id ?? deleteTarget.id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch { toast.error('Failed to delete'); }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setCheck = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Coupons</h1>
          <p className="page-subtitle">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <PlusIcon size={14} color="#fff" /> Create Coupon
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center">
            <div className="loading-spinner" />
            Loading…
          </div>
        ) : coupons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CouponIcon size={24} color="var(--text-muted)" /></div>
            <h3>No coupons yet</h3>
            <p>Create your first coupon to offer discounts</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Min Order</th>
                  <th>Valid Until</th>
                  <th>Usage</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id ?? coupon.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: 'var(--brown)', background: 'var(--cream-dark)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                        {coupon.code}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {coupon.description ?? '—'}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600,
                        background: coupon.discount_type === 'percentage' ? '#DCFCE7' : '#E8F5E9',
                        color:      coupon.discount_type === 'percentage' ? '#1565C0' : 'var(--green)',
                        border: `1px solid ${coupon.discount_type === 'percentage' ? '#86EFAC' : '#A5D6A7'}`,
                      }}>
                        {coupon.discount_type === 'percentage' ? '%' : '₹ Flat'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                      {coupon.discount_type === 'percentage' && coupon.max_discount && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                          max ₹{coupon.max_discount}
                        </div>
                      )}
                    </td>
                    <td>{coupon.min_order_amount ? `₹${coupon.min_order_amount}` : '—'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{fmtDate(coupon.valid_until)}</td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {coupon.used_count ?? coupon.usedCount ?? 0}
                        {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                      </span>
                    </td>
                    <td>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={!!coupon.is_active}
                          onChange={() => handleToggleActive(coupon)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(coupon)}>
                          <EditIcon size={13} color="currentColor" /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(coupon)}>
                          <TrashIcon size={13} color="#fff" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Coupon Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Edit Coupon' : 'Create Coupon'} size="md">
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
                placeholder="SAVE20"
                style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input value={form.description} onChange={set('description')} placeholder="20% off on orders above ₹500" />
            </div>
          </div>

          <div style={{ marginBottom: 14, padding: '12px 16px', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Discount Type *</label>
            <div style={{ display: 'flex', gap: 20 }}>
              {['percentage', 'flat'].map((t) => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                  <input
                    type="radio"
                    name="discount_type"
                    value={t}
                    checked={form.discount_type === t}
                    onChange={set('discount_type')}
                    style={{ width: 16, height: 16 }}
                  />
                  {t === 'percentage' ? '% Percentage' : '₹ Flat Amount'}
                </label>
              ))}
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Discount Value *</label>
              <input type="number" min="0" step="0.01" value={form.discount_value} onChange={set('discount_value')} required placeholder={form.discount_type === 'percentage' ? '20' : '50'} />
            </div>
            {form.discount_type === 'percentage' && (
              <div className="form-group">
                <label className="form-label">Max Discount (₹)</label>
                <input type="number" min="0" value={form.max_discount} onChange={set('max_discount')} placeholder="100" />
              </div>
            )}
            {form.discount_type !== 'percentage' && (
              <div className="form-group">
                <label className="form-label">Min Order Amount (₹)</label>
                <input type="number" min="0" value={form.min_order_amount} onChange={set('min_order_amount')} placeholder="300" />
              </div>
            )}
          </div>

          {form.discount_type === 'percentage' && (
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Min Order Amount (₹)</label>
              <input type="number" min="0" value={form.min_order_amount} onChange={set('min_order_amount')} placeholder="300" />
            </div>
          )}

          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Usage Limit</label>
              <input type="number" min="0" value={form.usage_limit} onChange={set('usage_limit')} placeholder="100 (blank = unlimited)" />
            </div>
            <div className="form-group">
              <label className="form-label">Per User Limit</label>
              <input type="number" min="0" value={form.per_user_limit} onChange={set('per_user_limit')} placeholder="1" />
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Valid From</label>
              <input type="date" value={form.valid_from} onChange={set('valid_from')} />
            </div>
            <div className="form-group">
              <label className="form-label">Valid Until</label>
              <input type="date" value={form.valid_until} onChange={set('valid_until')} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20, fontSize: '0.875rem', fontWeight: 600 }}>
            <input type="checkbox" checked={form.is_active} onChange={setCheck('is_active')} style={{ width: 16, height: 16 }} />
            Active
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Coupon"
        message={`Delete coupon "${deleteTarget?.code}"? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
