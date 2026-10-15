import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import { Link } from 'react-router-dom';

export default function UserDashboard() {
  const { token } = useAuth();
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState({ name: '', address: '' });
  const [sort, setSort] = useState({ field: 'name', order: 'asc' });
  const [pendingRating, setPendingRating] = useState({});
  const [toast, setToast] = useState('');

  async function loadStores() {
    const q = new URLSearchParams({ ...search, sortBy: sort.field, order: sort.order });
    const res = await fetch(`http://localhost:5000/api/stores?${q}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setStores(data);
  }

  useEffect(() => { loadStores(); }, [search, sort]);

  function toggleSort(field) {
    setSort(s => ({ field, order: s.field === field && s.order === 'asc' ? 'desc' : 'asc' }));
  }

  async function submitRating(storeId, rating) {
    const res = await fetch(`http://localhost:5000/api/stores/${storeId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rating })
    });
    if (res.ok) {
      setToast('Rating saved successfully!');
      setTimeout(() => setToast(''), 3000);
      loadStores();
    }
  }

  const sortIcon = f => sort.field === f ? (sort.order === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="page-section">
      <div className="page-header">
        <h2>Stores</h2>
        <Link to="/update-password" className="btn-secondary">Change Password</Link>
      </div>

      <div className="filter-row">
        <input placeholder="Search by name" value={search.name}
          onChange={e => setSearch({ ...search, name: e.target.value })} />
        <input placeholder="Search by address" value={search.address}
          onChange={e => setSearch({ ...search, address: e.target.value })} />
        <button
          type="button"
          className="btn-reset"
          onClick={() => setSearch({ name: '', address: '' })}
          title="Clear search"
        >
          Clear Search
        </button>
      </div>

      {toast && (
        <div className="toast-container">
          <div className="toast">
            <span className="toast-icon">✓</span>
            <span>{toast}</span>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            {[['name', 'Store Name'], ['address', 'Address'], ['avgRating', 'Overall Rating']].map(([f, label]) => (
              <th key={f} onClick={() => toggleSort(f)} className="sortable">{label}{sortIcon(f)}</th>
            ))}
            <th>Your Rating</th>
            <th>Rate / Modify</th>
          </tr>
        </thead>
        <tbody>
          {stores.map(store => {
            const hasPending = pendingRating[store.id] !== undefined;
            const currentRating = hasPending ? pendingRating[store.id] : store.myRating;
            const isModified = hasPending && pendingRating[store.id] !== store.myRating;

            return (
              <tr key={store.id}>
                <td style={{ fontWeight: 600 }}>{store.name}</td>
                <td>{store.address || '—'}</td>
                <td>
                  {store.avgRating ? (
                    <span className="rating-badge">★ {store.avgRating}</span>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '13px' }}>No ratings yet</span>
                  )}
                </td>
                <td>
                  {store.myRating ? (
                    <span className="badge badge-user">★ {store.myRating} Rated</span>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Not rated</span>
                  )}
                </td>
                <td>
                  <div className="rate-cell">
                    <StarRating
                      value={currentRating || 0}
                      onChange={val => setPendingRating({ ...pendingRating, [store.id]: val })}
                    />
                    <button
                      type="button"
                      className="btn-action"
                      onClick={() => {
                        const r = pendingRating[store.id] ?? store.myRating;
                        if (r) submitRating(store.id, r);
                      }}
                      disabled={!currentRating}
                    >
                      {store.myRating
                        ? isModified
                          ? 'Update Rating'
                          : 'Saved ✓'
                        : 'Save Rating'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {stores.length === 0 && <tr><td colSpan="5" className="empty-row">No stores found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
