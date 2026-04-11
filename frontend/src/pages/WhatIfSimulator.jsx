import { useState } from 'react';

export default function WhatIfSimulator() {
  const [activeTab, setActiveTab] = useState('sip');

  // SIP state
  const [sipAmount, setSipAmount] = useState(6000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // Loan state
  const [loanAmt, setLoanAmt] = useState(500000);
  const [loanRate, setLoanRate] = useState(9);
  const [loanYears, setLoanYears] = useState(5);

  // Save state
  const [saveTarget, setSaveTarget] = useState(100000);
  const [saveMonthly, setSaveMonthly] = useState(5000);
  const [saveRate, setSaveRate] = useState(6);

  const formatL = (n) => {
    if (n >= 10000000) return (n / 10000000).toFixed(1) + ' Cr';
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    return Math.round(n).toLocaleString('en-IN');
  };

  // SIP calculation
  const calcSip = () => {
    const P = sipAmount || 0;
    const r = (sipRate || 0) / 12 / 100;
    const n = (sipYears || 0) * 12;
    const corpus = r > 0 ? P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : P * n;
    const invested = P * n;
    const gains = corpus - invested;
    return { corpus, invested, gains };
  };

  // Loan calculation
  const calcLoan = () => {
    const P = loanAmt || 0;
    const r = (loanRate || 0) / 12 / 100;
    const n = (loanYears || 0) * 12;
    const emi = r > 0 ? P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : (n > 0 ? P / n : 0);
    const total = emi * n;
    const interest = total - P;
    return { emi, interest };
  };

  // Save calculation
  const calcSave = () => {
    const T = saveTarget || 0;
    const M = saveMonthly || 0;
    const r = (saveRate || 0) / 12 / 100;
    let months = M > 0 ? (r > 0 ? Math.log(1 + T * r / M) / Math.log(1 + r) : T / M) : 999;
    months = Math.ceil(months);
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    const dateStr = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    return { months, dateStr };
  };

  const sip = calcSip();
  const loan = calcLoan();
  const save = calcSave();

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="page-title">What-If Simulator</div>
          <div className="page-sub">Explore financial scenarios</div>
        </div>
      </div>

      <div className="mid-grid">
        <div className="card">
          <div className="card-title">Scenario Builder</div>
          <div className="section-tabs" style={{ marginBottom: '16px' }}>
            <button className={`tab${activeTab === 'sip' ? ' active' : ''}`} onClick={() => setActiveTab('sip')}>SIP Growth</button>
            <button className={`tab${activeTab === 'loan' ? ' active' : ''}`} onClick={() => setActiveTab('loan')}>Loan Payoff</button>
            <button className={`tab${activeTab === 'save' ? ' active' : ''}`} onClick={() => setActiveTab('save')}>Save Goal</button>
          </div>

          {activeTab === 'sip' && (
            <>
              <div className="sim-row"><span className="sim-label">Monthly SIP (₹)</span><input className="sim-input" type="number" value={sipAmount} onChange={(e) => setSipAmount(+e.target.value)} /></div>
              <div className="sim-row"><span className="sim-label">Annual return (%)</span><input className="sim-input" type="number" value={sipRate} onChange={(e) => setSipRate(+e.target.value)} /></div>
              <div className="sim-row"><span className="sim-label">Duration (years)</span><input className="sim-input" type="number" value={sipYears} onChange={(e) => setSipYears(+e.target.value)} /></div>
              <div className="scenario-result">
                <div className="scenario-title">Projected corpus</div>
                <div className="scenario-val">₹{formatL(sip.corpus)}</div>
                <div className="scenario-sub">Invested: ₹{formatL(sip.invested)} · Gains: ₹{formatL(sip.gains)}</div>
              </div>
            </>
          )}

          {activeTab === 'loan' && (
            <>
              <div className="sim-row"><span className="sim-label">Loan amount (₹)</span><input className="sim-input" type="number" value={loanAmt} onChange={(e) => setLoanAmt(+e.target.value)} /></div>
              <div className="sim-row"><span className="sim-label">Interest rate (%)</span><input className="sim-input" type="number" value={loanRate} onChange={(e) => setLoanRate(+e.target.value)} /></div>
              <div className="sim-row"><span className="sim-label">Tenure (years)</span><input className="sim-input" type="number" value={loanYears} onChange={(e) => setLoanYears(+e.target.value)} /></div>
              <div className="scenario-result">
                <div className="scenario-title">Monthly EMI</div>
                <div className="scenario-val">₹{Math.round(loan.emi).toLocaleString('en-IN')}</div>
                <div className="scenario-sub">Total interest: ₹{Math.round(loan.interest).toLocaleString('en-IN')}</div>
              </div>
            </>
          )}

          {activeTab === 'save' && (
            <>
              <div className="sim-row"><span className="sim-label">Target amount (₹)</span><input className="sim-input" type="number" value={saveTarget} onChange={(e) => setSaveTarget(+e.target.value)} /></div>
              <div className="sim-row"><span className="sim-label">Monthly savings (₹)</span><input className="sim-input" type="number" value={saveMonthly} onChange={(e) => setSaveMonthly(+e.target.value)} /></div>
              <div className="sim-row"><span className="sim-label">Interest rate (%)</span><input className="sim-input" type="number" value={saveRate} onChange={(e) => setSaveRate(+e.target.value)} /></div>
              <div className="scenario-result">
                <div className="scenario-title">Time to reach goal</div>
                <div className="scenario-val">{save.months} months</div>
                <div className="scenario-sub">By ~{save.dateStr}</div>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title">Quick Scenarios</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="insight-card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => { setSipAmount(10000); setActiveTab('sip'); }}>
              <div className="insight-badge" style={{ background: '#e6f1fb', color: 'var(--navy2)' }}>Try this</div>
              <div className="insight-title">What if I invest ₹10,000/month?</div>
              <div className="insight-text">Doubling your SIP from ₹6K to ₹10K nearly doubles your 10-year corpus.</div>
            </div>
            <div className="insight-card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => { setLoanAmt(600000); setLoanRate(9); setLoanYears(5); setActiveTab('loan'); }}>
              <div className="insight-badge" style={{ background: '#faeeda', color: '#854f0b' }}>Scenario</div>
              <div className="insight-title">What if I buy a car on loan?</div>
              <div className="insight-text">A ₹6L car loan at 9% for 5 years costs ₹12,455/month. That's 16.6% of your income.</div>
            </div>
            <div className="insight-card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => { setSipAmount(2000); setSipRate(12); setSipYears(10); setActiveTab('sip'); }}>
              <div className="insight-badge" style={{ background: '#eaf3de', color: '#3b6d11' }}>Opportunity</div>
              <div className="insight-title">What if I cut food spend by ₹2,000?</div>
              <div className="insight-text">Investing that ₹2,000 monthly for 10 years at 12% returns ₹4.6L corpus.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
