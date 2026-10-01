import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { UsersIcon, SearchIcon, RefreshIcon, AlertIcon } from '../components/Icons';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtCurrency(n) {
  if (n == null) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export default function UsersPage() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search,     setSearch]     = useState('');

  const fetchUsers = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20 };
      if (search) params.search = search;
      const res  = await api.getUsers(params);
      const body = res.data;
      setUsers(body.users ?? body.data ?? body ?? []);
      setTotalPages(body.total_pages ?? body.totalPages ?? 1);
      setTotalCount(body.total       ?? body.count      ?? 0);
      setPage(pg);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const RoleBadge = ({ role }) => {
    const isAdmin = role === 'admin';
    return (
      <span style={{
        display:      'inline-block',
        padding:      '2px 10px',
        borderRadius: 99,
        fontSize:     '0.72rem',
        fontWeight:   600,
        background:   isAdmin ? '#DCFCE7' : 'var(--cream-dark)',
        color:        isAdmin ? '#166534' : 'var(--text-muted)',
        border:       `1px solid ${isAdmin ? '#86EFAC' : 'var(--border)'}`,
        textTransform:'capitalize',
      }}>
        {isAdmin ? 'Admin' : role ?? 'user'}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{totalCount} registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
          style={{ maxWidth: 280 }}
        />
        <button className="btn btn-primary btn-sm" onClick={() => fetchUsers(1)}>Search</button>
        {search && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); fetchUsers(1); }}>
            Clear
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center">
            <div className="loading-spinner" />
            Loading users…
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon"><AlertIcon size={24} color="var(--error)" /></div>
            <h3>Failed to load users</h3>
            <p style={{ color: 'var(--error)' }}>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => fetchUsers(1)}>
              <RefreshIcon size={14} color="currentColor" /> Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><UsersIcon size={24} color="var(--text-muted)" /></div>
            <h3>No users found</h3>
            <p>Try adjusting your search</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => {
                  const rowNum = (page - 1) * 20 + idx + 1;
                  return (
                    <tr key={user._id ?? user.id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>{rowNum}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width:          36,
                            height:         36,
                            borderRadius:   '50%',
                            background:     `hsl(${(user.name?.charCodeAt(0) ?? 65) * 5}, 60%, 88%)`,
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            fontWeight:     700,
                            fontSize:       '0.875rem',
                            color:          `hsl(${(user.name?.charCodeAt(0) ?? 65) * 5}, 40%, 35%)`,
                            flexShrink:     0,
                          }}>
                            {(user.name ?? user.phone ?? 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{user.name ?? '—'}</div>
                            {user.email && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{user.phone ?? '—'}</td>
                      <td><RoleBadge role={user.role} /></td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{user.orders_count ?? user.ordersCount ?? '—'}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {fmtCurrency(user.total_spent ?? user.totalSpent)}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {fmtDate(user.created_at ?? user.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="pagination">
            <span>Page {page} of {totalPages} &nbsp;·&nbsp; {totalCount} users</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchUsers(page - 1)}>← Prev</button>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchUsers(page + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
