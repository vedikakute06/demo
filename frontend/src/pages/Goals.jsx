import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGoals, createGoal, payGoal } from '../services/api';

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', goal_type: 'travel', target_amount: '', deadline: '' });
  const [payAmounts, setPayAmounts] = useState({}); // { goalId: '5000' }
  const [payingId, setPayingId] = useState(null); // goalId currently paying
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (user?.user_id) fetchGoals();
  }, [user]);

  const fetchGoals = () => {
    getGoals(user.user_id).then(r => setGoals(r.data)).catch(() => {});
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createGoal(user.user_id, {
        title: form.title,
        goal_type: form.goal_type,
        target_amount: parseFloat(form.target_amount),
        deadline: form.deadline,
      });
      setForm({ title: '', goal_type: 'travel', target_amount: '', deadline: '' });
      setShowForm(false);
      fetchGoals();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handlePay = async (goalId) => {
    const amount = parseFloat(payAmounts[goalId]);
    if (!amount || amount <= 0) return;

    setPayingId(goalId);
    try {
      const res = await payGoal(goalId, amount);
      console.log('Pay response:', res.data);

      // Update goal in local state immediately for instant feedback
      setGoals(prev => prev.map(g => {
        if (g._id === goalId) {
          return {
            ...g,
            current_saved: res.data.new_saved,
            status: res.data.status,
          };
        }
        return g;
      }));

      // Clear the input
      setPayAmounts(prev => ({ ...prev, [goalId]: '' }));

      // Show success toast
      setToast(`₹${amount.toLocaleString('en-IN')} saved towards goal!`);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error('Payment failed:', err);
      setToast('Payment failed. Try again.');
      setTimeout(() => setToast(''), 3000);
    }
    setPayingId(null);
  };

  const displayGoals = goals;
  const iconMap = { travel: '✈️', gadget: '📱', emergency: '🏠', vehicle: '🚗', investment: '📈', other: '📦' };
  const bgMap = { travel: '#e6f1fb', gadget: '#eaf3de', emergency: '#faeeda', vehicle: '#e6f1fb', investment: '#eaf3de', other: '#f0f4fa' };

  return (
    <div className="page">
      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      <div className="topbar">
        <div>
          <div className="page-title">Goals</div>
          <div className="page-sub">Track your financial targets</div>
        </div>
        <button className="btn btn-primary" style={{ fontSize: '12px', padding: '7px 14px' }} onClick={() => setShowForm(!showForm)}>
          + Add Goal
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '14px', maxWidth: '480px' }}>
          <div className="card-title">Create New Goal</div>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label>Goal Title</label>
              <input type="text" placeholder="e.g. Goa Trip" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="field">
              <label>Type</label>
              <select value={form.goal_type} onChange={(e) => setForm({ ...form, goal_type: e.target.value })}>
                <option value="travel">✈️ Travel</option>
                <option value="gadget">📱 Gadget</option>
                <option value="vehicle">🚗 Vehicle</option>
                <option value="emergency">🚨 Emergency</option>
                <option value="investment">📈 Investment</option>
                <option value="other">📦 Other</option>
              </select>
            </div>
            <div className="field">
              <label>Target Amount (₹)</label>
              <input type="number" placeholder="e.g. 100000" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required />
            </div>
            <div className="field">
              <label>Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" type="submit">Create Goal</button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {displayGoals.map((g) => {
          const saved = g.current_saved || 0;
          const target = g.target_amount || 1;
          const progress = Math.min(Math.round((saved / target) * 100), 100);
          const remaining = Math.max(target - saved, 0);
          const isBehind = g.status === 'behind' || (g.status !== 'completed' && progress < 40);
          const isCompleted = g.status === 'completed' || progress >= 100;

          return (
            <div className="card" key={g._id} style={isCompleted ? { borderColor: '#3b6d11', borderWidth: '1px' } : {}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div className="goal-icon" style={{ background: bgMap[g.goal_type] || '#e6f1fb', width: '40px', height: '40px', fontSize: '18px' }}>
                  {iconMap[g.goal_type] || '📦'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--navy)' }}>{g.title || g.goal_type}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Target: {g.deadline}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className={`risk-badge ${isCompleted ? 'risk-low' : isBehind ? 'risk-med' : 'risk-low'}`}>
                    {isCompleted ? '✅ Done' : isBehind ? 'Behind' : 'On track'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Saved</span>
                <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--navy)' }}>
                  ₹{saved.toLocaleString('en-IN')} / ₹{target.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="prog-bar" style={{ height: '8px', marginBottom: '8px' }}>
                <div className="prog-fill" style={{
                  width: `${progress}%`,
                  background: isCompleted ? '#3b6d11' : isBehind ? '#ef9f27' : 'var(--navy2)',
                  transition: 'width 0.4s ease'
                }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCompleted ? 0 : '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {isCompleted ? '🎉 Goal achieved!' : `₹${remaining.toLocaleString('en-IN')} more needed`}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--navy2)' }}>{progress}%</span>
              </div>

              {/* Pay towards goal */}
              {!isCompleted && (
                <div style={{
                  display: 'flex', gap: '6px', alignItems: 'center',
                  paddingTop: '12px', borderTop: '.5px solid #e6f1fb'
                }}>
                  <input
                    type="number"
                    placeholder="₹ Amount"
                    value={payAmounts[g._id] || ''}
                    onChange={(e) => setPayAmounts(prev => ({ ...prev, [g._id]: e.target.value }))}
                    style={{
                      flex: 1, border: '.5px solid var(--border)', borderRadius: '8px',
                      padding: '7px 10px', fontSize: '12px', color: 'var(--navy)',
                      background: '#fff', fontFamily: 'var(--font)', outline: 'none',
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handlePay(g._id)}
                    disabled={payingId === g._id || !payAmounts[g._id]}
                    style={{ fontSize: '11px', padding: '7px 14px', whiteSpace: 'nowrap' }}
                  >
                    {payingId === g._id ? '...' : '💰 Pay'}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Goal Card */}
        <div
          className="card"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', cursor: 'pointer' }}
          onClick={() => setShowForm(true)}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e6f1fb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', fontSize: '22px', color: 'var(--navy2)' }}>+</div>
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--navy2)' }}>Add New Goal</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Track what matters to you</div>
        </div>
      </div>
    </div>
  );
}
