import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFinancialHealth } from '../services/api';

export default function FinancialHealth() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.user_id) {
      getFinancialHealth(user.user_id)
        .then(r => { console.log('Financial health:', r.data); setHealth(r.data); })
        .catch((err) => console.error('Financial health error:', err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const score = health?.score ?? 0;
  const dashArray = `${(score / 100) * 226} ${226 - (score / 100) * 226}`;
  const status = health?.status || 'poor';

  const savingsScore = health?.breakdown?.savings_score ?? 0;
  const spendingScore = health?.breakdown?.spending_score ?? 0;
  const riskScore = health?.breakdown?.risk_score ?? 0;

  // Helper for score label
  const getScoreLabel = (val) => {
    if (val >= 80) return { text: 'Excellent', color: '#3b6d11' };
    if (val >= 60) return { text: 'Good', color: '#3b6d11' };
    if (val >= 40) return { text: 'Fair', color: '#854f0b' };
    return { text: 'Needs work', color: '#a32d2d' };
  };

  const savingsLabel = getScoreLabel(savingsScore);
  const spendingLabel = getScoreLabel(spendingScore);
  const riskLabel = getScoreLabel(riskScore);

  // Generate dynamic recommendations based on actual scores
  const recommendations = [];

  if (riskScore < 70) {
    recommendations.push({
      priority: 'Priority 1',
      badgeBg: '#faeeda',
      badgeColor: '#854f0b',
      title: 'Build your emergency fund',
      text: `Your risk score is ${riskScore.toFixed(0)}/100. Building an emergency fund covering 6 months of expenses will significantly improve your financial safety.`,
    });
  }

  if (savingsScore < 60) {
    recommendations.push({
      priority: 'Priority ' + (recommendations.length + 1),
      badgeBg: '#e6f1fb',
      badgeColor: 'var(--navy2)',
      title: 'Increase your savings rate',
      text: `Your savings score is ${savingsScore.toFixed(0)}/100. Try to save at least 20-30% of your monthly income for long-term financial health.`,
    });
  }

  if (spendingScore < 70) {
    recommendations.push({
      priority: 'Priority ' + (recommendations.length + 1),
      badgeBg: '#fcebeb',
      badgeColor: '#a32d2d',
      title: 'Reduce high-value expenses',
      text: `Your spending score is ${spendingScore.toFixed(0)}/100. Review transactions above ₹5,000 — cutting discretionary big-ticket spending can improve your score rapidly.`,
    });
  }

  if (savingsScore >= 80 && riskScore >= 80) {
    recommendations.push({
      priority: 'Maintain',
      badgeBg: '#eaf3de',
      badgeColor: '#3b6d11',
      title: 'Great financial habits!',
      text: 'Your savings and risk management are excellent. Consider growing wealth through SIPs or index funds.',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'Tip',
      badgeBg: '#e6f1fb',
      badgeColor: 'var(--navy2)',
      title: 'Keep monitoring',
      text: 'Your financial health is on the right track. Continue tracking expenses and building savings.',
    });
  }

  if (loading) {
    return (
      <div className="page">
        <div className="topbar"><div><div className="page-title">Financial Health</div></div></div>
        <div className="loading-spinner">Calculating your financial health...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">Financial Health</div>
          <div className="page-sub">Your overall financial wellness score</div>
        </div>
      </div>

      <div className="mid-grid">
        <div className="card">
          <div className="card-title">Health Score Breakdown</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="36" fill="none" stroke="#e6f1fb" strokeWidth="10"/>
                <circle cx="45" cy="45" r="36" fill="none" stroke="var(--navy2)" strokeWidth="10" strokeDasharray={dashArray} strokeLinecap="round" transform="rotate(-90 45 45)"/>
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: '500', color: 'var(--navy)' }}>{score.toFixed(0)}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>/100</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--navy)' }}>
                {status === 'excellent' ? 'Excellent' : status === 'good' ? 'Good — Room to Improve' : 'Needs Attention'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', lineHeight: '1.5' }}>
                {score >= 80
                  ? 'Your financial health is excellent! Keep up the great habits.'
                  : score >= 50
                  ? 'Your financial health is decent but there are areas to improve. Focus on the recommendations below.'
                  : 'Your financial health needs attention. Follow the recommendations to improve your score.'}
              </div>
            </div>
          </div>

          <div className="score-item">
            <div className="score-header">
              <span className="score-name">Savings Score</span>
              <span className="score-val" style={{ color: savingsLabel.color }}>{savingsScore.toFixed(0)}% · {savingsLabel.text}</span>
            </div>
            <div className="score-track"><div className="score-fill" style={{ width: `${Math.min(savingsScore, 100)}%`, background: savingsLabel.color === '#3b6d11' ? '#639922' : savingsLabel.color === '#854f0b' ? '#ef9f27' : '#e24b4a' }}></div></div>
          </div>
          <div className="score-item">
            <div className="score-header">
              <span className="score-name">Spending Discipline</span>
              <span className="score-val" style={{ color: spendingLabel.color }}>{spendingScore.toFixed(0)}% · {spendingLabel.text}</span>
            </div>
            <div className="score-track"><div className="score-fill" style={{ width: `${Math.min(spendingScore, 100)}%`, background: spendingLabel.color === '#3b6d11' ? '#639922' : spendingLabel.color === '#854f0b' ? '#ef9f27' : '#e24b4a' }}></div></div>
          </div>
          <div className="score-item">
            <div className="score-header">
              <span className="score-name">Risk Buffer</span>
              <span className="score-val" style={{ color: riskLabel.color }}>{riskScore.toFixed(0)}% · {riskLabel.text}</span>
            </div>
            <div className="score-track"><div className="score-fill" style={{ width: `${Math.min(riskScore, 100)}%`, background: riskLabel.color === '#3b6d11' ? '#639922' : riskLabel.color === '#854f0b' ? '#ef9f27' : '#e24b4a' }}></div></div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Recommendations</div>
          {recommendations.map((rec, i) => (
            <div className="insight-card" key={i} style={{ padding: '12px', marginBottom: i < recommendations.length - 1 ? '10px' : 0 }}>
              <div className="insight-badge" style={{ background: rec.badgeBg, color: rec.badgeColor }}>{rec.priority}</div>
              <div className="insight-title">{rec.title}</div>
              <div className="insight-text">{rec.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
