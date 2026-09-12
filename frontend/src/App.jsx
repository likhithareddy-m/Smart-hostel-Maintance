import React, { useState } from 'react';
import RoleSelection from './pages/RoleSelection.jsx';
import StudentLogin from './pages/StudentLogin.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import MyComplaints from './pages/MyComplaints.jsx';
import ReportProblem from './pages/ReportProblem.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

/**
 * App Component - Root Application Controller
 * Manages navigation between Role Selection, Student Login, Student Dashboard, 
 * My Complaints / Status Tracking, Report a Problem, Admin Login, and Admin Dashboard.
 */
function App() {
  // Current active view state: 'role-selection' | 'student-login' | 'student-dashboard' | 'my-complaints' | 'report-problem' | 'admin-login' | 'admin-dashboard'
  const [currentView, setCurrentView] = useState('role-selection');
  const [currentUser, setCurrentUser] = useState(null);

  // Navigation handlers
  const handleSelectRole = (role) => {
    if (role === 'student') {
      setCurrentView('student-login');
    } else if (role === 'admin') {
      setCurrentView('admin-login');
    }
  };

  const handleBackToRoleSelection = () => {
    setCurrentView('role-selection');
  };

  // Student authentication success handler -> Navigate to Student Dashboard
  const handleStudentLoginSuccess = (studentData) => {
    setCurrentUser(studentData);
    setCurrentView('student-dashboard');
  };

  // Admin authentication success handler -> Navigate to Admin Dashboard
  const handleAdminLoginSuccess = (adminData) => {
    setCurrentUser(adminData);
    setCurrentView('admin-dashboard');
  };

  // Dashboard navigation actions
  const handleNavigateToMyComplaints = () => {
    setCurrentView('my-complaints');
  };

  const handleNavigateToReport = () => {
    setCurrentView('report-problem');
  };

  const handleBackToDashboard = () => {
    setCurrentView('student-dashboard');
  };

  const handleComplaintSubmitted = () => {
    setCurrentView('my-complaints');
  };

  // Logout handler -> Return to Role Selection
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('role-selection');
  };

  return (
    <div className="app-root">
      {currentView === 'role-selection' && (
        <RoleSelection onSelectRole={handleSelectRole} />
      )}

      {currentView === 'student-login' && (
        <StudentLogin 
          onBack={handleBackToRoleSelection} 
          onLoginSuccess={handleStudentLoginSuccess}
        />
      )}

      {currentView === 'student-dashboard' && (
        <StudentDashboard 
          student={currentUser} 
          onLogout={handleLogout} 
          onNavigateToMyComplaints={handleNavigateToMyComplaints}
          onNavigateToReport={handleNavigateToReport}
        />
      )}

      {currentView === 'my-complaints' && (
        <MyComplaints 
          student={currentUser} 
          onBackToDashboard={handleBackToDashboard}
          onNavigateToReport={handleNavigateToReport}
        />
      )}

      {currentView === 'report-problem' && (
        <ReportProblem 
          student={currentUser} 
          onBack={handleBackToDashboard}
          onComplaintSubmitted={handleComplaintSubmitted}
        />
      )}

      {currentView === 'admin-login' && (
        <AdminLogin 
          onBack={handleBackToRoleSelection} 
          onLoginSuccess={handleAdminLoginSuccess}
        />
      )}

      {currentView === 'admin-dashboard' && (
        <AdminDashboard 
          admin={currentUser} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}

export default App;
