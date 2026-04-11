import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBudget, getTransactions, createBudget, getUser } from '../services/api';

// ── Quiz Questions ──
const quizSteps = [
  {
    id: 'meals',
    question: 'How do you typically eat?',
    options: [
      { label: '🏠 Mostly home-cooked', value: 'home', icon: '🏠' },
      { label: '🍱 Mix of home & outside', value: 'mixed', icon: '🍱' },
      { label: '🍔 Mostly eating out / ordering in', value: 'outside', icon: '🍔' },
    ],
  },
  {
    id: 'transport',
    question: 'How do you commute daily?',
    options: [
      { label: '🚶 Walk / cycle', value: 'walk', icon: '🚶' },
      { label: '🚌 Public transport', value: 'public', icon: '🚌' },
      { label: '🚗 Own vehicle / cab', value: 'vehicle', icon: '🚗' },
    ],
  },
  {
    id: 'housing',
    question: 'Your housing situation?',
    options: [
      { label: '👨‍👩‍👧 Living with family', value: 'family', icon: '👨‍👩‍👧' },
      { label: '🏘️ Sharing / PG', value: 'shared', icon: '🏘️' },
      { label: '🏠 Renting alone / EMI', value: 'alone', icon: '🏠' },
    ],
  },
  {
    id: 'lifestyle',
    question: 'Your entertainment & social life?',
    options: [
      { label: '📖 Minimal — mostly at home', value: 'minimal', icon: '📖' },
      { label: '🎬 Moderate — movies, outings', value: 'moderate', icon: '🎬' },
      { label: '🎉 Active — frequent dining, events', value: 'active', icon: '🎉' },
    ],
  },
  {
    id: 'shopping',
    question: 'How often do you shop (non-essentials)?',
    options: [
      { label: '🛑 Rarely — only essentials', value: 'rare', icon: '🛑' },
      { label: '🛍️ Sometimes — monthly shopping', value: 'sometimes', icon: '🛍️' },
      { label: '🛒 Frequently — weekly orders', value: 'frequent', icon: '🛒' },
    ],
  },
  {
    id: 'health',
    question: 'Health & wellness spending?',
    options: [
      { label: '💪 Minimal — no gym or supplements', value: 'none', icon: '💪' },
      { label: '🏃 Moderate — gym or basic checkups', value: 'moderate', icon: '🏃' },
      { label: '🏥 High — regular medical, wellness', value: 'high', icon: '🏥' },
    ],
  },
  {
    id: 'subscriptions',
    question: 'Digital subscriptions?',
    options: [
      { label: '📵 None or free plans', value: 'none', icon: '📵' },
      { label: '📱 1-2 (Netflix, Spotify)', value: 'few', icon: '📱' },
      { label: '💳 3+ (streaming, cloud, apps)', value: 'many', icon: '💳' },
    ],
  },
];

// ── Budget Allocator: maps quiz answers → category % of income ──
function computeBudgetFromQuiz(answers, income) {
  const alloc = {
    'Food & Dining': 0,
    'Rent & Housing': 0,
    'Transport': 0,
    'Shopping': 0,
    'Health & Medical': 0,
    'Entertainment': 0,
    'Subscriptions': 0,
    'Education': 0,
    'Travel': 0,
    'Other': 0,
  };

  // Food
  if (answers.meals === 'home') alloc['Food & Dining'] = 0.10;
  else if (answers.meals === 'mixed') alloc['Food & Dining'] = 0.18;
  else alloc['Food & Dining'] = 0.28;

  // Housing
  if (answers.housing === 'family') alloc['Rent & Housing'] = 0.0;
  else if (answers.housing === 'shared') alloc['Rent & Housing'] = 0.15;
  else alloc['Rent & Housing'] = 0.30;

  // Transport
  if (answers.transport === 'walk') alloc['Transport'] = 0.02;
  else if (answers.transport === 'public') alloc['Transport'] = 0.06;
  else alloc['Transport'] = 0.12;

  // Entertainment
  if (answers.lifestyle === 'minimal') alloc['Entertainment'] = 0.03;
  else if (answers.lifestyle === 'moderate') alloc['Entertainment'] = 0.08;
  else alloc['Entertainment'] = 0.14;

  // Shopping
  if (answers.shopping === 'rare') alloc['Shopping'] = 0.03;
  else if (answers.shopping === 'sometimes') alloc['Shopping'] = 0.08;
  else alloc['Shopping'] = 0.14;

  // Health
  if (answers.health === 'none') alloc['Health & Medical'] = 0.02;
  else if (answers.health === 'moderate') alloc['Health & Medical'] = 0.05;
  else alloc['Health & Medical'] = 0.10;

  // Subscriptions
  if (answers.subscriptions === 'none') alloc['Subscriptions'] = 0.0;
  else if (answers.subscriptions === 'few') alloc['Subscriptions'] = 0.02;
  else alloc['Subscriptions'] = 0.04;

  // Fixed allocations
  alloc['Education'] = 0.03;
  alloc['Travel'] = 0.04;
  alloc['Other'] = 0.03;

  // Convert percentages to amounts
  const limits = {};
  for (const [cat, pct] of Object.entries(alloc)) {
    limits[cat] = Math.round(income * pct);
  }

  return limits;
}


export default function BudgetInsights() {
  const { user } = useAuth();
  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(null);

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-04"

  useEffect(() => {
    if (user?.user_id) {
      getUser(user.user_id).then(r => setProfile(r.data)).catch(() => {});
      getBudget(user.user_id, currentMonth).then(r => { console.log('Budget:', r.data); setBudget(r.data); }).catch(() => {});
      getTransactions(user.user_id).then(r => { console.log('Budget transactions:', r.data); setTransactions(r.data || []); }).catch(() => {});
    }
  }, [user]);

  const totalBudget = budget?.total_budget || 0;
  const catLimits = budget?.category_limits || {};
  const spent = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const remaining = totalBudget - spent;
  const usedRatio = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
  const remainingRatio = Math.max(0, 100 - usedRatio);

  const categoryTotals = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  // All categories that are in limits OR in totals
  const allCategories = [...new Set([...Object.keys(catLimits), ...Object.keys(categoryTotals)])];

  // Quiz handlers
  const handleAnswer = (value) => {
    const step = quizSteps[quizStep];
    setAnswers(prev => ({ ...prev, [step.id]: value }));
  };

  const handleNext = () => {
    if (quizStep < quizSteps.length - 1) {
      setQuizStep(quizStep + 1);
    }
  };

  const handleBack = () => {
    if (quizStep > 0) {
      setQuizStep(quizStep - 1);
    }
  };

  const handleFinishQuiz = async () => {
    const income = profile?.monthly_income || 50000;
    const limits = computeBudgetFromQuiz(answers, income);
    setSaving(true);
    try {
      await createBudget({
        user_id: user.user_id,
        month: currentMonth,
        category_limits: limits,
      });
      // Refresh budget
      const r = await getBudget(user.user_id, currentMonth);
      setBudget(r.data);
      setShowQuiz(false);
      setQuizStep(0);
      setToast('Budget plan created from your lifestyle quiz! 🎉');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      console.error('Budget save failed:', err);
    }
    setSaving(false);
  };

  // Dynamic tips
  const tips = [];
  const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0) {
    const [topCat, topAmt] = sortedCats[0];
    const limit = catLimits[topCat] || 0;
    if (limit > 0 && topAmt > limit) {
      const overPct = Math.round(((topAmt - limit) / limit) * 100);
      tips.push({ badge: 'Over budget', badgeBg: '#fcebeb', badgeColor: '#a32d2d', title: `${topCat} spending ${overPct}% over`, text: `You've spent ₹${topAmt.toLocaleString('en-IN')} against a ₹${limit.toLocaleString('en-IN')} budget for ${topCat}.` });
    } else if (topAmt > spent * 0.4) {
      tips.push({ badge: 'High spend', badgeBg: '#faeeda', badgeColor: '#854f0b', title: `${topCat} is your largest expense`, text: `₹${topAmt.toLocaleString('en-IN')} (${Math.round((topAmt / spent) * 100)}% of total).` });
    }
  }
  if (remaining > 0 && totalBudget > 0) {
    tips.push({ badge: 'Opportunity', badgeBg: '#eaf3de', badgeColor: '#3b6d11', title: `₹${remaining.toLocaleString('en-IN')} remaining`, text: `You've used ${usedRatio.toFixed(0)}% of your budget. Consider directing the rest toward savings.` });
  } else if (remaining < 0) {
    tips.push({ badge: 'Over budget', badgeBg: '#fcebeb', badgeColor: '#a32d2d', title: `₹${Math.abs(remaining).toLocaleString('en-IN')} over total budget`, text: `Review your spending and adjust for next month.` });
  }
  if (tips.length === 0) {
    tips.push({ badge: 'Tip', badgeBg: '#e6f1fb', badgeColor: 'var(--navy2)', title: totalBudget > 0 ? 'Tracking active' : 'Set your budget', text: totalBudget > 0 ? 'Keep logging expenses to see personalized tips.' : 'Take the lifestyle quiz to create a personalized budget!' });
  }

  // Quiz preview (after finishing, show computed limits)
  const previewIncome = profile?.monthly_income || 50000;
  const previewLimits = quizStep === quizSteps.length - 1 && Object.keys(answers).length === quizSteps.length
    ? computeBudgetFromQuiz(answers, previewIncome)
    : null;

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}

      <div className="topbar">
        <div>
          <div className="page-title">Budget Insights</div>
          <div className="page-sub">{totalBudget > 0 ? `₹${spent.toLocaleString('en-IN')} of ₹${totalBudget.toLocaleString('en-IN')} used` : 'No budget set yet'}</div>
        </div>
        <button className="btn btn-primary" style={{ fontSize: '12px', padding: '7px 14px' }} onClick={() => { setShowQuiz(true); setQuizStep(0); setAnswers({}); }}>
          📝 {totalBudget > 0 ? 'Retake Quiz' : 'Take Budget Quiz'}
        </button>
      </div>

      {/* ═══════════ LIFESTYLE QUIZ MODAL ═══════════ */}
      {showQuiz && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,42,110,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px', width: '480px', maxHeight: '90vh',
            overflow: 'auto', padding: '32px', boxShadow: '0 16px 60px rgba(10,42,110,.25)',
            position: 'relative',
          }}>
            {/* Close */}
            <button onClick={() => setShowQuiz(false)} style={{
              position: 'absolute', top: '16px', right: '16px', background: 'none',
              border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--muted)', lineHeight: '1',
            }}>×</button>

            {/* Progress */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
              {quizSteps.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: '4px', borderRadius: '2px',
                  background: i <= quizStep ? 'var(--navy2)' : '#e6f1fb',
                  transition: 'background 0.3s ease',
                }}></div>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
              Question {quizStep + 1} of {quizSteps.length}
            </div>

            <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--navy)', marginBottom: '24px', lineHeight: '1.4' }}>
              {quizSteps[quizStep].question}
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {quizSteps[quizStep].options.map((opt) => {
                const isSelected = answers[quizSteps[quizStep].id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 16px', borderRadius: '12px',
                      border: isSelected ? '2px solid var(--navy2)' : '1.5px solid #e6f1fb',
                      background: isSelected ? '#e6f1fb' : '#fff',
                      cursor: 'pointer', textAlign: 'left', fontSize: '14px',
                      color: 'var(--navy)', fontFamily: 'var(--font)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{opt.icon}</span>
                    <span style={{ fontWeight: isSelected ? '500' : '400' }}>{opt.label.replace(/^[^\s]+\s/, '')}</span>
                    {isSelected && <span style={{ marginLeft: 'auto', color: 'var(--navy2)', fontWeight: '600' }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Preview on last step */}
            {previewLimits && (
              <div style={{
                background: '#f8fafb', borderRadius: '12px', padding: '16px',
                marginBottom: '20px', border: '1px solid #e6f1fb',
              }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--navy)', marginBottom: '10px' }}>
                  📊 Your personalized budget (based on ₹{previewIncome.toLocaleString('en-IN')}/mo income):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {Object.entries(previewLimits).filter(([, v]) => v > 0).map(([cat, amt]) => (
                    <div key={cat} style={{ fontSize: '12px', color: 'var(--navy)', display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>{cat}</span>
                      <span style={{ fontWeight: '500' }}>₹{amt.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: '500', color: 'var(--navy2)', borderTop: '1px solid #e6f1fb', paddingTop: '10px' }}>
                  Total: ₹{Object.values(previewLimits).reduce((a, b) => a + b, 0).toLocaleString('en-IN')}/month
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {quizStep > 0 && (
                <button className="btn btn-secondary" onClick={handleBack} style={{ flex: 1, justifyContent: 'center' }}>
                  ← Back
                </button>
              )}
              {quizStep < quizSteps.length - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={!answers[quizSteps[quizStep].id]}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleFinishQuiz}
                  disabled={!answers[quizSteps[quizStep].id] || saving}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {saving ? 'Saving...' : '✨ Create My Budget'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ EMPTY STATE — no budget ═══════════ */}
      {totalBudget === 0 && !showQuiz && (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <div className="card-title">Create your personalized budget</div>
          <p style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '400px', margin: '0 auto 20px', lineHeight: '1.7' }}>
            Answer 7 quick questions about your lifestyle and we'll automatically generate a budget tailored to your daily habits and income level.
          </p>
          <button className="btn btn-primary" onClick={() => { setShowQuiz(true); setQuizStep(0); setAnswers({}); }}>
            📝 Take the Lifestyle Quiz
          </button>
        </div>
      )}

      {/* ═══════════ BUDGET DASHBOARD ═══════════ */}
      {totalBudget > 0 && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Total Budget</div><div className="stat-value">₹{totalBudget.toLocaleString('en-IN')}</div></div>
            <div className="stat-card"><div className="stat-label">Spent</div><div className="stat-value">₹{spent.toLocaleString('en-IN')}</div><div className="stat-change down">{usedRatio.toFixed(1)}% used</div></div>
            <div className="stat-card"><div className="stat-label">Remaining</div><div className="stat-value">₹{Math.max(0, remaining).toLocaleString('en-IN')}</div><div className="stat-change up">{remainingRatio.toFixed(1)}% left</div></div>
            <div className="stat-card"><div className="stat-label">Categories</div><div className="stat-value">{allCategories.length}</div><div className="stat-change">tracked</div></div>
          </div>

          <div className="mid-grid">
            <div className="card">
              <div className="card-title">Budget vs Actual</div>
              {allCategories.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '10px 0' }}>No budget activity yet.</div>
              ) : (
                allCategories.map((cat) => {
                  const limit = catLimits[cat] || 0;
                  const actual = categoryTotals[cat] || 0;
                  const isOver = limit > 0 && actual > limit;
                  const pct = limit > 0 ? Math.min((actual / limit) * 100, 120) : 0;

                  return (
                    <div className="bar-row" key={cat} style={{ marginBottom: '6px' }}>
                      <div className="bar-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: '120px' }}>{cat}</div>
                      <div className="bar-track" style={{ position: 'relative' }}>
                        <div className="bar-fill" style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: isOver ? '#e24b4a' : pct > 80 ? '#ef9f27' : 'var(--navy2)',
                        }}></div>
                      </div>
                      <div className="bar-amt" style={{
                        color: isOver ? '#a32d2d' : 'var(--navy)',
                        minWidth: '100px', textAlign: 'right', fontSize: '11px',
                      }}>
                        ₹{actual.toLocaleString('en-IN')} / ₹{limit.toLocaleString('en-IN')}
                        {isOver && ' ⚠'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="card">
              <div className="card-title">Budget Tips</div>
              {tips.map((tip, i) => (
                <div className="insight-card" key={i} style={{ marginBottom: i < tips.length - 1 ? '10px' : 0, padding: '12px' }}>
                  <div className="insight-badge" style={{ background: tip.badgeBg, color: tip.badgeColor }}>{tip.badge}</div>
                  <div className="insight-title">{tip.title}</div>
                  <div className="insight-text">{tip.text}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
