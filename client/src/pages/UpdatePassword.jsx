import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function UpdatePassword() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const backUrl = user?.role === 'admin' ? '/admin' : user?.role === 'owner' ? '/owner' : '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    const passRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/;
    if (!passRegex.test(form.newPassword)) {
      setError('Password must meet all complexity requirements');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setMessage('Password updated successfully! Redirecting...');
      setForm({ currentPassword: '', newPassword: '' });
      setTimeout(() => navigate(backUrl), 1500);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-container">
      <div className="card auth-card" style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Change Password</h2>
          <Link to={backUrl} style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none', fontWeight: 500 }}>
            ← Back
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new secure password"
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              required
            />
            <div className="validation-hints">
              <span className={`hint-pill ${form.newPassword.length >= 8 && form.newPassword.length <= 16 ? 'valid' : ''}`}>
                ✓ 8–16 chars
              </span>
              <span className={`hint-pill ${/[A-Z]/.test(form.newPassword) ? 'valid' : ''}`}>
                ✓ 1 Uppercase (A-Z)
              </span>
              <span className={`hint-pill ${/[!@#$%^&*]/.test(form.newPassword) ? 'valid' : ''}`}>
                ✓ 1 Special char (!@#$%)
              </span>
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}
          {message && <p className="success-msg">{message}</p>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
