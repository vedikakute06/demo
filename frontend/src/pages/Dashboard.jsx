import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGoals, getFinancialHealth, addTransaction, getTransactions, getUser } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [health, setHealth] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(null);

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

  const firstName = user?.name?.split(' ')[0] || 'User';
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  useEffect(() => {
    if (user?.user_id) {
      getUser(user.user_id).then(r => setProfile(r.data)).catch(() => {});
      getGoals(user.user_id).then(r => setGoals(r.data)).catch(() => {});
      getFinancialHealth(user.user_id).then(r => setHealth(r.data)).catch(() => {});
      getTransactions(user.user_id).then(r => setTransactions(r.data || [])).catch(() => {});
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

  return (
    <div className="page">
      {/* TOPBAR */}
      <div className="topbar">
        <div>
          <div className="page-title">Good morning, {firstName} 👋</div>
          <div className="page-sub">Financial overview · June 2025</div>
        </div>
        <div className="topbar-right">
          <select className="month-select">
            <option>June 2025</option>
            <option>May 2025</option>
          </select>
          <div className="avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>{initials}</div>
        </div>
      </div>

      {/* ALERT BAR */}
      <div className="alert-bar">
        <div className="alert-dot"></div>
        <strong>3 alerts:</strong>&nbsp;Food budget 19% over · Unusual Swiggy spend · SIP due June 30
      </div>

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
        <div className="stat-card">
          <div className="stat-label">Health Score</div>
          <div className="stat-value">
            {healthScore}<span style={{ fontSize: '14px', color: 'var(--muted)' }}>/100</span>
          </div>
          <div className="stat-change up">↑ +3 this month</div>
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

        {/* AI Quick Insights */}
        <div className="card">
          <div className="card-title">AI Quick Insights</div>
          <div className="chip-row">
            <div className="chip">Can I afford a trip?</div>
            <div className="chip">Where to save more?</div>
            <div className="chip">Best SIP for me?</div>
          </div>
          <div className="chat-bubble-me">Where am I overspending this month?</div>
          <div className="chat-bubble-ai">
            You're 19% over budget on <strong>Food</strong> (₹9,500 vs ₹8,000). Weekend dining is the main trigger — 6 orders above ₹400 on Fri–Sun. Cutting to 2 weekend orders saves ~₹1,800.
          </div>
          <div className="chat-bubble-me">Should I still invest in SIP?</div>
          <div className="chat-bubble-ai">
            Yes! After goals allocation (₹8,000), ₹6,000/mo in a Nifty 50 index SIP suits your medium risk profile. Want me to set a reminder?
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON FOR ADD EXPENSE */}
      <button 
        className="fab" 
        onClick={() => setShowQuickAdd(!showQuickAdd)} 
        style={{ left: '224px', background: 'var(--navy2)', color: '#fff', fontSize: '28px', fontWeight: '300' }}
      >
        +
      </button>

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
