import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { recommendInvestment, getInvestment } from '../services/api';

export default function InvestmentRecommendations() {
  const { user } = useAuth();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      fetchRecommendation();
    }
  }, [user]);

  const fetchRecommendation = () => {
    getInvestment(user.user_id)
      .then(r => setRecommendation(r.data))
      .catch(() => {});
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await recommendInvestment(user.user_id);
      fetchRecommendation();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const plan = recommendation?.recommended_plan || [];

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Investment Recommendations</div>
          <div className="page-sub">AI-powered growth strategy based on your risk profile</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Calculating...' : '🚀 Generate Recommendation'}
          </button>
        </div>
      </div>

      {!recommendation ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>💰</div>
          <div className="card-title">Ready to grow your wealth?</div>
          <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 24px' }}>
            Our AI analyzes your income, expenses, and risk profile to suggest the best investment split for your monthly savings.
          </p>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Analyzing...' : 'Get My Investment Plan'}
          </button>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Investable Amount</div>
              <div className="stat-value">₹{recommendation.monthly_investable_amount?.toLocaleString('en-IN')}</div>
              <div className="stat-change">Monthly savings</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Strategy</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{recommendation.strategy}</div>
              <div className="stat-change">Personalized for you</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Status</div>
              <div className={`stat-value ${recommendation.is_safe_to_invest ? 'text-success' : 'text-danger'}`} style={{ fontSize: '18px' }}>
                {recommendation.is_safe_to_invest ? 'Safe to Invest' : 'Caution'}
              </div>
              <div className="stat-change">Risk assessment</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Last Updated</div>
              <div className="stat-value" style={{ fontSize: '16px' }}>{new Date(recommendation.created_at).toLocaleDateString()}</div>
              <div className="stat-change">Live data</div>
            </div>
          </div>

          <div className="mid-grid">
            <div className="card">
              <div className="card-title">Recommended Allocation</div>
              <div style={{ marginBottom: '20px' }}>
                {plan.map((item, i) => {
                  const colors = ['var(--navy2)', 'var(--navy3)', '#b5d4f4'];
                  return (
                    <div className="bar-row" key={i}>
                      <div className="bar-label">{item.type}</div>
                      <div className="bar-track">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${item.allocation_percentage}%`, 
                            background: colors[i % colors.length] 
                          }}
                        ></div>
                      </div>
                      <div className="bar-amt">₹{item.amount?.toLocaleString('en-IN')} ({item.allocation_percentage}%)</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '12px', background: recommendation.is_safe_to_invest ? '#eaf3de' : '#fcebeb', borderRadius: '8px', fontSize: '12px', color: recommendation.is_safe_to_invest ? '#3b6d11' : '#a32d2d' }}>
                {recommendation.safety_message}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Strategy Insights</div>
              <div className="insight-card" style={{ padding: '12px', marginBottom: '10px' }}>
                <div className="insight-badge" style={{ background: '#e6f1fb', color: 'var(--navy2)' }}>Balanced Approach</div>
                <div className="insight-title">Risk Mitigation</div>
                <div className="insight-text">Based on your "medium" risk profile, we suggest splitting funds between high-yield SIPs and stable FDs to protect your principal while chasing growth.</div>
              </div>
              <div className="insight-card" style={{ padding: '12px' }}>
                <div className="insight-badge" style={{ background: '#eaf3de', color: '#3b6d11' }}>Efficiency</div>
                <div className="insight-title">Automatic Growth</div>
                <div className="insight-text">Setting up auto-debits for your SIPs on the 5th of every month ensures you invest before spending on lifestyle.</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
