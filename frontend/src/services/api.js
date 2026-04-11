import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Auth
export const loginUser = (email, password) =>
  API.post('/user/login', { email, password });

export const registerUser = (name, email, password) =>
  API.post('/user/register', { name, email, password });

export const getUser = (userId) =>
  API.get(`/user/${userId}`);

export const completeOnboarding = (userId, data) =>
  API.post(`/user/onboarding/${userId}`, data);

// Transactions
export const addTransaction = (data) =>
  API.post('/transactions/add', data);

export const getTransactions = (userId) =>
  API.get(`/transactions/${userId}`);

export const uploadTransactions = (userId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post(`/upload/transactions?user_id=${userId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Budget
export const getBudget = (userId, month) =>
  API.get(`/budget/${userId}/${month}`);

export const createBudget = (data) =>
  API.post('/budget/create', data);

// Goals
export const getGoals = (userId) =>
  API.get(`/goals/${userId}`);

export const createGoal = (userId, data) =>
  API.post(`/goals/create/${userId}`, data);

export const payGoal = (goalId, amount) =>
  API.post(`/goals/pay/${goalId}`, { amount });

// Financial Health
export const getFinancialHealth = (userId) =>
  API.get(`/financial-health/${userId}`);

// Behavior
export const getBehaviorInsights = (userId) =>
  API.get(`/behavior/analyze/${userId}`);
export const analyzeBehavior = (userId) =>
  API.post('/behavior/analyze', { user_id: userId });

// Investments
export const recommendInvestment = (userId) =>
  API.get(`/investment/recommend/${userId}`);
export const getInvestment = (userId) =>
  API.get(`/investment/${userId}`);


// Retirement
export const getRetirementPlan = (userId) =>
  API.get(`/retirement/${userId}`);

export const createRetirementPlan = (userId, data) =>
  API.post(`/retirement/plan/${userId}`, data);

// Emergency Fund
export const getEmergencyFund = (userId) =>
  API.get(`/emergency-fund/${userId}`);

export const calculateEmergencyFund = (data) =>
  API.post('/emergency-fund/calculate', data);

// What-If
export const simulateWhatIf = (data) =>
  API.post('/whatif/simulate', data);

// Risk
export const analyzeRisk = (userId) =>
  API.get(`/risk/analyze/${userId}`);

export const getRisk = (userId) =>
  API.get(`/risk/${userId}`);

// AI Insights (Groq)
export const getAIInsights = (userId) =>
  API.post(`/ai/insights/${userId}`);

export default API;
