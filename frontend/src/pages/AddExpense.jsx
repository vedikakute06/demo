import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addTransaction } from '../services/api';

export default function AddExpense() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    category: 'Food & Dining',
    note: '',
    date: new Date().toISOString().split('T')[0],
    payment_mode: 'UPI',
    notes: '',
  });

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

  const paymentMethods = ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    setLoading(true);
    try {
      const now = new Date();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      await addTransaction({
        user_id: user.user_id,
        amount: parseFloat(form.amount),
        category: form.category.replace(/^[^\s]+\s/, ''), // strip emoji
        type: 'expense',
        note: form.note,
        payment_mode: form.payment_mode,
        is_weekend: isWeekend,
        hour: now.getHours(),
        date: form.date,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to add expense:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickAdd = (cat) => {
    setForm({ ...form, category: cat });
  };

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Add Expense</div>
          <div className="page-sub">Log a new transaction</div>
        </div>
      </div>
      <div style={{ maxWidth: '480px' }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Amount (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                style={{ fontSize: '24px', fontWeight: '500' }}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Description</label>
              <input
                type="text"
                placeholder="e.g. Swiggy order"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Payment Method</label>
              <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Notes (optional)</label>
              <textarea
                rows="2"
                placeholder="Any additional notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              ></textarea>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Expense'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/dashboard')}>Cancel</button>
            </div>
          </form>
        </div>
        <div style={{ marginTop: '16px' }}>
          <div className="card-title" style={{ marginBottom: '10px' }}>Quick add categories</div>
          <div className="chip-row">
            {['🍕 Food', '🚕 Cab', '☕ Coffee', '🛒 Grocery', '💊 Medicine'].map((c) => (
              <div key={c} className="chip" onClick={() => quickAdd(c)}>{c} ₹</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
