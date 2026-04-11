import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import BudgetInsights from './pages/BudgetInsights';
import BehaviorInsights from './pages/BehaviorInsights';
import FinancialHealth from './pages/FinancialHealth';
import Goals from './pages/Goals';
import RetirementPlanning from './pages/RetirementPlanning';
import EmergencyFund from './pages/EmergencyFund';
import WhatIfSimulator from './pages/WhatIfSimulator';
import RiskAlerts from './pages/RiskAlerts';
import Profile from './pages/Profile';
import InvestmentRecommendations from './pages/InvestmentRecommendations';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Protected routes with sidebar layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/budget-insights" element={<BudgetInsights />} />
        <Route path="/behavior-insights" element={<BehaviorInsights />} />
        <Route path="/financial-health" element={<FinancialHealth />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/retirement" element={<RetirementPlanning />} />
        <Route path="/emergency-fund" element={<EmergencyFund />} />
        <Route path="/what-if" element={<WhatIfSimulator />} />
        <Route path="/risk-alerts" element={<RiskAlerts />} />
        <Route path="/investment" element={<InvestmentRecommendations />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
