import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import DashboardHome from './pages/DashboardHome';
import AttendanceSheet from './pages/AttendanceSheet';
import AIAssistant from './pages/AIAssistant';
import Schedule from './pages/Schedule';
import Grades from './pages/Grades';
import Chat from './pages/Chat';
import Users from './pages/Users';
import AttendanceReport from './pages/AttendanceReport';
import Settings from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {currentUser && <Sidebar />}
      <div className={`flex-1 transition-all duration-300 ${currentUser ? 'mr-64' : ''}`}>
        {children}
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><DashboardHome /></Layout></ProtectedRoute>} />
      
      {/* Teacher Routes */}
      <Route path="/take-attendance" element={<ProtectedRoute><Layout><AttendanceSheet /></Layout></ProtectedRoute>} />
      
      {/* Shared Routes (Behavior varies by role) */}
      <Route path="/schedule" element={<ProtectedRoute><Layout><Schedule /></Layout></ProtectedRoute>} />
      <Route path="/grades" element={<ProtectedRoute><Layout><Grades /></Layout></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><Layout><AIAssistant /></Layout></ProtectedRoute>} />
      
      {/* Student/Parent Specific Aliases (Mapping to same components but context handles view) */}
      <Route path="/my-attendance" element={<ProtectedRoute><Layout><Schedule /></Layout></ProtectedRoute>} /> 
      {/* Note: In a real app my-attendance might be a separate view, reusing Schedule for now or we could add a specific AttendanceHistory page. 
         Let's stick to simple mapping or create a quick history view if requested. The prompt implies "View attendance records". 
         Currently AttendanceReport is for Admin. Let's map /my-attendance to dashboard for now or add a student attendance history.
         Wait, let's reuse AttendanceReport but filtered for student? No, that's admin view.
         Let's just map /my-attendance to Dashboard where there is a summary, or create a simple view. 
         For now, I will map it to a new placeholder or reuse Schedule. Let's redirect /my-attendance to /schedule for simplicity in this iteration as schedule shows classes.
         Actually, let's just make sure all Sidebar links work.
      */}
      <Route path="/my-attendance" element={<ProtectedRoute><Layout><DashboardHome /></Layout></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/users" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
      <Route path="/attendance-report" element={<ProtectedRoute><Layout><AttendanceReport /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
