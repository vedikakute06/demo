import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import './App.css'

const API = 'http://127.0.0.1:8000'

function App() {
  const [user, setUser] = useState(null)
  const [goals, setGoals] = useState([])
  const [health, setHealth] = useState(null)
  const [tab, setTab] = useState('goals')
  const [msg, setMsg] = useState('')

  // Goal form state
  const [goalForm, setGoalForm] = useState({
    goal_type: 'travel',
    target_amount: '',
    current_saved: '',
    timeline_months: ''
  })

  // Add saving form
  const [addAmount, setAddAmount] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState('')

  const showMsg = (text) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  // ---- AUTH ----
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API}/users/auth/google`, {
        token: credentialResponse.credential
      })
      setUser(res.data)
      showMsg(`Welcome, ${res.data.name}!`)
    } catch (err) {
      showMsg('Login failed: ' + (err.response?.data?.detail || err.message))
    }
  }

  // ---- GOALS ----
  const fetchGoals = async () => {
    try {
      const res = await axios.get(`${API}/goals/${user.user_id}`)
      setGoals(res.data)
    } catch (err) {
      showMsg('Failed to fetch goals: ' + err.message)
    }
  }

  const createGoal = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API}/goals/`, {
        user_id: user.user_id,
        goal_type: goalForm.goal_type,
        target_amount: parseFloat(goalForm.target_amount),
        current_saved: parseFloat(goalForm.current_saved),
        timeline_months: parseInt(goalForm.timeline_months)
      })
      showMsg('Goal created!')
      setGoalForm({ goal_type: 'travel', target_amount: '', current_saved: '', timeline_months: '' })
      fetchGoals()
    } catch (err) {
      showMsg('Error creating goal: ' + (err.response?.data?.detail || err.message))
    }
  }

  const addSaving = async (goalId) => {
    try {
      await axios.put(`${API}/goals/${goalId}/add-saving`, {
        amount: parseFloat(addAmount)
      })
      showMsg('Saving added!')
      setAddAmount('')
      setSelectedGoalId('')
      fetchGoals()
    } catch (err) {
      showMsg('Error: ' + (err.response?.data?.detail || err.message))
    }
  }

  // ---- FINANCIAL HEALTH ----
  const fetchHealth = async () => {
    try {
      const res = await axios.get(`${API}/financial-health/${user.user_id}`)
      setHealth(res.data)
    } catch (err) {
      showMsg('Error: ' + err.message)
    }
  }

  // ---- NOT LOGGED IN ----
  if (!user) {
    return (
      <div className="app-container">
        <div className="login-card">
          <div className="login-icon">🏦</div>
          <h1>FinanceApp</h1>
          <p className="subtitle">Personal Finance Dashboard</p>
          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => showMsg('Google login failed')}
              theme="filled_blue"
              size="large"
              shape="pill"
            />
          </div>
          {msg && <p className="msg">{msg}</p>}
        </div>
      </div>
    )
  }

  // ---- LOGGED IN ----
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <span className="header-icon">🏦</span>
          <h1>FinanceApp</h1>
        </div>
        <div className="header-right">
          {user.picture && <img src={user.picture} alt="" className="avatar" />}
          <span className="user-name">{user.name}</span>
          <button className="logout-btn" onClick={() => { setUser(null); setGoals([]); setHealth(null) }}>
            Logout
          </button>
        </div>
      </header>

      {msg && <div className="toast">{msg}</div>}

      {/* Tabs */}
      <nav className="tabs">
        <button className={tab === 'goals' ? 'tab active' : 'tab'} onClick={() => { setTab('goals'); fetchGoals() }}>
          🎯 Goals
        </button>
        <button className={tab === 'health' ? 'tab active' : 'tab'} onClick={() => { setTab('health'); fetchHealth() }}>
          📊 Financial Health
        </button>
      </nav>

      {/* Content */}
      <main className="content">
        {/* ========== GOALS TAB ========== */}
        {tab === 'goals' && (
          <div className="tab-content">
            {/* Create Goal Form */}
            <div className="card">
              <h2>➕ Create New Goal</h2>
              <form onSubmit={createGoal} className="goal-form">
                <div className="form-row">
                  <label>
                    Type
                    <select value={goalForm.goal_type} onChange={e => setGoalForm({...goalForm, goal_type: e.target.value})}>
                      <option value="travel">✈️ Travel</option>
                      <option value="gadget">📱 Gadget</option>
                      <option value="vehicle">🚗 Vehicle</option>
                      <option value="emergency">🚨 Emergency</option>
                      <option value="investment">📈 Investment</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </label>
                  <label>
                    Target Amount (₹)
                    <input type="number" placeholder="e.g. 100000" required value={goalForm.target_amount}
                      onChange={e => setGoalForm({...goalForm, target_amount: e.target.value})} />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Current Saved (₹)
                    <input type="number" placeholder="e.g. 20000" required value={goalForm.current_saved}
                      onChange={e => setGoalForm({...goalForm, current_saved: e.target.value})} />
                  </label>
                  <label>
                    Timeline (months)
                    <input type="number" placeholder="e.g. 10" required value={goalForm.timeline_months}
                      onChange={e => setGoalForm({...goalForm, timeline_months: e.target.value})} />
                  </label>
                </div>
                <button type="submit" className="btn-primary">Create Goal</button>
              </form>
            </div>

            {/* Goal List */}
            <div className="card">
              <div className="card-header">
                <h2>📋 Your Goals</h2>
                <button className="btn-secondary" onClick={fetchGoals}>Refresh</button>
              </div>
              {goals.length === 0 ? (
                <p className="empty-msg">No goals yet. Create one above!</p>
              ) : (
                <div className="goals-grid">
                  {goals.map(g => (
                    <div key={g.goal_id} className={`goal-card ${g.status}`}>
                      <div className="goal-top">
                        <span className="goal-type-badge">{g.goal_type}</span>
                        <span className={`goal-status ${g.status}`}>{g.status}</span>
                      </div>
                      <div className="goal-amounts">
                        <span>₹{g.current_saved.toLocaleString()}</span>
                        <span className="goal-separator">/</span>
                        <span>₹{g.target_amount.toLocaleString()}</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${Math.min(g.progress, 100)}%` }}>
                          {g.progress.toFixed(1)}%
                        </div>
                      </div>
                      <p className="monthly-req">
                        Monthly Required: <strong>₹{g.monthly_required.toLocaleString()}</strong>
                      </p>
                      {/* Add Saving */}
                      {g.status === 'active' && (
                        <div className="add-saving-row">
                          {selectedGoalId === g.goal_id ? (
                            <>
                              <input type="number" placeholder="Amount" value={addAmount}
                                onChange={e => setAddAmount(e.target.value)} className="add-saving-input" />
                              <button className="btn-sm btn-primary" onClick={() => addSaving(g.goal_id)}>Add</button>
                              <button className="btn-sm btn-secondary" onClick={() => setSelectedGoalId('')}>✕</button>
                            </>
                          ) : (
                            <button className="btn-sm btn-primary" onClick={() => setSelectedGoalId(g.goal_id)}>
                              + Add Saving
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== HEALTH TAB ========== */}
        {tab === 'health' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h2>📊 Financial Health Score</h2>
                <button className="btn-secondary" onClick={fetchHealth}>Recalculate</button>
              </div>
              {!health ? (
                <p className="empty-msg">Click "Recalculate" to fetch your score.</p>
              ) : (
                <div className="health-content">
                  {/* Big Score */}
                  <div className="score-circle-wrapper">
                    <div className={`score-circle ${health.status}`}>
                      <span className="score-value">{health.score}</span>
                      <span className="score-label">/ 100</span>
                    </div>
                    <span className={`status-badge ${health.status}`}>{health.status.toUpperCase()}</span>
                  </div>

                  {/* Breakdown */}
                  <div className="breakdown-grid">
                    <div className="breakdown-card">
                      <h3>💰 Savings</h3>
                      <div className="breakdown-score">{health.breakdown.savings_score}</div>
                      <div className="breakdown-bar-bg">
                        <div className="breakdown-bar savings" style={{ width: `${health.breakdown.savings_score}%` }}></div>
                      </div>
                      <p className="breakdown-weight">Weight: 40%</p>
                    </div>
                    <div className="breakdown-card">
                      <h3>🛍️ Spending</h3>
                      <div className="breakdown-score">{health.breakdown.spending_score}</div>
                      <div className="breakdown-bar-bg">
                        <div className="breakdown-bar spending" style={{ width: `${health.breakdown.spending_score}%` }}></div>
                      </div>
                      <p className="breakdown-weight">Weight: 30%</p>
                    </div>
                    <div className="breakdown-card">
                      <h3>🛡️ Risk</h3>
                      <div className="breakdown-score">{health.breakdown.risk_score}</div>
                      <div className="breakdown-bar-bg">
                        <div className="breakdown-bar risk" style={{ width: `${health.breakdown.risk_score}%` }}></div>
                      </div>
                      <p className="breakdown-weight">Weight: 30%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
