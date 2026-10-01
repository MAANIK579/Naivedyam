import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { MenuIcon, PlusIcon, EditIcon, TrashIcon, StarIcon } from '../components/Icons';

/* -------- Helpers -------- */
function Toggle({ checked, onChange }) {
  return (
    <label className="toggle" title={checked ? 'Active' : 'Inactive'}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

function VegBadge({ isVeg }) {
  return (
    <span style={{
      display:      'inline-block',
      width:        20,
      height:       20,
      borderRadius: 4,
      border:       `2px solid ${isVeg ? 'var(--green)' : 'var(--error)'}`,
      position:     'relative',
      flexShrink:   0,
    }}>
      <span style={{
        position:     'absolute',
        top:          3,
        left:         3,
        width:        10,
        height:       10,
        borderRadius: '50%',
        background:   isVeg ? 'var(--green)' : 'var(--error)',
      }} />
    </span>
  );
}

/* -------- Initial form states -------- */
const BLANK_ITEM = {
  name: '', description: '', price: '', category: '', emoji: '🍽️',
  is_veg: true, cuisine_type: '', prep_time: '', is_available: true,
};

const BLANK_CAT = { name: '', emoji: '🍽️', sort_order: 0, is_active: true };

export default function MenuPage() {
  /* ---- state ---- */
  const [activeTab,     setActiveTab]     = useState('items');
  const [items,         setItems]         = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [loadingItems,  setLoadingItems]  = useState(true);
  const [loadingCats,   setLoadingCats]   = useState(true);
  const [catFilter,     setCatFilter]     = useState('');
  const [stockFilter,   setStockFilter]   = useState('all'); // all, in_stock, out_of_stock
  const [catStatusFilter, setCatStatusFilter] = useState('all'); // all, active, inactive

  /* item modal */
  const [itemModal,     setItemModal]     = useState(false);
  const [itemForm,      setItemForm]      = useState(BLANK_ITEM);
  const [editingItem,   setEditingItem]   = useState(null);
  const [savingItem,    setSavingItem]    = useState(false);

  /* category modal */
  const [catModal,      setCatModal]      = useState(false);
  const [catForm,       setCatForm]       = useState(BLANK_CAT);
  const [editingCat,    setEditingCat]    = useState(null);
  const [savingCat,     setSavingCat]     = useState(false);

  /* confirm dialogs */
  const [deleteItem,    setDeleteItem]    = useState(null);
  const [deleteCat,     setDeleteCat]     = useState(null);

  /* ---- Computed filtered lists ---- */
  const filteredItems = items.filter((item) => {
    if (stockFilter === 'in_stock' && !item.is_available) return false;
    if (stockFilter === 'out_of_stock' && item.is_available) return false;
    return true;
  });

  const filteredCategories = categories.filter((cat) => {
    if (catStatusFilter === 'active' && !cat.is_active) return false;
    if (catStatusFilter === 'inactive' && cat.is_active) return false;
    return true;
  });

  const inStockCount = items.filter((i) => i.is_available).length;
  const outOfStockCount = items.filter((i) => !i.is_available).length;
  const activeCatCount = categories.filter((c) => c.is_active).length;
  const inactiveCatCount = categories.filter((c) => !c.is_active).length;

  /* ---- fetch ---- */
  const fetchItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const params = { limit: 200 };
      if (catFilter) params.category = catFilter;
      const res = await api.getMenuItems(params);
      const body = res.data;
      setItems(body.items ?? body.data ?? body ?? []);
    } catch { toast.error('Failed to load menu items'); }
    finally   { setLoadingItems(false); }
  }, [catFilter]);

  const fetchCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const res  = await api.getCategories();
      const body = res.data;
      setCategories(body.categories ?? body.data ?? body ?? []);
    } catch { toast.error('Failed to load categories'); }
    finally   { setLoadingCats(false); }
  }, []);

  useEffect(() => { fetchItems();      }, [fetchItems]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  /* ---- Item CRUD ---- */
  const openAddItem = ()          => { setEditingItem(null); setItemForm(BLANK_ITEM); setItemModal(true); };
  const openEditItem = (item) => {
    setEditingItem(item._id ?? item.id);
    setItemForm({
      name:         item.name          ?? '',
      description:  item.description   ?? '',
      price:        item.price         ?? '',
      category:     item.category?._id ?? item.category ?? '',
      emoji:        item.emoji         ?? '🍽️',
      is_veg:       item.is_veg        ?? true,
      cuisine_type: item.cuisine_type  ?? '',
      prep_time:    item.prep_time     ?? '',
      is_available: item.is_available  ?? true,
    });
    setItemModal(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    setSavingItem(true);
    try {
      const body = { ...itemForm, price: Number(itemForm.price), prep_time: Number(itemForm.prep_time) || undefined };
      if (editingItem) {
        await api.updateMenuItem(editingItem, body);
        toast.success('Item updated');
      } else {
        await api.createMenuItem(body);
        toast.success('Item created');
      }
      setItemModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save item');
    } finally {
      setSavingItem(false);
    }
  };

  const handleToggleAvail = async (item) => {
    const id = item._id ?? item.id;
    const newStatus = !item.is_available;
    // Optimistic update - update local state immediately
    setItems((prev) => prev.map((i) => (i._id ?? i.id) === id ? { ...i, is_available: newStatus } : i));
    try {
      await api.updateMenuItem(id, { is_available: newStatus });
      toast.success(newStatus ? 'Item marked In Stock' : 'Item marked Out of Stock');
    } catch {
      // Revert on error
      setItems((prev) => prev.map((i) => (i._id ?? i.id) === id ? { ...i, is_available: !newStatus } : i));
      toast.error('Failed to update');
    }
  };

  const confirmDeleteItem = async () => {
    try {
      await api.deleteMenuItem(deleteItem._id ?? deleteItem.id);
      toast.success('Item deleted');
      fetchItems();
    } catch { toast.error('Failed to delete'); }
  };

  /* ---- Category CRUD ---- */
  const openAddCat  = ()      => { setEditingCat(null); setCatForm(BLANK_CAT); setCatModal(true); };
  const openEditCat = (cat) => {
    setEditingCat(cat._id ?? cat.id);
    setCatForm({ name: cat.name ?? '', emoji: cat.emoji ?? '🍽️', sort_order: cat.sort_order ?? 0, is_active: cat.is_active ?? true });
    setCatModal(true);
  };

  const handleToggleCatActive = async (cat) => {
    const id = cat._id ?? cat.id;
    const newStatus = !cat.is_active;
    // Optimistic update - update local state immediately
    setCategories((prev) => prev.map((c) => (c._id ?? c.id) === id ? { ...c, is_active: newStatus } : c));
    try {
      await api.updateCategory(id, { is_active: newStatus });
      toast.success(newStatus ? 'Category activated' : 'Category deactivated');
    } catch {
      // Revert on error
      setCategories((prev) => prev.map((c) => (c._id ?? c.id) === id ? { ...c, is_active: !newStatus } : c));
      toast.error('Failed to update category');
    }
  };

  const saveCat = async (e) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      if (editingCat) {
        await api.updateCategory(editingCat, catForm);
        toast.success('Category updated');
      } else {
        await api.createCategory(catForm);
        toast.success('Category created');
      }
      setCatModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save category');
    } finally {
      setSavingCat(false);
    }
  };

  /* ---- Render ---- */
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Menu Management</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={openAddCat}>
            <PlusIcon size={14} color="currentColor" /> Category
          </button>
          <button className="btn btn-primary" onClick={openAddItem}>
            <PlusIcon size={14} color="#fff" /> Add Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {['items', 'categories'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding:      '10px 20px',
              fontSize:     '0.875rem',
              fontWeight:   activeTab === tab ? 700 : 500,
              color:        activeTab === tab ? 'var(--saffron)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--saffron)' : '2px solid transparent',
              marginBottom: -2,
              background:   'transparent',
              cursor:       'pointer',
              textTransform:'capitalize',
              transition:   'all 0.15s',
            }}
          >
            {tab === 'items' ? `Menu Items (${items.length})` : `Categories (${categories.length})`}
          </button>
        ))}
      </div>

      {/* Items tab */}
      {activeTab === 'items' && (
        <div>
          {/* Filters */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ maxWidth: 220 }}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id ?? c.id} value={c._id ?? c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>

            {/* Stock filter buttons */}
            <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setStockFilter('all')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: stockFilter === 'all' ? 'var(--saffron)' : 'var(--cream)',
                  color: stockFilter === 'all' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setStockFilter('in_stock')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: stockFilter === 'in_stock' ? 'var(--green)' : 'var(--cream)',
                  color: stockFilter === 'in_stock' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderLeft: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                In Stock ({inStockCount})
              </button>
              <button
                onClick={() => setStockFilter('out_of_stock')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: stockFilter === 'out_of_stock' ? 'var(--error)' : 'var(--cream)',
                  color: stockFilter === 'out_of_stock' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderLeft: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                Out of Stock ({outOfStockCount})
              </button>
            </div>

            {(catFilter || stockFilter !== 'all') && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setCatFilter(''); setStockFilter('all'); }}>Clear Filters</button>
            )}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingItems ? (
              <div className="loading-center">
                <div className="loading-spinner" />
                Loading items…
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><MenuIcon size={24} color="var(--text-muted)" /></div>
                <h3>No items found</h3>
                <p>{stockFilter !== 'all' ? 'Try changing the filter' : 'Add your first menu item to get started'}</p>
              </div>
            ) : (
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Type</th>
                      <th>Rating</th>
                      <th>Stock Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const id = item._id ?? item.id;
                      const catName = item.category?.name ?? categories.find((c) => (c._id ?? c.id) === item.category)?.name ?? '—';
                      return (
                        <tr key={id} style={{ opacity: item.is_available ? 1 : 0.6 }}>
                          <td style={{ fontSize: '1.3rem', paddingRight: 0 }}>{item.emoji ?? '🍽️'}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                            {item.description && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{catName}</td>
                          <td style={{ fontWeight: 700 }}>₹{item.price}</td>
                          <td><VegBadge isVeg={item.is_veg} /></td>
                          <td>
                            {item.avg_rating != null ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                                <StarIcon size={13} color="#22C55E" filled />
                                {Number(item.avg_rating).toFixed(1)}
                              </span>
                            ) : '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: 99,
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background: item.is_available ? '#E8F5E9' : '#122519',
                                color: item.is_available ? 'var(--green)' : 'var(--error)',
                                border: `1px solid ${item.is_available ? '#A5D6A7' : '#1F3328'}`,
                              }}>
                                {item.is_available ? 'In Stock' : 'Out of Stock'}
                              </span>
                              <Toggle
                                checked={item.is_available}
                                onChange={() => handleToggleAvail(item)}
                              />
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => openEditItem(item)}>
                                <EditIcon size={13} color="currentColor" /> Edit
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => setDeleteItem(item)}>
                                <TrashIcon size={13} color="#fff" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories tab */}
      {activeTab === 'categories' && (
        <div>
          {/* Category status filter */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setCatStatusFilter('all')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: catStatusFilter === 'all' ? 'var(--saffron)' : 'var(--cream)',
                  color: catStatusFilter === 'all' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                All ({categories.length})
              </button>
              <button
                onClick={() => setCatStatusFilter('active')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: catStatusFilter === 'active' ? 'var(--green)' : 'var(--cream)',
                  color: catStatusFilter === 'active' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderLeft: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                Active ({activeCatCount})
              </button>
              <button
                onClick={() => setCatStatusFilter('inactive')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: catStatusFilter === 'inactive' ? 'var(--error)' : 'var(--cream)',
                  color: catStatusFilter === 'inactive' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderLeft: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                Inactive ({inactiveCatCount})
              </button>
            </div>
            {catStatusFilter !== 'all' && (
              <button className="btn btn-ghost btn-sm" onClick={() => setCatStatusFilter('all')}>Clear</button>
            )}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingCats ? (
              <div className="loading-center">
                <div className="loading-spinner" />
                Loading…
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><MenuIcon size={24} color="var(--text-muted)" /></div>
                <h3>No categories found</h3>
                <p>{catStatusFilter !== 'all' ? 'Try changing the filter' : 'Create your first category'}</p>
              </div>
            ) : (
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Sort</th>
                      <th>Emoji</th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredCategories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((cat) => (
                      <tr key={cat._id ?? cat.id} style={{ opacity: cat.is_active ? 1 : 0.6 }}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{cat.sort_order ?? 0}</td>
                        <td style={{ fontSize: '1.4rem' }}>{cat.emoji}</td>
                        <td style={{ fontWeight: 600 }}>{cat.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.slug}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 99,
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background: cat.is_active ? '#E8F5E9' : '#122519',
                              color: cat.is_active ? 'var(--green)' : 'var(--error)',
                              border: `1px solid ${cat.is_active ? '#A5D6A7' : '#1F3328'}`,
                            }}>
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <Toggle
                              checked={cat.is_active}
                              onChange={() => handleToggleCatActive(cat)}
                            />
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditCat(cat)}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Modal */}
      <Modal open={itemModal} onClose={() => setItemModal(false)} title={editingItem ? 'Edit Item' : 'Add Menu Item'} size="md">
        <form onSubmit={saveItem}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. Butter Chicken" />
            </div>
            <div className="form-group">
              <label className="form-label">Emoji</label>
              <input value={itemForm.emoji} onChange={(e) => setItemForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="🍛" />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Description</label>
            <textarea rows={2} value={itemForm.description} onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description…" style={{ resize: 'vertical' }} />
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input type="number" min="0" step="0.01" value={itemForm.price} onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))} required placeholder="149" />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select value={itemForm.category} onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))} required>
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c._id ?? c.id} value={c._id ?? c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Cuisine Type</label>
              <input value={itemForm.cuisine_type} onChange={(e) => setItemForm((f) => ({ ...f, cuisine_type: e.target.value }))} placeholder="North Indian" />
            </div>
            <div className="form-group">
              <label className="form-label">Prep Time (mins)</label>
              <input type="number" min="0" value={itemForm.prep_time} onChange={(e) => setItemForm((f) => ({ ...f, prep_time: e.target.value }))} placeholder="20" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, padding: '12px 16px', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
              <input type="checkbox" checked={itemForm.is_veg} onChange={(e) => setItemForm((f) => ({ ...f, is_veg: e.target.checked }))} style={{ width: 16, height: 16 }} />
              <VegBadge isVeg={true} /> Vegetarian
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
              <input type="checkbox" checked={itemForm.is_available} onChange={(e) => setItemForm((f) => ({ ...f, is_available: e.target.checked }))} style={{ width: 16, height: 16 }} />
              Available
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setItemModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={savingItem}>
              {savingItem ? 'Saving…' : editingItem ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title={editingCat ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={saveCat}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. Biryani" />
            </div>
            <div className="form-group">
              <label className="form-label">Emoji</label>
              <input value={catForm.emoji} onChange={(e) => setCatForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="🍛" />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Sort Order</label>
            <input type="number" min="0" value={catForm.sort_order} onChange={(e) => setCatForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20, fontSize: '0.875rem', fontWeight: 600 }}>
            <input type="checkbox" checked={catForm.is_active} onChange={(e) => setCatForm((f) => ({ ...f, is_active: e.target.checked }))} style={{ width: 16, height: 16 }} />
            Active
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCatModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={savingCat}>
              {savingCat ? 'Saving…' : editingCat ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete item */}
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDeleteItem}
        title="Delete Menu Item"
        message={`Delete "${deleteItem?.name}"? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
