import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEmergencyFund, calculateEmergencyFund } from '../services/api';

export default function EmergencyFund() {
  const { user } = useAuth();
  const [fund, setFund] = useState(null);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.user_id) fetchFund();
  }, [user]);

  const fetchFund = () => {
    getEmergencyFund(user.user_id)
      .then(r => {
        setFund(r.data);
        if (r.data.desired_months) setMonths(r.data.desired_months);
      })
      .catch(() => {});
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      await calculateEmergencyFund({ user_id: user.user_id, desired_months: parseInt(months) });
      fetchFund();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const pct = fund?.recommended_fund ? Math.min(Math.round((fund.current_emergency_savings / fund.recommended_fund) * 100), 100) : 0;
  const dashArray = `${(pct / 100) * 251} ${251 - (pct / 100) * 251}`;

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Emergency Fund</div>
          <div className="page-sub">Build your financial safety net</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-title">Emergency Fund Status</div>
        <div className="ef-ring-wrap">
          <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e6f1fb" strokeWidth="12"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#ef9f27" strokeWidth="12" strokeDasharray={dashArray} strokeLinecap="round" transform="rotate(-90 50 50)"/>
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--navy)' }}>{pct}%</div>
            </div>
          </div>
          <div className="ef-stats">
            <div className="ef-row"><span className="ef-label">Current savings</span><span className="ef-val">₹{(fund?.current_emergency_savings || 0).toLocaleString('en-IN')}</span></div>
            <div className="ef-row"><span className="ef-label">Target ({months} months)</span><span className="ef-val">₹{(fund?.recommended_fund || 0).toLocaleString('en-IN')}</span></div>
            <div className="ef-row"><span className="ef-label">Shortfall</span><span className="ef-val" style={{ color: '#a32d2d' }}>₹{(fund?.gap || 0).toLocaleString('en-IN')}</span></div>
            <div className="ef-row"><span className="ef-label">Monthly expenses</span><span className="ef-val">₹{(fund?.monthly_expense || 0).toLocaleString('en-IN')}</span></div>
            
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select className="month-select" value={months} onChange={e => setMonths(e.target.value)} style={{ padding: '6px', fontSize: '12px' }}>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={9}>9 Months</option>
                <option value={12}>12 Months</option>
              </select>
              <button className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={handleCalculate} disabled={loading}>
                {loading ? '...' : 'Recalculate'}
              </button>
            </div>
          </div>
        </div>
        {fund?.status === 'critical' && (
          <div style={{ padding: '12px', background: '#fff4e0', borderRadius: '8px', fontSize: '12px', color: '#7a5500' }}>
            ⚠ You are short of a full emergency fund. An unexpected job loss or medical emergency could strain your finances.
          </div>
        )}
      </div>

      <div className="mid-grid">
        <div className="card">
          <div className="card-title">Build-up Plan</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>To reach ₹1,50,000 by March 2026:</div>
          <div className="bar-row">
            <div className="bar-label">Need/month</div>
            <div className="bar-track"><div className="bar-fill" style={{ width: '70%', background: 'var(--navy2)' }}></div></div>
            <div className="bar-amt">₹5,556</div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px', marginLeft: '80px' }}>7.4% of your income</div>
          <div className="insight-card" style={{ padding: '12px' }}>
            <div className="insight-title" style={{ marginBottom: '6px' }}>Suggested savings account</div>
            <div className="insight-text">Consider a high-yield savings account or liquid mutual fund — earn 4–7% vs 3.5% in regular savings. HDFC Liquid Fund or Paytm Money are good options.</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">When to use your fund</div>
          <div className="insight-card" style={{ padding: '12px', marginBottom: '8px' }}>
            <div className="insight-badge" style={{ background: '#eaf3de', color: '#3b6d11' }}>Use for</div>
            <div className="insight-text">Job loss · Medical emergencies · Urgent home/vehicle repairs · Family crises</div>
          </div>
          <div className="insight-card" style={{ padding: '12px' }}>
            <div className="insight-badge" style={{ background: '#fcebeb', color: '#a32d2d' }}>Don't use for</div>
            <div className="insight-text">Vacations · Gadget upgrades · Investment opportunities · Planned expenses</div>
          </div>
        </div>
      </div>
    </div>
  );
}
