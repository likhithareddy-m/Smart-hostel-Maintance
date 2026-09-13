import React, { useState, useEffect } from 'react';
import RoleSelection from './pages/RoleSelection.jsx';
import StudentLogin from './pages/StudentLogin.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import MyComplaints from './pages/MyComplaints.jsx';
import ReportProblem from './pages/ReportProblem.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { signOut, restoreAdminSession, restoreStudentSession } from './services/authService.js';

/**
 * App Component - Root Application Controller
 * Manages navigation between Role Selection, Student Login, Student Dashboard, 
 * My Complaints / Status Tracking, Report a Problem, Admin Login, and Admin Dashboard.
 * 
 * Automatically restores verified sessions on page refresh to ensure uninterrupted access.
 */
function App() {
  // Current active view state: 'role-selection' | 'student-login' | 'student-dashboard' | 'my-complaints' | 'report-problem' | 'admin-login' | 'admin-dashboard'
  const [currentView, setCurrentView] = useState('role-selection');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Restore authenticated session upon page refresh / initial app load
  useEffect(() => {
    let isMounted = true;

    async function checkExistingSession() {
      try {
        // 1. Check if admin session is active and re-verify database credentials
        const restoredAdmin = await restoreAdminSession();
        if (isMounted && restoredAdmin) {
          setCurrentUser(restoredAdmin);
          setCurrentView('admin-dashboard');
          setIsLoadingSession(false);
          return;
        }

        // 2. Check if student session is active
        const restoredStudent = await restoreStudentSession();
        if (isMounted && restoredStudent) {
          setCurrentUser(restoredStudent);
          setCurrentView('student-dashboard');
          setIsLoadingSession(false);
          return;
        }
      } catch (err) {
        console.warn('Session verification warning:', err);
      } finally {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Logout handler -> Clear session and return to Role Selection
  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
    setCurrentView('role-selection');
  };

  if (isLoadingSession) {
    return (
      <div className="login-page-container">
        <div className="campus-backdrop" aria-hidden="true" />
        <div className="campus-backdrop-overlay" aria-hidden="true" />
        <div className="login-content-wrapper" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="btn-spinner" style={{ width: '28px', height: '28px', borderTopColor: 'var(--navy-700)', borderColor: 'rgba(15, 43, 72, 0.2)' }} aria-label="Loading session..." />
        </div>
      </div>
    );
  }

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

