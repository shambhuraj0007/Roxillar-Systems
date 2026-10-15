import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const roleLabel = { admin: 'Admin', user: 'User', owner: 'Store Owner' };

  return (
    <nav className="navbar">
      <div className="navbar-brand">StoreRate</div>
      {user && (
        <div className="navbar-right">
          <span className="role-badge">{roleLabel[user.role]}</span>
          <span className="navbar-name">{user.name.split(' ')[0]}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
}
