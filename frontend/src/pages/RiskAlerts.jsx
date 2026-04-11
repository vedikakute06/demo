import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyzeRisk } from '../services/api';

export default function RiskAlerts() {
  const { user } = useAuth();
  const [riskData, setRiskData] = useState(null);

  useEffect(() => {
    if (user?.user_id) {
      analyzeRisk(user.user_id).then(r => setRiskData(r.data)).catch(() => {});
    }
  }, [user]);

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Risk Alerts</div>
          <div className="page-sub">3 active alerts requiring attention</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">High Alerts</div><div className="stat-value" style={{ color: '#a32d2d' }}>1</div></div>
        <div className="stat-card"><div className="stat-label">Medium Alerts</div><div className="stat-value" style={{ color: '#854f0b' }}>2</div></div>
        <div className="stat-card"><div className="stat-label">Resolved</div><div className="stat-value" style={{ color: '#3b6d11' }}>5</div></div>
        <div className="stat-card"><div className="stat-label">Risk Score</div><div className="stat-value">Medium</div></div>
      </div>

      {/* High Alert */}
      <div className="alert-item">
        <div className="alert-icon-wrap" style={{ background: '#fcebeb' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2 L16 15 H2 Z" stroke="#a32d2d" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
            <path d="M9 7v4M9 12.5v.5" stroke="#a32d2d" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="alert-body">
          <div className="alert-title">Anomalous transaction detected</div>
          <div className="alert-desc">A ₹2,400 Swiggy order on Jun 14 is 4.2× your average food order. This may be an error or unauthorized use.</div>
          <span className="alert-action" style={{ color: '#a32d2d' }}>Review transaction →</span>
        </div>
        <span className="risk-badge risk-high">High</span>
      </div>

      {/* Medium Alert 1 */}
      <div className="alert-item">
        <div className="alert-icon-wrap" style={{ background: '#faeeda' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="#854f0b" strokeWidth="1.5"/>
            <path d="M9 5v4.5M9 11.5v.5" stroke="#854f0b" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="alert-body">
          <div className="alert-title">Food budget 19% over limit</div>
          <div className="alert-desc">You've spent ₹9,500 of your ₹8,000 food budget this month. At this rate you'll end the month ₹2,800 over budget.</div>
          <span className="alert-action">View budget tips →</span>
        </div>
        <span className="risk-badge risk-med">Medium</span>
      </div>

      {/* Medium Alert 2 */}
      <div className="alert-item">
        <div className="alert-icon-wrap" style={{ background: '#faeeda' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="#854f0b" strokeWidth="1.5"/>
            <path d="M9 5v4.5M9 11.5v.5" stroke="#854f0b" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="alert-body">
          <div className="alert-title">Emergency fund below 2 months</div>
          <div className="alert-desc">Your emergency fund covers only 1.8 months of expenses. Financial advisors recommend 6 months minimum.</div>
          <span className="alert-action">Build emergency fund →</span>
        </div>
        <span className="risk-badge risk-med">Medium</span>
      </div>

      {/* Resolved */}
      <div style={{ marginTop: '16px' }}>
        <div className="card-title" style={{ marginBottom: '12px' }}>Resolved Alerts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: '.5' }}>
          <div className="alert-item" style={{ marginBottom: 0, background: '#f8fbff' }}>
            <div className="alert-body"><div className="alert-title">✓ SIP auto-pay set up successfully</div></div>
            <span className="risk-badge risk-low">Resolved</span>
          </div>
          <div className="alert-item" style={{ marginBottom: 0, background: '#f8fbff' }}>
            <div className="alert-body"><div className="alert-title">✓ Goa trip goal is on track</div></div>
            <span className="risk-badge risk-low">Resolved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
