import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEmergencyFund, calculateEmergencyFund, getUser } from '../services/api';

export default function EmergencyFund() {
  const { user } = useAuth();
  const [fund, setFund] = useState(null);
  const [profile, setProfile] = useState(null);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(null); // null = loading, true/false

  useEffect(() => {
    if (user?.user_id) {
      getUser(user.user_id).then(r => setProfile(r.data)).catch(() => {});
      fetchFund();
    }
  }, [user]);

  const fetchFund = () => {
    getEmergencyFund(user.user_id)
      .then(r => {
        console.log('Emergency fund:', r.data);
        setFund(r.data);
        if (r.data.desired_months) setMonths(r.data.desired_months);
        setHasData(true);
      })
      .catch(() => { setHasData(false); });
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const payload = { 
        user_id: user.user_id, 
        desired_months: parseInt(months)
      };
      const res = await calculateEmergencyFund(payload);
      console.log('Calculate result:', res.data);
      setFund(res.data);
      setHasData(true);
    } catch (err) {
      console.error('Emergency fund error:', err);
    }
    setLoading(false);
  };

  const currentSavings = fund?.current_emergency_savings || 0;
  const recommendedFund = fund?.recommended_fund || 0;
  const gap = fund?.gap || 0;
  const monthlyExpense = fund?.monthly_expense || 0;
  const status = fund?.status || 'critical';
  const desiredMonths = fund?.desired_months || months;

  const pct = recommendedFund > 0 ? Math.min(Math.round((currentSavings / recommendedFund) * 100), 100) : 0;
  const dashArray = `${(pct / 100) * 251} ${251 - (pct / 100) * 251}`;

  // Build-up plan calculations
  const income = profile?.monthly_income || 0;
  const monthsToFill = gap > 0 ? Math.max(Math.ceil(gap / (income * 0.1 || 1)), 1) : 0;
  const monthlySaving = gap > 0 ? Math.round(gap / Math.max(monthsToFill, 1)) : 0;
  const incomePercent = income > 0 ? ((monthlySaving / income) * 100).toFixed(1) : 0;

  // Ring color based on status
  const ringColor = status === 'good' ? '#3b6d11' : status === 'warning' ? '#ef9f27' : '#e24b4a';

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Emergency Fund</div>
          <div className="page-sub">Build your financial safety net</div>
        </div>
      </div>

      {/* Calculate Section — always visible */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-title">
          {hasData ? 'Emergency Fund Status' : 'Calculate Your Emergency Fund'}
        </div>

        {!hasData && hasData !== null && (
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', lineHeight: '1.7' }}>
            Select how many months of expenses you'd like covered for emergencies. We'll calculate the target amount based on your actual spending data.
          </p>
        )}

        {hasData && (
          <div className="ef-ring-wrap">
            <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e6f1fb" strokeWidth="12"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke={ringColor} strokeWidth="12"
                  strokeDasharray={dashArray} strokeLinecap="round" transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}/>
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--navy)' }}>{pct}%</div>
              </div>
            </div>
            <div className="ef-stats">
              <div className="ef-row">
                <span className="ef-label">Current savings</span>
                <span className="ef-val">₹{currentSavings.toLocaleString('en-IN')}</span>
              </div>
              <div className="ef-row">
                <span className="ef-label">Target ({desiredMonths} months)</span>
                <span className="ef-val">₹{recommendedFund.toLocaleString('en-IN')}</span>
              </div>
              <div className="ef-row">
                <span className="ef-label">Shortfall</span>
                <span className="ef-val" style={{ color: gap > 0 ? '#a32d2d' : '#3b6d11' }}>
                  {gap > 0 ? `₹${gap.toLocaleString('en-IN')}` : '✅ Fully funded!'}
                </span>
              </div>
              <div className="ef-row">
                <span className="ef-label">Monthly expenses</span>
                <span className="ef-val">₹{monthlyExpense.toLocaleString('en-IN')}</span>
              </div>
              <div className="ef-row">
                <span className="ef-label">Status</span>
                <span className={`risk-badge ${status === 'good' ? 'risk-low' : status === 'warning' ? 'risk-med' : 'risk-high'}`}>
                  {status === 'good' ? '✅ Good' : status === 'warning' ? '⚠ Warning' : '🔴 Critical'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Input: desired months */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: 'var(--navy)', whiteSpace: 'nowrap' }}>Cover for:</label>
          <select value={months} onChange={e => setMonths(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'var(--font)', color: 'var(--navy)', cursor: 'pointer' }}>
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={9}>9 Months</option>
            <option value={12}>12 Months</option>
            <option value={18}>18 Months</option>
            <option value={24}>24 Months</option>
          </select>
          <button className="btn btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}
            onClick={handleCalculate} disabled={loading}>
            {loading ? 'Calculating...' : hasData ? '🔄 Recalculate' : '📊 Calculate'}
          </button>
        </div>

        {/* Status warning */}
        {fund?.status === 'critical' && (
          <div style={{ marginTop: '14px', padding: '12px', background: '#fcebeb', borderRadius: '8px', fontSize: '12px', color: '#a32d2d', lineHeight: '1.6' }}>
            ⚠ <strong>Critical:</strong> You are significantly short of your emergency fund target. An unexpected job loss or medical emergency could strain your finances severely.
          </div>
        )}
        {fund?.status === 'warning' && (
          <div style={{ marginTop: '14px', padding: '12px', background: '#faeeda', borderRadius: '8px', fontSize: '12px', color: '#854f0b', lineHeight: '1.6' }}>
            ⚠ <strong>Partially covered:</strong> Your emergency fund covers some expenses but falls short of the recommended amount. Continue building it.
          </div>
        )}
        {fund?.status === 'good' && (
          <div style={{ marginTop: '14px', padding: '12px', background: '#eaf3de', borderRadius: '8px', fontSize: '12px', color: '#3b6d11', lineHeight: '1.6' }}>
            ✅ <strong>Well done!</strong> Your emergency fund meets the recommended {desiredMonths}-month target. Keep it liquid and accessible.
          </div>
        )}
      </div>

      {/* Build-up Plan + Tips — only shown when data exists */}
      {hasData && (
        <div className="mid-grid">
          <div className="card">
            <div className="card-title">Build-up Plan</div>
            {gap > 0 ? (
              <>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
                  To reach ₹{recommendedFund.toLocaleString('en-IN')} ({desiredMonths} months of expenses):
                </div>
                <div className="bar-row">
                  <div className="bar-label">Need/month</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{
                      width: `${Math.min(100, income > 0 ? (monthlySaving / income) * 100 * 3 : 50)}%`,
                      background: 'var(--navy2)',
                    }}></div>
                  </div>
                  <div className="bar-amt">₹{monthlySaving.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px', marginLeft: '80px' }}>
                  {incomePercent}% of your income · ~{monthsToFill} months to target
                </div>
                <div className="insight-card" style={{ padding: '12px' }}>
                  <div className="insight-badge" style={{ background: '#e6f1fb', color: 'var(--navy2)' }}>💡 Tip</div>
                  <div className="insight-text">
                    Consider a high-yield savings account or liquid mutual fund — earn 4–7% vs 3.5% in regular savings. This helps your emergency fund grow while staying accessible.
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎉</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#3b6d11', marginBottom: '8px' }}>
                  Emergency fund target reached!
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Your ₹{currentSavings.toLocaleString('en-IN')} covers {desiredMonths} months of expenses.
                  Keep these funds liquid and don't use them for non-emergencies.
                </div>
              </div>
            )}
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
      )}
    </div>
  );
}
