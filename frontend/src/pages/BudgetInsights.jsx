import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBudget, getTransactions } from '../services/api';

export default function BudgetInsights() {
  const { user } = useAuth();
  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (user?.user_id) {
      getBudget(user.user_id, '2025-06').then(r => setBudget(r.data)).catch(() => {});
      getTransactions(user.user_id).then(r => setTransactions(r.data || [])).catch(() => {});
    }
  }, [user]);

  const totalBudget = budget?.total_budget || 0;
  const spent = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const remaining = totalBudget - spent;
  const usedRatio = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
  const remainingRatio = 100 - usedRatio;

  const categoryTotals = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Budget Insights</div>
          <div className="page-sub">June 2025 · ₹{spent.toLocaleString('en-IN')} of ₹{totalBudget.toLocaleString('en-IN')} used</div>
        </div>
        <div className="topbar-right">
          <select className="month-select"><option>June 2025</option></select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Budget</div><div className="stat-value">₹{totalBudget.toLocaleString('en-IN')}</div></div>
        <div className="stat-card"><div className="stat-label">Spent</div><div className="stat-value">₹{spent.toLocaleString('en-IN')}</div><div className="stat-change down">{usedRatio.toFixed(1)}% used</div></div>
        <div className="stat-card"><div className="stat-label">Remaining</div><div className="stat-value">₹{Math.max(0, remaining).toLocaleString('en-IN')}</div><div className="stat-change up">{remainingRatio.toFixed(1)}% left</div></div>
        <div className="stat-card"><div className="stat-label">Overspent</div><div className="stat-value">{Object.keys(categoryTotals).filter(cat => categoryTotals[cat] > (budget?.category_limits?.[cat] || 0)).length} cat</div><div className="stat-change down">tracked</div></div>
      </div>

      <div className="mid-grid">
        <div className="card">
          <div className="card-title">Category Breakdown</div>
          {Object.entries(categoryTotals).length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '10px 0' }}>No budget activity yet.</div>
          ) : (
            Object.entries(categoryTotals).map(([cat, amt], i) => {
              const bgs = ['var(--navy2)', '#e24b4a', 'var(--navy3)', '#b5d4f4', '#e6f1fb'];
              const limit = budget?.category_limits?.[cat] || 0;
              const isOver = limit > 0 && amt > limit;
              
              return (
                <div className="bar-row" key={cat}>
                  <div className="bar-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat}</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, (amt / (limit || amt || 1)) * 100)}%`, background: isOver ? '#e24b4a' : bgs[i % 5] }}></div></div>
                  <div className="bar-amt" style={isOver ? { color: '#a32d2d' } : {}}>₹{amt.toLocaleString('en-IN')} {isOver && '⚠'}</div>
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <div className="card-title">AI Budget Tips</div>
          <div className="insight-card" style={{ marginBottom: '10px', padding: '12px' }}>
            <div className="insight-badge" style={{ background: '#fcebeb', color: '#a32d2d' }}>Over budget</div>
            <div className="insight-title">Food spending 19% over</div>
            <div className="insight-text">You've spent ₹9,500 against a ₹8,000 budget. Most overspend happened over 6 weekend orders. Try cooking at home 2 extra days.</div>
          </div>
          <div className="insight-card" style={{ padding: '12px' }}>
            <div className="insight-badge" style={{ background: '#eaf3de', color: '#3b6d11' }}>Opportunity</div>
            <div className="insight-title">Subscription review due</div>
            <div className="insight-text">You have 4 active subscriptions. Netflix + Amazon Prime overlap — consider pausing one to save ₹299/month.</div>
          </div>
          <div style={{ marginTop: '12px', padding: '10px', background: '#e6f1fb', borderRadius: '8px', fontSize: '12px', color: '#0c447c' }}>
            💡 Saving ₹2,500/month more will help you hit your Goa goal by June 30.
          </div>
        </div>
      </div>
    </div>
  );
}
