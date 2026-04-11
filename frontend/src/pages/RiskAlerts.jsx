import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyzeRisk } from '../services/api';

export default function RiskAlerts() {
  const { user } = useAuth();
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.user_id) {
      analyzeRisk(user.user_id)
        .then(r => { console.log('Risk data:', r.data); setRiskData(r.data); })
        .catch((err) => { console.error('Risk API error:', err); })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const alerts = riskData?.alerts || [];
  const riskLevel = riskData?.risk_level || 'N/A';
  const riskScore = riskData?.score ?? 0;
  const expenseRatio = riskData?.metrics?.expense_ratio ?? 0;
  const savingsRatio = riskData?.metrics?.savings_ratio ?? 0;
  const monthsToRisk = riskData?.prediction?.months_to_risk;

  // Classify alerts by severity
  const highAlerts = alerts.filter(a => a.toLowerCase().includes('running out') || a.toLowerCase().includes('overspend'));
  const medAlerts = alerts.filter(a => !highAlerts.includes(a));

  if (loading) {
    return (
      <div className="page">
        <div className="topbar"><div><div className="page-title">Risk Alerts</div></div></div>
        <div className="loading-spinner">Analyzing risk...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Risk Alerts</div>
          <div className="page-sub">{alerts.length > 0 ? `${alerts.length} active alert${alerts.length !== 1 ? 's' : ''} requiring attention` : 'No active alerts — finances look healthy!'}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Risk Level</div>
          <div className="stat-value" style={{
            fontSize: '20px',
            color: riskLevel === 'High' ? '#a32d2d' : riskLevel === 'Medium' ? '#854f0b' : '#3b6d11'
          }}>{riskLevel}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Risk Score</div>
          <div className="stat-value">{riskScore}<span style={{ fontSize: '14px', color: 'var(--muted)' }}>/100</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expense Ratio</div>
          <div className="stat-value">{(expenseRatio * 100).toFixed(0)}%</div>
          <div className={`stat-change ${expenseRatio > 0.8 ? 'down' : 'up'}`}>
            {expenseRatio > 0.8 ? 'Too high' : expenseRatio > 0.6 ? 'Fair' : 'Healthy'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Savings Ratio</div>
          <div className="stat-value">{(savingsRatio * 100).toFixed(0)}%</div>
          <div className={`stat-change ${savingsRatio < 0.2 ? 'down' : 'up'}`}>
            {savingsRatio >= 0.3 ? 'Great' : savingsRatio >= 0.2 ? 'OK' : 'Low'}
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <div className="card-title">No Risk Alerts!</div>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Your finances are in good shape. Keep up the good habits!
          </p>
        </div>
      ) : (
        alerts.map((alert, i) => {
          const isHigh = highAlerts.includes(alert);
          return (
            <div className="alert-item" key={i}>
              <div className="alert-icon-wrap" style={{ background: isHigh ? '#fcebeb' : '#faeeda' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  {isHigh ? (
                    <>
                      <path d="M9 2 L16 15 H2 Z" stroke="#a32d2d" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                      <path d="M9 7v4M9 12.5v.5" stroke="#a32d2d" strokeWidth="1.5" strokeLinecap="round"/>
                    </>
                  ) : (
                    <>
                      <circle cx="9" cy="9" r="7" stroke="#854f0b" strokeWidth="1.5"/>
                      <path d="M9 5v4.5M9 11.5v.5" stroke="#854f0b" strokeWidth="1.5" strokeLinecap="round"/>
                    </>
                  )}
                </svg>
              </div>
              <div className="alert-body">
                <div className="alert-title">{alert}</div>
                <div className="alert-desc">
                  {alert.toLowerCase().includes('overspend')
                    ? `Your expense ratio is ${(expenseRatio * 100).toFixed(0)}%. Try to keep expenses below 80% of income.`
                    : alert.toLowerCase().includes('low savings')
                    ? `Your savings ratio is ${(savingsRatio * 100).toFixed(0)}%. Aim for at least 20% savings rate.`
                    : monthsToRisk
                    ? `At current spending, you may face financial stress in ${monthsToRisk} months.`
                    : 'Review your spending and savings habits.'}
                </div>
              </div>
              <span className={`risk-badge ${isHigh ? 'risk-high' : 'risk-med'}`}>
                {isHigh ? 'High' : 'Medium'}
              </span>
            </div>
          );
        })
      )}

      {/* Metrics Detail */}
      {monthsToRisk && (
        <div style={{ marginTop: '16px' }}>
          <div className="card">
            <div className="card-title">Risk Prediction</div>
            <div className="insight-card" style={{ padding: '12px' }}>
              <div className="insight-badge" style={{ background: '#fcebeb', color: '#a32d2d' }}>⚠ Warning</div>
              <div className="insight-title">Financial stress predicted in {monthsToRisk} months</div>
              <div className="insight-text">
                Based on your current income-to-expense ratio, your savings buffer could run out. Consider reducing discretionary spending or increasing income sources.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
