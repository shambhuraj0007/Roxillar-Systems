import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const SORT_FIELDS = ['name', 'email', 'address', 'role'];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [owners, setOwners] = useState([]);
  const [tab, setTab] = useState('users');
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [sort, setSort] = useState({ field: 'name', order: 'asc' });
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', role: 'user' });
  const [storeForm, setStoreForm] = useState({ name: '', email: '', address: '', owner_id: '' });
  const [formError, setFormError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  async function loadStats() {
    const res = await fetch('http://localhost:5000/api/admin/dashboard', { headers });
    setStats(await res.json());
  }

  async function loadOwners() {
    const res = await fetch('http://localhost:5000/api/admin/owners', { headers });
    if (res.ok) setOwners(await res.json());
  }

  async function loadUsers() {
    const q = new URLSearchParams({ ...filters, sortBy: sort.field, order: sort.order });
    const res = await fetch(`http://localhost:5000/api/admin/users?${q}`, { headers });
    setUsers(await res.json());
  }

  async function loadStores() {
    const q = new URLSearchParams({ name: filters.name, address: filters.address, sortBy: sort.field, order: sort.order });
    const res = await fetch(`http://localhost:5000/api/admin/stores?${q}`, { headers });
    setStores(await res.json());
  }

  useEffect(() => { loadStats(); loadOwners(); }, []);
  useEffect(() => { if (tab === 'users') loadUsers(); else loadStores(); }, [tab, filters, sort]);

  function toggleSort(field) {
    setSort(s => ({ field, order: s.field === field && s.order === 'asc' ? 'desc' : 'asc' }));
  }

  async function submitUser(e) {
    e.preventDefault();
    setFormError('');
    const res = await fetch('http://localhost:5000/api/admin/users', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.message || Object.values(data.errors || {}).join(', ')); return; }
    setShowModal(null);
    setForm({ name: '', email: '', password: '', address: '', role: 'user' });
    loadUsers();
  }

  async function submitStore(e) {
    e.preventDefault();
    setFormError('');
    const res = await fetch('http://localhost:5000/api/admin/stores', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(storeForm)
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.message); return; }
    setShowModal(null);
    setStoreForm({ name: '', email: '', address: '' });
    loadStores();
  }

  const sortIcon = field => sort.field === field ? (sort.order === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="page-section">
      {stats && (
        <div className="stats-grid">
          <div className="stat-card"><span className="stat-num">{stats.totalUsers}</span><span>Users</span></div>
          <div className="stat-card"><span className="stat-num">{stats.totalStores}</span><span>Stores</span></div>
          <div className="stat-card"><span className="stat-num">{stats.totalRatings}</span><span>Ratings</span></div>
        </div>
      )}

      <div className="tabs">
        <button className={tab === 'users' ? 'tab active' : 'tab'} onClick={() => setTab('users')}>Users</button>
        <button className={tab === 'stores' ? 'tab active' : 'tab'} onClick={() => setTab('stores')}>Stores</button>
      </div>

      <div className="filter-row">
        {['name', 'email', 'address'].map(f => (
          <input key={f} placeholder={`Filter by ${f}`} value={filters[f]}
            onChange={e => setFilters({ ...filters, [f]: e.target.value })} />
        ))}
        {tab === 'users' && (
          <select value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        )}
        <button
          type="button"
          className="btn-reset"
          onClick={() => setFilters({ name: '', email: '', address: '', role: '' })}
          title="Clear all filters"
        >
          Reset Filters
        </button>
        <button className="btn-primary" onClick={() => setShowModal(tab === 'users' ? 'user' : 'store')}>
          + Add {tab === 'users' ? 'User' : 'Store'}
        </button>
      </div>

      {tab === 'users' ? (
        <table className="data-table">
          <thead>
            <tr>
              {['name', 'email', 'address', 'role'].map(f => (
                <th key={f} onClick={() => toggleSort(f)} className="sortable">
                  {f.charAt(0).toUpperCase() + f.slice(1)}{sortIcon(f)}
                </th>
              ))}
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.address}</td>
                <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                <td>{u.role === 'owner' ? (u.avgRating ? <span className="rating-badge">★ {u.avgRating}</span> : <span style={{ color: 'var(--muted)', fontSize: '13px' }}>No ratings</span>) : '—'}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="5" className="empty-row">No users found</td></tr>}
          </tbody>
        </table>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              {['name', 'email', 'address', 'avgRating'].map(f => (
                <th key={f} onClick={() => toggleSort(f)} className="sortable">
                  {f === 'avgRating' ? 'Rating' : f.charAt(0).toUpperCase() + f.slice(1)}{sortIcon(f)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stores.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.address}</td>
                <td>{s.avgRating ? <span className="rating-badge">★ {s.avgRating}</span> : <span style={{ color: 'var(--muted)', fontSize: '13px' }}>—</span>}</td>
              </tr>
            ))}
            {stores.length === 0 && <tr><td colSpan="4" className="empty-row">No stores found</td></tr>}
          </tbody>
        </table>
      )}

      {showModal === 'user' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add User</h3>
            <form onSubmit={submitUser}>
              {['name', 'email', 'password', 'address'].map(f => (
                <div className="field" key={f}>
                  <label>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                  <input type={f === 'password' ? 'password' : 'text'} value={form[f]}
                    onChange={e => setForm({ ...form, [f]: e.target.value })} required={f !== 'address'} />
                </div>
              ))}
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Store Owner</option>
                </select>
              </div>
              {formError && <p className="error-msg">{formError}</p>}
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Create</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'store' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Store</h3>
            <form onSubmit={submitStore}>
              {['name', 'email', 'address'].map(f => (
                <div className="field" key={f}>
                  <label>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                  <input type={f === 'email' ? 'email' : 'text'} value={storeForm[f]}
                    onChange={e => setStoreForm({ ...storeForm, [f]: e.target.value })} required={f !== 'address'} />
                </div>
              ))}
              <div className="field">
                <label>Store Owner (Optional)</label>
                <select value={storeForm.owner_id} onChange={e => setStoreForm({ ...storeForm, owner_id: e.target.value })}>
                  <option value="">Select an Owner</option>
                  {owners.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
                  ))}
                </select>
              </div>
              {formError && <p className="error-msg">{formError}</p>}
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Create</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
