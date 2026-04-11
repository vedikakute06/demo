import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGoals, getFinancialHealth, addTransaction, getTransactions, getUser, analyzeRisk, getAIInsights, uploadTransactions } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [health, setHealth] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [riskData, setRiskData] = useState(null);

  // AI Insights States
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Quick Add Modal States
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ amount: '', category: '🍔 Food & Dining', note: '' });

  const categories = [
    '🍔 Food & Dining',
    '🏠 Rent & Housing',
    '🚌 Transport',
    '🛒 Shopping',
    '💊 Health & Medical',
    '🎬 Entertainment',
    '📱 Subscriptions',
    '📚 Education',
    '✈️ Travel',
    '💰 Other',
  ];

  const handleQuickAdd = async () => {
    if (!quickForm.amount) return;
    try {
      const now = new Date();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      await addTransaction({
        user_id: user.user_id,
        amount: parseFloat(quickForm.amount),
        category: quickForm.category.replace(/^[^\s]+\s/, ''), // strip emoji
        type: 'expense',
        note: quickForm.note,
        payment_mode: 'UPI',
        is_weekend: isWeekend,
        hour: now.getHours(),
        date: now.toISOString().split('T')[0],
      });
      setShowQuickAdd(false);
      setQuickForm({ amount: '', category: '🍔 Food & Dining', note: '' });
      // Reload stats
      getTransactions(user.user_id).then(r => setTransactions(r.data)).catch(() => {});
    } catch (err) {
      console.error('Failed to add expense:', err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      await uploadTransactions(user.user_id, file);
      // Reload stats
      getTransactions(user.user_id).then(r => setTransactions(r.data || [])).catch(() => {});
      alert("Transactions uploaded successfully!");
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Failed to upload transactions. Make sure it is a valid CSV.');
    } finally {
      // Clear input so same file can be uploaded again if needed
      event.target.value = null;
    }
  };


  const handleGenerateInsights = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await getAIInsights(user.user_id);
      console.log('AI Insights response:', res.data);
      setAiInsights(res.data.insights);
    } catch (err) {
      console.error('Failed to generate AI insights:', err);
      setAiError('Failed to generate insights. Please try again.');
    }
    setAiLoading(false);
  };

  const firstName = user?.name?.split(' ')[0] || 'User';
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  useEffect(() => {
    if (user?.user_id) {
      getUser(user.user_id).then(r => { console.log('User profile:', r.data); setProfile(r.data); }).catch(() => {});
      getGoals(user.user_id).then(r => { console.log('Goals:', r.data); setGoals(r.data); }).catch(() => {});
      getFinancialHealth(user.user_id).then(r => { console.log('Health:', r.data); setHealth(r.data); }).catch(() => {});
      getTransactions(user.user_id).then(r => { console.log('Transactions:', r.data); setTransactions(r.data || []); }).catch(() => {});
      analyzeRisk(user.user_id).then(r => { console.log('Risk:', r.data); setRiskData(r.data); }).catch(() => {});
    }
  }, [user]);

  const healthScore = health?.score ?? 0;
  const dbIncome = profile?.monthly_income || 0;
  const txIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const income = dbIncome > 0 ? dbIncome : txIncome;
  
  const spent = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const saved = income - spent;
  const savedRate = income > 0 ? ((saved / income) * 100).toFixed(1) : 0;

  const categoryTotals = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  // Build dynamic alert text from risk data
  const alertCount = riskData?.alerts?.length || 0;
  const alertText = riskData?.alerts?.length > 0
    ? riskData.alerts.join(' · ')
    : 'No active alerts — your finances look healthy!';

  return (
    <div className="page">
      {/* TOPBAR */}
      <div className="topbar">
        <div>
          <div className="page-title">Good morning, {firstName} 👋</div>
          <div className="page-sub">Financial overview</div>
        </div>
        <div className="topbar-right">
          <div className="avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>{initials}</div>
        </div>
      </div>

      {/* ALERT BAR — Dynamic from Risk API */}
      {alertCount > 0 && (
        <div className="alert-bar">
          <div className="alert-dot"></div>
          <strong>{alertCount} alert{alertCount !== 1 ? 's' : ''}:</strong>&nbsp;{alertText}
        </div>
      )}

      {/* STATS GRID */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Monthly Income</div>
          <div className="stat-value">₹{income.toLocaleString('en-IN')}</div>
          <div className="stat-change up">From {dbIncome > 0 ? 'profile' : 'transactions'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">₹{spent.toLocaleString('en-IN')}</div>
          <div className="stat-change down">Monthly outward</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Saved</div>
          <div className="stat-value">₹{saved.toLocaleString('en-IN')}</div>
          <div className="stat-change up">{savedRate}% rate</div>
        </div>
        <div 
          className="stat-card" 
          onClick={() => document.getElementById('csv-upload').click()} 
          style={{ cursor: 'pointer', background: 'var(--navy2)', color: '#fff' }}
          title="Click to Upload CSV"
        >
          <div className="stat-label" style={{ color: '#fff' }}>Bulk Add Records</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <span style={{ fontSize: '24px' }}>⬆️</span> Upload CSV
          </div>
          <div className="stat-change" style={{ color: '#fff' }}>Click here to upload your file</div>
        </div>
      </div>

      {/* MID GRID */}
      <div className="mid-grid">
        {/* Budget Overview */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Budget Actuals
          </div>
          {Object.entries(categoryTotals).length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '10px 0' }}>No expenses recorded this month yet.</div>
          ) : (
            Object.entries(categoryTotals).map(([cat, amt], i) => {
              const bgs = ['var(--navy2)', 'var(--navy3)', '#b5d4f4', '#e24b4a', '#ef9f27'];
              return (
                <div className="bar-row" key={cat}>
                  <div className="bar-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat}</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, (amt / (spent || 1)) * 100)}%`, background: bgs[i % 5] }}></div></div>
                  <div className="bar-amt">₹{amt.toLocaleString('en-IN')}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Goals Progress */}
        <div className="card">
          <div className="card-title">Goals Progress</div>
          {goals.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>No active goals. Add one to track your savings!</div>
          ) : (
            goals.slice(0, 3).map((g, i) => {
            const progress = Math.round(((g.current_saved || 0) / (g.target_amount || 1)) * 100);
            const icons = ['✈️', '📱', '🏠'];
            const bgs = ['#e6f1fb', '#eaf3de', '#faeeda'];
            const colors = ['var(--navy2)', '#639922', '#ef9f27'];
            return (
              <div className="goal-item" key={g._id}>
                <div className="goal-icon" style={{ background: bgs[i % 3] }}>{icons[i % 3]}</div>
                <div className="goal-info">
                  <div className="goal-name">{g.title || g.goal_type}</div>
                  <div className="goal-sub">₹{(g.current_saved || 0).toLocaleString('en-IN')} / ₹{(g.target_amount || 0).toLocaleString('en-IN')} · {g.deadline}</div>
                  <div className="prog-bar"><div className="prog-fill" style={{ width: `${progress}%`, background: colors[i % 3] }}></div></div>
                </div>
                <div className="goal-prog" style={{ color: colors[i % 3] }}>{progress}%</div>
              </div>
            );
            })
          )}
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--navy2)', cursor: 'pointer' }} onClick={() => navigate('/goals')}>
              + Add new goal →
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className="bottom-grid">
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-title">Recent Transactions</div>
          {transactions.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>No transactions recorded yet.</div>
          ) : (
            transactions.slice(0, 5).map((t) => (
              <div className="tx-row" key={t._id}>
                <div className="tx-dot" style={{ background: t.type === 'income' ? '#3b6d11' : 'var(--navy3)' }}></div>
                <div className="tx-info">
                  <div className="tx-name">{t.note || t.category}</div>
                  <div className="tx-cat">{t.category} · {t.date}</div>
                </div>
                <div className="tx-amt" style={{ color: t.type === 'income' ? '#3b6d11' : '#a32d2d' }}>
                  {t.type === 'income' ? '+' : '−'}₹{t.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Insights — Generate Button */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            AI Insights
            {aiInsights && (
              <button
                className="btn btn-secondary"
                onClick={handleGenerateInsights}
                disabled={aiLoading}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                ↻ Refresh
              </button>
            )}
          </div>

          {!aiInsights && !aiLoading && !aiError && (
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>✨</div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--navy)', marginBottom: '6px' }}>
                Get personalized financial insights
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px', lineHeight: '1.6' }}>
                Our AI analyzes your transactions, goals, and spending patterns to give you actionable advice.
              </div>
              <button className="btn btn-primary" onClick={handleGenerateInsights} style={{ width: '100%', justifyContent: 'center' }}>
                ✨ Generate AI Insights
              </button>
            </div>
          )}

          {aiLoading && (
            <div style={{ textAlign: 'center', padding: '40px 10px' }}>
              <div className="ai-loading-dots">
                <span></span><span></span><span></span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '12px' }}>Analyzing your finances...</div>
            </div>
          )}

          {aiError && (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{ fontSize: '12px', color: '#a32d2d', marginBottom: '12px' }}>{aiError}</div>
              <button className="btn btn-primary" onClick={handleGenerateInsights} style={{ fontSize: '12px' }}>
                Try Again
              </button>
            </div>
          )}

          {aiInsights && !aiLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {aiInsights.map((insight, i) => {
                const badges = [
                  { bg: '#e6f1fb', color: 'var(--navy2)', label: 'Insight' },
                  { bg: '#eaf3de', color: '#3b6d11', label: 'Tip' },
                  { bg: '#faeeda', color: '#854f0b', label: 'Alert' },
                  { bg: '#fcebeb', color: '#a32d2d', label: 'Action' },
                ];
                const badge = badges[i % badges.length];
                return (
                  <div className="insight-card" key={i} style={{ padding: '10px 12px', marginBottom: 0 }}>
                    <div className="insight-badge" style={{ background: badge.bg, color: badge.color }}>{badge.label}</div>
                    <div className="insight-text">{insight}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING ACTION BUTTON FOR ADD EXPENSE */}
      <button 
        className="fab" 
        onClick={() => setShowQuickAdd(!showQuickAdd)} 
        style={{ left: '224px', background: 'var(--navy2)', color: '#fff', fontSize: '28px', fontWeight: '300' }}
        title="Add Expense"
      >
        +
      </button>

      {/* CSV UPLOAD HIDDEN INPUT */}
      <input
        type="file"
        accept=".csv"
        id="csv-upload"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* QUICK ADD EXPENSE MODAL */}
      {showQuickAdd && (
        <div style={{ position: 'fixed', left: '230px', bottom: '84px', background: '#fff', borderRadius: '16px', padding: '24px', width: '320px', boxShadow: '0 8px 32px rgba(10,42,110,.18)', zIndex: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--navy)', margin: 0, fontWeight: 500 }}>Quick Add Expense</h3>
            <button onClick={() => setShowQuickAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--muted)', lineHeight: '1' }}>×</button>
          </div>
          
          <div className="field">
            <label>Amount (₹)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              style={{ fontSize: '22px', padding: '10px 12px' }} 
              value={quickForm.amount} 
              onChange={e => setQuickForm({...quickForm, amount: e.target.value})} 
            />
          </div>

          <div className="field">
            <label>Category</label>
            <select 
              style={{ padding: '10px 12px' }} 
              value={quickForm.category} 
              onChange={e => setQuickForm({...quickForm, category: e.target.value})}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Note</label>
            <input 
              type="text" 
              placeholder="What was this for?" 
              style={{ padding: '10px 12px' }} 
              value={quickForm.note} 
              onChange={e => setQuickForm({...quickForm, note: e.target.value})} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={handleQuickAdd} style={{ flex: 1, justifyContent: 'center' }}>Save</button>
            <button className="btn btn-secondary" onClick={() => navigate('/add-expense')} style={{ flex: 1, justifyContent: 'center' }}>More options</button>
          </div>
        </div>
      )}
    </div>
  );
}
