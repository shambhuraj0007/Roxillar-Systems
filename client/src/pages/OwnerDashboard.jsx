import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function OwnerDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/owner/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) return <div className="page-section"><p>Loading...</p></div>;

  const [sort, setSort] = useState({ field: 'date', order: 'desc' });

  function toggleSort(field) {
    setSort(s => ({ field, order: s.field === field && s.order === 'asc' ? 'desc' : 'asc' }));
  }

  const sortIcon = f => sort.field === f ? (sort.order === 'asc' ? ' ↑' : ' ↓') : '';

  const sortedRaters = [...(data?.raters || [])].sort((a, b) => {
    let vA = a[sort.field === 'date' ? 'created_at' : sort.field];
    let vB = b[sort.field === 'date' ? 'created_at' : sort.field];
    if (sort.field === 'rating') {
      return sort.order === 'asc' ? vA - vB : vB - vA;
    }
    if (sort.field === 'date') {
      return sort.order === 'asc' ? new Date(vA) - new Date(vB) : new Date(vB) - new Date(vA);
    }
    return sort.order === 'asc' ? String(vA).localeCompare(String(vB)) : String(vB).localeCompare(String(vA));
  });

  return (
    <div className="page-section">
      <div className="page-header">
        <h2>My Store Dashboard</h2>
        <Link to="/update-password" className="btn-secondary">Change Password</Link>
      </div>

      <div className="stat-card" style={{ maxWidth: 200 }}>
        <span className="stat-num">{data.avgRating ?? '—'}</span>
        <span>Average Rating ★</span>
      </div>

      <h3 style={{ marginTop: '2rem' }}>User Ratings</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => toggleSort('name')} className="sortable">Name{sortIcon('name')}</th>
            <th onClick={() => toggleSort('email')} className="sortable">Email{sortIcon('email')}</th>
            <th onClick={() => toggleSort('rating')} className="sortable">Rating{sortIcon('rating')}</th>
            <th onClick={() => toggleSort('date')} className="sortable">Date{sortIcon('date')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedRaters.map((r, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 600 }}>{r.name}</td>
              <td>{r.email}</td>
              <td><span className="rating-badge">★ {r.rating}</span></td>
              <td>{new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {sortedRaters.length === 0 && (
            <tr><td colSpan="4" className="empty-row">No ratings yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
