import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRetirementPlan, createRetirementPlan } from '../services/api';

export default function RetirementPlanning() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ retirement_age: 60, monthly_expense_post_retirement: 30000 });

  useEffect(() => {
    if (user?.user_id) {
      getRetirementPlan(user.user_id)
        .then(r => { console.log('Retirement plan:', r.data); setPlan(r.data); })
        .catch(() => { setShowForm(true); })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createRetirementPlan(user.user_id, {
        retirement_age: parseInt(form.retirement_age),
        monthly_expense_post_retirement: parseFloat(form.monthly_expense_post_retirement),
      });
      console.log('Created retirement plan:', res.data);
      setPlan(res.data);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create retirement plan:', err);
    }
    setCreating(false);
  };

  const formatCurrency = (n) => {
    if (n === null || n === undefined) return '₹0';
    const abs = Math.abs(n);
    if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (abs >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="page">
        <div className="topbar"><div><div className="page-title">Retirement Planning</div></div></div>
        <div className="loading-spinner">Loading retirement plan...</div>
      </div>
    );
  }

  // Compute milestone projections from plan data
  const milestones = [];
  if (plan && plan.monthly_investment >= 0) {
    const currentAge = plan.current_age || 25;
    const retAge = plan.retirement_age || 60;
    const monthly = plan.monthly_investment || 0;
    const rate = plan.expected_return_rate || 10;
    const r = rate / 100 / 12;
    const currentSavings = plan.current_savings || 0;

    // Generate milestones at intervals
    const yearsTotal = retAge - currentAge;
    const interval = yearsTotal <= 20 ? 5 : 10;
    const agePoints = [];
    for (let a = currentAge + interval; a < retAge; a += interval) {
      agePoints.push(a);
    }
    agePoints.push(retAge);

    for (const age of agePoints) {
      const years = age - currentAge;
      const n = years * 12;
      const fv = r > 0 ? monthly * (((1 + r) ** n - 1) / r) : monthly * n;
      milestones.push({ age, corpus: fv + currentSavings });
    }
  }

  const maxCorpus = milestones.length > 0 ? Math.max(...milestones.map(m => m.corpus), 1) : 1;
  const isOnTrack = plan?.status === 'on_track';
  const corpus = plan?.projected_corpus || 0;
  const monthlyIncome = plan?.estimated_monthly_income || 0;
  const monthlyExpense = plan?.monthly_expense_post_retirement || 0;
  const gap = monthlyExpense - monthlyIncome;

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Retirement Planning</div>
          <div className="page-sub">Plan your financial independence</div>
        </div>
        {plan && (
          <button className="btn btn-secondary" onClick={() => setShowForm(!showForm)} style={{ fontSize: '12px', padding: '6px 12px' }}>
            ⚙ {showForm ? 'Cancel' : 'Recalculate'}
          </button>
        )}
      </div>

      {/* Create / Recalculate Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '14px', maxWidth: '480px' }}>
          <div className="card-title">{plan ? 'Recalculate' : 'Create'} Retirement Plan</div>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px', lineHeight: '1.6' }}>
            Enter your desired retirement age and expected monthly expenses after retirement. We'll auto-fetch your current age, savings, and investment capacity from your profile.
          </p>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label>Target Retirement Age</label>
              <input type="number" min="30" max="80" value={form.retirement_age} onChange={e => setForm({ ...form, retirement_age: e.target.value })} required />
            </div>
            <div className="field">
              <label>Expected Monthly Expense After Retirement (₹)</label>
              <input type="number" min="1000" value={form.monthly_expense_post_retirement} onChange={e => setForm({ ...form, monthly_expense_post_retirement: e.target.value })} required />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" type="submit" disabled={creating}>
                {creating ? 'Calculating...' : plan ? '🔄 Recalculate' : '📊 Generate Plan'}
              </button>
              {plan && <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {/* No Plan Yet */}
      {!plan && !showForm && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏖️</div>
          <div className="card-title">Plan your retirement</div>
          <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 24px', fontSize: '13px', lineHeight: '1.7' }}>
            Tell us your target retirement age and expected monthly expenses — we'll calculate your projected corpus, monthly income, and whether you're on track.
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>📊 Create Retirement Plan</button>
        </div>
      )}

      {/* Display Plan */}
      {plan && (
        <>
          {/* Hero Card */}
          <div className="ret-highlight">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className={`risk-badge ${isOnTrack ? 'risk-low' : 'risk-high'}`}
                style={{ fontSize: '11px' }}>
                {isOnTrack ? '✅ On Track' : '⚠ Not On Track'}
              </span>
            </div>
            <div style={{ fontSize: '12px', opacity: '.65', marginBottom: '6px' }}>
              Projected Retirement Corpus at Age {plan.retirement_age}
            </div>
            <div className="ret-big">{formatCurrency(corpus)}</div>
            <div className="ret-sub">
              Based on {formatCurrency(plan.monthly_investment)}/mo investment · {plan.expected_return_rate}% return · {plan.years_to_retirement} years
            </div>
          </div>

          {/* Key Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Current Age</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{plan.current_age}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Retirement Age</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{plan.retirement_age}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Years Left</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{plan.years_to_retirement} yrs</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Monthly SIP</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{formatCurrency(plan.monthly_investment)}</div>
              <div className="stat-change">Auto from savings</div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="mid-grid">
            {/* Corpus Projection Chart */}
            <div className="card">
              <div className="card-title">Corpus Growth Projection</div>
              {milestones.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
                  {plan.monthly_investment === 0
                    ? 'No monthly investment available. Increase savings to see projections.'
                    : 'Unable to compute projections.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {milestones.map((m, i) => {
                    const pct = Math.max(5, (m.corpus / maxCorpus) * 100);
                    const bgs = ['#b5d4f4', 'var(--navy3)', 'var(--navy2)', 'var(--navy)', '#185fa5'];
                    return (
                      <div className="bar-row" key={m.age}>
                        <div className="bar-label">At {m.age}</div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${pct}%`, background: bgs[i % 5] }}></div>
                        </div>
                        <div className="bar-amt">{formatCurrency(m.corpus)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Income Analysis Card */}
            <div className="card">
              <div className="card-title">Post-Retirement Analysis</div>

              {/* Monthly Income vs Expense */}
              <div style={{
                background: isOnTrack ? '#eaf3de' : '#fcebeb',
                borderRadius: '12px', padding: '16px', marginBottom: '14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Est. Monthly Income</div>
                    <div style={{ fontSize: '20px', fontWeight: '500', color: isOnTrack ? '#3b6d11' : '#a32d2d' }}>
                      {formatCurrency(monthlyIncome)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Using 4% withdrawal rule</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Target Expense</div>
                    <div style={{ fontSize: '20px', fontWeight: '500', color: 'var(--navy)' }}>
                      {formatCurrency(monthlyExpense)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>/month post-retirement</div>
                  </div>
                </div>
                {isOnTrack ? (
                  <div style={{ fontSize: '12px', color: '#3b6d11', fontWeight: '500' }}>
                    ✅ Your projected income covers your target expenses by {formatCurrency(monthlyIncome - monthlyExpense)}/month surplus.
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#a32d2d', fontWeight: '500' }}>
                    ⚠ Monthly shortfall of {formatCurrency(gap)}. You'll need to increase your monthly investment.
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="insight-card" style={{ padding: '12px', marginBottom: '10px' }}>
                <div className="insight-badge" style={{ background: '#e6f1fb', color: 'var(--navy2)' }}>Plan Details</div>
                <div className="insight-text" style={{ lineHeight: '2', fontSize: '12px' }}>
                  Current Savings: {formatCurrency(plan.current_savings)}<br/>
                  Monthly Investment: {formatCurrency(plan.monthly_investment)}<br/>
                  Expected Return: {plan.expected_return_rate}% p.a.<br/>
                  Projected Corpus: {formatCurrency(corpus)}<br/>
                  Plan Created: {plan.created_at}
                </div>
              </div>

              {/* Recommendation */}
              {!isOnTrack && (
                <div className="insight-card" style={{ padding: '12px' }}>
                  <div className="insight-badge" style={{ background: '#faeeda', color: '#854f0b' }}>💡 Recommendation</div>
                  <div className="insight-text" style={{ fontSize: '12px', lineHeight: '1.7' }}>
                    {plan.monthly_investment === 0 ? (
                      <>Your current savings rate is zero. To retire at {plan.retirement_age}, you need to start saving and investing regularly. Even a small monthly SIP can grow significantly over {plan.years_to_retirement} years.</>
                    ) : (
                      <>To meet your target of {formatCurrency(monthlyExpense)}/month post-retirement, consider increasing your monthly SIP or exploring higher-return investments. Every additional ₹1,000/month at {plan.expected_return_rate}% can grow to {formatCurrency(1000 * (((1 + plan.expected_return_rate/100/12) ** (plan.years_to_retirement * 12) - 1) / (plan.expected_return_rate/100/12)))} over {plan.years_to_retirement} years.</>
                    )}
                  </div>
                </div>
              )}

              {isOnTrack && (
                <div className="insight-card" style={{ padding: '12px' }}>
                  <div className="insight-badge" style={{ background: '#eaf3de', color: '#3b6d11' }}>🎉 Great Progress</div>
                  <div className="insight-text" style={{ fontSize: '12px', lineHeight: '1.7' }}>
                    You're on track! Continue your monthly SIP of {formatCurrency(plan.monthly_investment)} and you'll have a comfortable retirement. Consider revisiting this plan annually or when your income changes.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
