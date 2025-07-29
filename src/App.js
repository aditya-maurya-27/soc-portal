import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Shifts from "./pages/Roster";
import ShiftHandover from "./pages/ShiftHandover";
import KnowledgeBase from "./pages/KnowledgeBase";
import OperationRunbook from "./pages/OperationRunbook";
import AdvisorySystem from "./pages/AdvisorySystem";
import { ProtectedRoute } from "./context/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/roster" element={
          <ProtectedRoute>
            <Shifts />
          </ProtectedRoute>
        } />
        <Route path="/shift_handover" element={
          <ProtectedRoute>
            <ShiftHandover />
          </ProtectedRoute>
        } />
        <Route path="/knowledge_base" element={
          <ProtectedRoute>
            <KnowledgeBase />
          </ProtectedRoute>
        } />
        <Route path="/operation_runbook" element={
          <ProtectedRoute>
            <OperationRunbook />
          </ProtectedRoute>
        } />
        <Route path="/advisory_system" element={
          <ProtectedRoute>
            <AdvisorySystem />
          </ProtectedRoute>
        } />
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}

export default App;
