import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBehaviorInsights, analyzeBehavior, getTransactions } from '../services/api';

export default function BehaviorInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dayBars, setDayBars] = useState([]);

  useEffect(() => {
    if (user?.user_id) {
      fetchInsights();
      fetchDaySpending();
    }
  }, [user]);

  const fetchInsights = () => {
    getBehaviorInsights(user.user_id).then(r => {
      console.log('Behavior insights:', r.data);
      if (r.data.insights && r.data.insights.length > 0) {
        setInsights(r.data.insights[r.data.insights.length - 1]);
      }
    }).catch(() => {});
  };

  const fetchDaySpending = () => {
    getTransactions(user.user_id).then(r => {
      console.log('Transactions for day chart:', r.data);
      const txns = (r.data || []).filter(t => t.type === 'expense');

      // Compute spending per day of week
      const dayTotals = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (const t of txns) {
        if (t.date) {
          const d = new Date(t.date);
          const dayIndex = d.getDay();
          dayTotals[dayIndex] = (dayTotals[dayIndex] || 0) + t.amount;
        } else if (t.is_weekend !== undefined) {
          // Fallback: spread weekend transactions to Sat/Sun
          if (t.is_weekend) {
            dayTotals[6] += t.amount / 2;
            dayTotals[0] += t.amount / 2;
          } else {
            // Spread across weekdays
            const weekday = t.hour ? (t.hour % 5) + 1 : 1;
            dayTotals[weekday] += t.amount;
          }
        }
      }

      const maxAmt = Math.max(...Object.values(dayTotals), 1);

      const bars = [1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
        const amt = dayTotals[dayIndex];
        const h = Math.max(5, (amt / maxAmt) * 95);
        const isWeekend = dayIndex === 0 || dayIndex === 6;
        return {
          day: dayNames[dayIndex],
          h,
          amt,
          color: isWeekend && amt > maxAmt * 0.6 ? '#e24b4a' : isWeekend ? 'var(--navy3)' : '#b5d4f4',
        };
      });

      setDayBars(bars);
    }).catch(() => {});
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await analyzeBehavior(user.user_id);
      fetchInsights();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Compute weekend spending stats from dayBars
  const totalSpend = dayBars.reduce((sum, d) => sum + (d.amt || 0), 0);
  const weekendSpend = dayBars.filter(d => d.day === 'Sat' || d.day === 'Sun').reduce((sum, d) => sum + (d.amt || 0), 0);
  const weekendPct = totalSpend > 0 ? ((weekendSpend / totalSpend) * 100).toFixed(0) : 0;
  const weekdayAvg = dayBars.filter(d => d.day !== 'Sat' && d.day !== 'Sun').reduce((sum, d) => sum + (d.amt || 0), 0) / 5;
  const weekendAvg = weekendSpend / 2;
  const weekendMultiplier = weekdayAvg > 0 ? (weekendAvg / weekdayAvg).toFixed(1) : 0;

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Behavior Insights</div>
          <div className="page-sub">Spending patterns & habits analysis</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Analyzing...' : '✨ Generate AI Insights'}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Behavior Profile</div><div className="stat-value" style={{ fontSize: '20px' }}>{insights?.cluster || 'Analyzing...'}</div><div className="stat-change">Based on ML</div></div>
        <div className="stat-card"><div className="stat-label">Model Confidence</div><div className="stat-value">{insights?.confidence ? (insights.confidence * 100).toFixed(0) : 0}%</div><div className="stat-change">Stochastic rating</div></div>
        <div className="stat-card"><div className="stat-label">Last Updated</div><div className="stat-value" style={{ fontSize: '14px' }}>{insights?.updated_at ? new Date(insights.updated_at).toLocaleDateString() : 'N/A'}</div><div className="stat-change">Live data</div></div>
        <div className="stat-card"><div className="stat-label">Status</div><div className="stat-value" style={{ fontSize: '16px' }}>{insights ? 'Active' : 'Pending'}</div><div className="stat-change">ML Pipeline</div></div>
      </div>

      <div className="mid-grid">
        <div className="card">
          <div className="card-title">Spending by Day of Week</div>
          {dayBars.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>
              No transaction data to analyze yet.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px', paddingBottom: '8px', marginBottom: '8px' }}>
                {dayBars.map((d) => (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ background: d.color, height: `${d.h}px`, width: '100%', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{d.day}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>
                {weekendPct > 0 ? `Sat–Sun account for ${weekendPct}% of total spend` : 'Spending distributed across the week'}
              </div>
              {weekendMultiplier > 1.5 && (
                <div style={{ marginTop: '12px', padding: '10px', background: '#fcebeb', borderRadius: '8px', fontSize: '12px', color: '#a32d2d' }}>
                  ⚠ Weekend spending is {weekendMultiplier}× your weekday average. Consider setting a weekend spending cap.
                </div>
              )}
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title">AI Behavioral Insights</div>
          {!insights ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              Click Generate to analyze your spending habits with AI.
            </div>
          ) : (
            insights.insights.map((text, i) => (
              <div className="insight-card" key={i} style={{ padding: '12px', marginBottom: i < insights.insights.length - 1 ? '10px' : 0 }}>
                <div className="insight-badge" style={{ background: '#eaf3de', color: '#3b6d11' }}>Insight {i+1}</div>
                <div className="insight-text">{text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
