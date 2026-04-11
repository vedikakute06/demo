import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".8"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".8"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4"/>
      </svg>
    ),
  },
  {
    path: '/budget-insights',
    label: 'Budget Insights',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="6" width="3" height="9" rx="1" fill="currentColor" opacity=".5"/>
        <rect x="6" y="3" width="3" height="12" rx="1" fill="currentColor" opacity=".8"/>
        <rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    path: '/behavior-insights',
    label: 'Behavior',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M2 12 C4 8 6 10 8 6 S12 2 14 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/financial-health',
    label: 'Financial Health',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M8 14s-6-3.5-6-8a4 4 0 0 1 6-3.46A4 4 0 0 1 14 6c0 4.5-6 8-6 8z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
  },
  {
    path: '/goals',
    label: 'Goals',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="8" cy="8" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    path: '/retirement',
    label: 'Retirement',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M2 14V8l4-4 4 4 4-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    path: '/emergency-fund',
    label: 'Emergency Fund',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M8 2 L14 13 H2 Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
        <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/what-if',
    label: 'What-If Simulator',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M3 8a5 5 0 1 1 10 0" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 13V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/risk-alerts',
    label: 'Risk Alerts',
    badge: '3',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/investment',
    label: 'Investment',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M2 14 L8 2 L14 14" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <circle cx="8" cy="9" r="2" fill="currentColor"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">FinSense AI</div>
        <div className="logo-sub">Personal Finance</div>
      </div>
      <nav className="nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="user-av" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: '12px', cursor: 'pointer' }} onClick={() => navigate('/profile')}>{user?.name || 'User'}</div>
            <div
              style={{ color: 'rgba(255,255,255,.4)', fontSize: '10px', cursor: 'pointer' }}
              onClick={logout}
            >
              Sign out
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
