import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBehaviorInsights, analyzeBehavior } from '../services/api';

export default function BehaviorInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      fetchInsights();
    }
  }, [user]);

  const fetchInsights = () => {
    getBehaviorInsights(user.user_id).then(r => {
      if (r.data.insights && r.data.insights.length > 0) {
        setInsights(r.data.insights[r.data.insights.length - 1]);
      }
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

  const dayBars = [
    { day: 'Mon', h: 35, color: '#b5d4f4' },
    { day: 'Tue', h: 42, color: '#b5d4f4' },
    { day: 'Wed', h: 28, color: '#b5d4f4' },
    { day: 'Thu', h: 55, color: 'var(--navy3)' },
    { day: 'Fri', h: 88, color: '#e24b4a' },
    { day: 'Sat', h: 95, color: '#e24b4a' },
    { day: 'Sun', h: 68, color: 'var(--navy3)' },
  ];

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
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px', paddingBottom: '8px', marginBottom: '8px' }}>
            {dayBars.map((d) => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ background: d.color, height: `${d.h}px`, width: '100%', borderRadius: '4px 4px 0 0' }}></div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{d.day}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>Fri–Sat account for 42% of total spend</div>
          <div style={{ marginTop: '12px', padding: '10px', background: '#fcebeb', borderRadius: '8px', fontSize: '12px', color: '#a32d2d' }}>
            ⚠ Weekend spending is 2.3× your weekday average. Setting a Sat cap of ₹1,500 could save ₹4,200/month.
          </div>
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
