import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGoals, createGoal } from '../services/api';

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', goal_type: 'travel', target_amount: '', deadline: '' });

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

  const displayGoals = goals;
  const iconMap = { travel: '✈️', gadget: '📱', emergency: '🏠', vehicle: '🚗', investment: '📈', other: '📦' };
  const bgMap = { travel: '#e6f1fb', gadget: '#eaf3de', emergency: '#faeeda', vehicle: '#e6f1fb', investment: '#eaf3de', other: '#f0f4fa' };

  return (
    <div className="page">
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
          const remaining = target - saved;
          const isBehind = g.status === 'behind' || progress < 40;

          return (
            <div className="card" key={g._id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div className="goal-icon" style={{ background: bgMap[g.goal_type] || '#e6f1fb', width: '40px', height: '40px', fontSize: '18px' }}>
                  {iconMap[g.goal_type] || '📦'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--navy)' }}>{g.title || g.goal_type}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Target: {g.deadline}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className={`risk-badge ${isBehind ? 'risk-med' : 'risk-low'}`}>
                    {isBehind ? 'Behind' : 'On track'}
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
                <div className="prog-fill" style={{ width: `${progress}%`, background: isBehind ? '#ef9f27' : 'var(--navy2)' }}></div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                ₹{remaining.toLocaleString('en-IN')} more needed
              </div>
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
