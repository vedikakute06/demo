import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRetirementPlan } from '../services/api';

export default function RetirementPlanning() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (user?.user_id) {
      getRetirementPlan(user.user_id).then(r => setPlan(r.data)).catch(() => {});
    }
  }, [user]);

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Retirement Planning</div>
          <div className="page-sub">Plan your financial independence at 60</div>
        </div>
      </div>

      <div className="ret-highlight">
        <div style={{ fontSize: '12px', opacity: '.65', marginBottom: '6px' }}>Projected retirement corpus at 60</div>
        <div className="ret-big">₹2.8 Crore</div>
        <div className="ret-sub">Based on ₹6,000/month SIP · 8% annual return · 30 years</div>
      </div>

      <div className="ret-grid">
        <div className="ret-card"><div className="stat-label">Current Age</div><div className="stat-value" style={{ fontSize: '18px' }}>30</div></div>
        <div className="ret-card"><div className="stat-label">Retirement Age</div><div className="stat-value" style={{ fontSize: '18px' }}>60</div></div>
        <div className="ret-card"><div className="stat-label">Monthly SIP</div><div className="stat-value" style={{ fontSize: '18px' }}>₹6,000</div></div>
        <div className="ret-card"><div className="stat-label">Years to Retire</div><div className="stat-value" style={{ fontSize: '18px' }}>30 yrs</div></div>
      </div>

      <div className="mid-grid">
        <div className="card">
          <div className="card-title">Corpus Projection</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="bar-row"><div className="bar-label">At 40</div><div className="bar-track"><div className="bar-fill" style={{ width: '10%', background: '#b5d4f4' }}></div></div><div className="bar-amt">₹11.2L</div></div>
            <div className="bar-row"><div className="bar-label">At 45</div><div className="bar-track"><div className="bar-fill" style={{ width: '20%', background: 'var(--navy3)' }}></div></div><div className="bar-amt">₹31.4L</div></div>
            <div className="bar-row"><div className="bar-label">At 50</div><div className="bar-track"><div className="bar-fill" style={{ width: '40%', background: 'var(--navy2)' }}></div></div><div className="bar-amt">₹74.5L</div></div>
            <div className="bar-row"><div className="bar-label">At 55</div><div className="bar-track"><div className="bar-fill" style={{ width: '65%', background: 'var(--navy)' }}></div></div><div className="bar-amt">₹1.52Cr</div></div>
            <div className="bar-row"><div className="bar-label">At 60</div><div className="bar-track"><div className="bar-fill" style={{ width: '100%', background: '#185fa5' }}></div></div><div className="bar-amt">₹2.8Cr</div></div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Recommendations</div>
          <div className="insight-card" style={{ padding: '12px', marginBottom: '10px' }}>
            <div className="insight-badge" style={{ background: '#e6f1fb', color: 'var(--navy2)' }}>Boost corpus</div>
            <div className="insight-title">Increase SIP to ₹10,000</div>
            <div className="insight-text">Adding ₹4,000/month more today grows your corpus to ₹4.7 Crore — a 68% boost for just ₹4K more monthly.</div>
          </div>
          <div className="insight-card" style={{ padding: '12px' }}>
            <div className="insight-badge" style={{ background: '#eaf3de', color: '#3b6d11' }}>NPS benefit</div>
            <div className="insight-title">Open an NPS Tier 1 account</div>
            <div className="insight-text">NPS offers 80CCD(1B) — extra ₹50,000 deduction above 80C. Saves ₹15,000 in tax annually at 30% bracket.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
