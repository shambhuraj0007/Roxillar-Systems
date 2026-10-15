import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const rules = {
  name: v => v.length >= 20 && v.length <= 60,
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  password: v => /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/.test(v),
  address: v => !v || v.length <= 400
};

const messages = {
  name: 'Name must be 20 to 60 characters',
  email: 'Enter a valid email',
  password: '8-16 chars, one uppercase, one special character',
  address: 'Address must be under 400 characters'
};

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    Object.keys(rules).forEach(k => {
      if (!rules[k](form[k])) e[k] = messages[k];
    });
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;

    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.message || 'Signup failed'); return; }
      navigate('/login');
    } catch {
      setServerError('Could not connect. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function update(field, val) {
    setForm({ ...form, [field]: val });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="auth-sub">Join as a normal user</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input
              type="text"
              placeholder="Full name (20–60 characters)"
              value={form.name}
              onChange={e => update('name', e.target.value)}
            />
            <div className="validation-hints">
              <span className={`hint-pill ${form.name.length >= 20 && form.name.length <= 60 ? 'valid' : ''}`}>
                ✓ 20–60 characters ({form.name.length}/60)
              </span>
            </div>
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Password (8–16 characters)"
              value={form.password}
              onChange={e => update('password', e.target.value)}
            />
            <div className="validation-hints">
              <span className={`hint-pill ${form.password.length >= 8 && form.password.length <= 16 ? 'valid' : ''}`}>
                ✓ 8–16 chars
              </span>
              <span className={`hint-pill ${/[A-Z]/.test(form.password) ? 'valid' : ''}`}>
                ✓ 1 Uppercase (A-Z)
              </span>
              <span className={`hint-pill ${/[!@#$%^&*]/.test(form.password) ? 'valid' : ''}`}>
                ✓ 1 Special char (!@#$%)
              </span>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="field">
            <label>Address</label>
            <input
              type="text"
              placeholder="Your address (optional, max 400 chars)"
              value={form.address}
              onChange={e => update('address', e.target.value)}
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>

          {serverError && <p className="error-msg">{serverError}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
