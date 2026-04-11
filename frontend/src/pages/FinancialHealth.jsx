import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFinancialHealth } from '../services/api';

export default function FinancialHealth() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    if (user?.user_id) {
      getFinancialHealth(user.user_id).then(r => setHealth(r.data)).catch(() => {});
    }
  }, [user]);

  const score = health?.score ?? 74;
  const dashArray = `${(score / 100) * 226} ${226 - (score / 100) * 226}`;

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Financial Health</div>
          <div className="page-sub">Your overall financial wellness score</div>
        </div>
      </div>

      <div className="mid-grid">
        <div className="card">
          <div className="card-title">Health Score Breakdown</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="36" fill="none" stroke="#e6f1fb" strokeWidth="10"/>
                <circle cx="45" cy="45" r="36" fill="none" stroke="var(--navy2)" strokeWidth="10" strokeDasharray={dashArray} strokeLinecap="round" transform="rotate(-90 45 45)"/>
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: '500', color: 'var(--navy)' }}>{score}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>/100</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--navy)' }}>
                {score >= 80 ? 'Excellent' : score >= 60 ? 'Good — Room to Improve' : 'Needs Attention'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', lineHeight: '1.5' }}>
                Your score improved by 3 points this month. Focus on emergency fund and reducing food overspend to reach 80+.
              </div>
            </div>
          </div>

          <div className="score-item">
            <div className="score-header"><span className="score-name">Savings Rate</span><span className="score-val" style={{ color: '#3b6d11' }}>31.7% · Excellent</span></div>
            <div className="score-track"><div className="score-fill" style={{ width: `${health?.breakdown?.savings_score || 90}%`, background: '#639922' }}></div></div>
          </div>
          <div className="score-item">
            <div className="score-header"><span className="score-name">Debt Ratio</span><span className="score-val" style={{ color: '#3b6d11' }}>0% · No debt</span></div>
            <div className="score-track"><div className="score-fill" style={{ width: '95%', background: '#639922' }}></div></div>
          </div>
          <div className="score-item">
            <div className="score-header"><span className="score-name">Emergency Fund</span><span className="score-val" style={{ color: '#854f0b' }}>30% · Needs work</span></div>
            <div className="score-track"><div className="score-fill" style={{ width: '30%', background: '#ef9f27' }}></div></div>
          </div>
          <div className="score-item">
            <div className="score-header"><span className="score-name">Budget Adherence</span><span className="score-val" style={{ color: '#854f0b' }}>78% · Fair</span></div>
            <div className="score-track"><div className="score-fill" style={{ width: `${health?.breakdown?.spending_score || 78}%`, background: '#ef9f27' }}></div></div>
          </div>
          <div className="score-item">
            <div className="score-header"><span className="score-name">Investment Rate</span><span className="score-val" style={{ color: '#3b6d11' }}>8% · Good</span></div>
            <div className="score-track"><div className="score-fill" style={{ width: '65%', background: 'var(--navy2)' }}></div></div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Recommendations</div>
          <div className="insight-card" style={{ padding: '12px', marginBottom: '10px' }}>
            <div className="insight-badge" style={{ background: '#faeeda', color: '#854f0b' }}>Priority 1</div>
            <div className="insight-title">Build your emergency fund</div>
            <div className="insight-text">You have 0.6 months of expenses saved. Target: 6 months (₹1,50,000). Add ₹5,000/month to reach it by Mar 2026.</div>
          </div>
          <div className="insight-card" style={{ padding: '12px', marginBottom: '10px' }}>
            <div className="insight-badge" style={{ background: '#e6f1fb', color: 'var(--navy2)' }}>Priority 2</div>
            <div className="insight-title">Increase SIP contributions</div>
            <div className="insight-text">Increasing your monthly SIP from ₹6,000 to ₹10,000 will grow your wealth by ₹8.4L more over 10 years.</div>
          </div>
          <div className="insight-card" style={{ padding: '12px' }}>
            <div className="insight-badge" style={{ background: '#eaf3de', color: '#3b6d11' }}>Maintain</div>
            <div className="insight-title">Zero debt — great work</div>
            <div className="insight-text">You have no outstanding loans or credit card debt. Keep it this way to maintain your excellent credit profile.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
