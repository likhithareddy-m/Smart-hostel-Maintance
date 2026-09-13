import React, { useState, useEffect, useMemo } from 'react';
import './AdminDashboard.css';
import { adminAPI, complaintsAPI, announcementsAPI, clearAuth } from '../services/api.js';

const STATUS_OPTIONS = ['Reported', 'Assigned', 'Scheduled', 'In Progress', 'Resolved'];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
const CATEGORY_OPTIONS = ['Electrical', 'Plumbing', 'Internet/WiFi', 'Furniture', 'Cleaning', 'Others'];
const DEPARTMENT_OPTIONS = [
  'Electrical Maintenance Dept',
  'Plumbing & Sanitation Dept',
  'Network & IT Infrastructure Dept',
  'Carpentry & Furniture Dept',
  'Housekeeping & Sanitation Dept',
  'Civil & General Maintenance Dept',
  'Hostel Caretaker Office'
];
const HOSTEL_OPTIONS = [
  'Hall of Residence 1 (Aryabhatta)',
  'Hall of Residence 3 (Panini)',
  'Hall of Residence 4 (Nagarjuna)',
  'Maa Saraswati Hostel'
];

export default function AdminDashboard({ admin, onLogout }) {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search State
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    hostel: '',
    search: ''
  });

  // Modal / Detail state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', note: '' });
  const [assignUpdate, setAssignUpdate] = useState({ assigned_to: '', note: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Announcement modal state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' });
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(null);

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, complaintsRes, annRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        complaintsAPI.getAll(),
        announcementsAPI.getAll()
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      if (complaintsRes.success) {
        setComplaints(complaintsRes.complaints);
      } else {
        setError(complaintsRes.message || 'Failed to load complaints');
      }
      if (annRes.success) {
        setAnnouncements(annRes.announcements || []);
      }
    } catch (err) {
      console.error('AdminDashboard fetchData error:', err);
      setError('Connection error. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered complaints client-side (for responsive search/filter)
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (filters.status && c.currentStatus !== filters.status) return false;
      if (filters.priority && c.priority !== filters.priority) return false;
      if (filters.category && c.category !== filters.category) return false;
      if (filters.hostel && c.hostel !== filters.hostel) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchId = (c.id || c.complaint_id || '').toLowerCase().includes(q);
        const matchTitle = (c.title || '').toLowerCase().includes(q);
        const matchStudent = (c.studentName || '').toLowerCase().includes(q);
        const matchRoom = (c.room || '').toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchStudent && !matchRoom && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [complaints, filters]);

  // Open detail panel
  const handleOpenDetail = (complaint) => {
    setSelectedComplaint(complaint);
    setStatusUpdate({ status: complaint.currentStatus, note: '' });
    setAssignUpdate({ assigned_to: complaint.assignedTo || '', note: '' });
    setActionFeedback(null);
  };

  // Close detail panel
  const handleCloseDetail = () => {
    setSelectedComplaint(null);
    setActionFeedback(null);
  };

  // Update complaint status
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusUpdate.status || !selectedComplaint) return;
    setActionLoading(true);
    setActionFeedback(null);

    const compId = selectedComplaint.id || selectedComplaint.complaint_id;
    const res = await complaintsAPI.updateStatus(compId, statusUpdate.status, statusUpdate.note);
    setActionLoading(false);

    if (res.success) {
      setActionFeedback({ type: 'success', message: 'Complaint status updated successfully!' });
      // Update selectedComplaint and complaints list
      setSelectedComplaint(res.complaint);
      setComplaints(prev => prev.map(c => (c.id === compId || c.complaint_id === compId ? res.complaint : c)));
      // Refresh stats
      adminAPI.getDashboardStats().then(s => { if (s.success) setStats(s.stats); });
    } else {
      setActionFeedback({ type: 'error', message: res.message || 'Failed to update status.' });
    }
  };

  // Assign department
  const handleAssignDepartment = async (e) => {
    e.preventDefault();
    if (!assignUpdate.assigned_to || !selectedComplaint) return;
    setActionLoading(true);
    setActionFeedback(null);

    const compId = selectedComplaint.id || selectedComplaint.complaint_id;
    const res = await complaintsAPI.assign(compId, assignUpdate.assigned_to, assignUpdate.note);
    setActionLoading(false);

    if (res.success) {
      setActionFeedback({ type: 'success', message: 'Department assigned successfully!' });
      setSelectedComplaint(res.complaint);
      setComplaints(prev => prev.map(c => (c.id === compId || c.complaint_id === compId ? res.complaint : c)));
      adminAPI.getDashboardStats().then(s => { if (s.success) setStats(s.stats); });
    } else {
      setActionFeedback({ type: 'error', message: res.message || 'Failed to assign department.' });
    }
  };

  // Post announcement
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) return;
    setAnnouncementLoading(true);
    setAnnouncementSuccess(null);

    const res = await announcementsAPI.create(announcementForm.title.trim(), announcementForm.message.trim());
    setAnnouncementLoading(false);

    if (res.success) {
      setAnnouncementSuccess('Announcement published to student portal!');
      setAnnouncementForm({ title: '', message: '' });
      announcementsAPI.getAll().then(a => { if (a.success) setAnnouncements(a.announcements || []); });
      setTimeout(() => {
        setShowAnnouncementModal(false);
        setAnnouncementSuccess(null);
      }, 1200);
    } else {
      setAnnouncementSuccess('Error: ' + (res.message || 'Could not post announcement'));
    }
  };

  const handleLogoutClick = () => {
    clearAuth();
    if (onLogout) onLogout();
  };

  // Badges helper
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'badge-priority-critical';
      case 'High':     return 'badge-priority-high';
      case 'Medium':   return 'badge-priority-medium';
      case 'Low':      return 'badge-priority-low';
      default:         return 'badge-priority-medium';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Reported':    return 'badge-status-reported';
      case 'Assigned':    return 'badge-status-assigned';
      case 'Scheduled':   return 'badge-status-scheduled';
      case 'In Progress': return 'badge-status-progress';
      case 'Resolved':    return 'badge-status-resolved';
      default:            return 'badge-status-reported';
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Background Campus Visual */}
      <div className="campus-backdrop" aria-hidden="true" />
      <div className="campus-backdrop-overlay" aria-hidden="true" />

      <div className="admin-content-wrapper">
        
        {/* Top Navigation / Branding Header */}
        <header className="admin-header">
          <div className="admin-brand">
            <div className="institution-emblem-badge">
              <span className="emblem-text">PDPM IIITDM JABALPUR &bull; ADMIN CONSOLE</span>
            </div>
            <h1 className="admin-title">Smart Hostel Portal</h1>
            <p className="admin-subtitle">Central Hostel Maintenance &amp; Caretaker Management System</p>
          </div>

          <div className="admin-header-actions">
            <div className="admin-user-info">
              <div className="admin-avatar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="admin-meta">
                <span className="admin-name">{admin?.name || 'Administrator'}</span>
                <span className="admin-role-tag">{admin?.role || 'Hostel Caretaker'}</span>
              </div>
            </div>

            <button 
              type="button" 
              className="admin-announcement-btn" 
              onClick={() => setShowAnnouncementModal(true)}
              title="Publish Announcement"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>New Notice</span>
            </button>

            <button 
              type="button" 
              className="admin-logout-btn" 
              onClick={handleLogoutClick}
              title="Logout from administrative console"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Real-time Stats Grid */}
        <section className="admin-stats-section" aria-label="Portal Metrics">
          <div className="admin-stat-card card-total">
            <div className="stat-icon-wrapper">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="stat-details">
              <span className="stat-label">Total Complaints</span>
              <span className="stat-number">{stats?.total ?? complaints.length}</span>
            </div>
          </div>

          <div className="admin-stat-card card-reported">
            <div className="stat-icon-wrapper">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="stat-details">
              <span className="stat-label">Reported / Pending</span>
              <span className="stat-number">{stats?.reported ?? complaints.filter(c => c.currentStatus === 'Reported').length}</span>
            </div>
          </div>

          <div className="admin-stat-card card-progress">
            <div className="stat-icon-wrapper">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </div>
            <div className="stat-details">
              <span className="stat-label">Assigned / In Progress</span>
              <span className="stat-number">
                {(stats ? (stats.assigned + stats.scheduled + stats.in_progress) : complaints.filter(c => ['Assigned', 'Scheduled', 'In Progress'].includes(c.currentStatus)).length)}
              </span>
            </div>
          </div>

          <div className="admin-stat-card card-resolved">
            <div className="stat-icon-wrapper">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="stat-details">
              <span className="stat-label">Resolved Issues</span>
              <span className="stat-number">{stats?.resolved ?? complaints.filter(c => c.currentStatus === 'Resolved').length}</span>
            </div>
          </div>

          <div className="admin-stat-card card-critical">
            <div className="stat-icon-wrapper">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="stat-details">
              <span className="stat-label">Critical / High Priority</span>
              <span className="stat-number">
                {(stats ? (stats.critical + stats.high) : complaints.filter(c => c.priority === 'Critical' || c.priority === 'High').length)}
              </span>
            </div>
          </div>
        </section>

        {/* Filter, Search & Refresh Toolbar */}
        <section className="admin-toolbar-card">
          <div className="toolbar-search-box">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text"
              placeholder="Search by ID, student, title, room..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            {filters.search && (
              <button 
                type="button" 
                className="toolbar-clear-btn" 
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              >
                &times;
              </button>
            )}
          </div>

          <div className="toolbar-filters">
            <select 
              value={filters.status} 
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select 
              value={filters.priority} 
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select 
              value={filters.category} 
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              value={filters.hostel} 
              onChange={(e) => setFilters(prev => ({ ...prev, hostel: e.target.value }))}
            >
              <option value="">All Hostels</option>
              {HOSTEL_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>

            <button 
              type="button" 
              className="toolbar-refresh-btn" 
              onClick={fetchData}
              title="Refresh complaint records"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </section>

        {/* Error message */}
        {error && (
          <div className="admin-error-banner">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Complaints Table Card */}
        <section className="admin-table-card">
          <div className="table-card-header">
            <h2 className="table-title">Registered Complaints Management</h2>
            <span className="table-count-badge">
              Showing {filteredComplaints.length} of {complaints.length} complaints
            </span>
          </div>

          {loading ? (
            <div className="admin-loading-state">
              <div className="spinner" />
              <p>Loading complaints from database...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="admin-empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <p>No complaints match your filter criteria.</p>
              {(filters.status || filters.priority || filters.category || filters.hostel || filters.search) && (
                <button 
                  type="button" 
                  className="btn-reset-filters"
                  onClick={() => setFilters({ status: '', priority: '', category: '', hostel: '', search: '' })}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-complaints-table">
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Student &amp; Location</th>
                    <th>Issue Summary</th>
                    <th>Priority</th>
                    <th>AI Routing Dept</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((c) => {
                    const compId = c.id || c.complaint_id;
                    return (
                      <tr key={compId}>
                        <td className="cell-id">
                          <code>{compId}</code>
                        </td>
                        <td className="cell-student">
                          <div className="student-info-block">
                            <span className="student-name">{c.studentName || 'Student'}</span>
                            <span className="student-loc">{c.hostel?.split('(')[0]?.trim() || c.hostel} &bull; Room {c.room}</span>
                          </div>
                        </td>
                        <td className="cell-issue">
                          <div className="issue-info-block">
                            <span className="issue-title">{c.title}</span>
                            <span className="issue-cat">{c.category} &bull; {c.issueType}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge-priority ${getPriorityBadgeClass(c.priority)}`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="cell-dept">
                          <span className="dept-pill">{c.assignedTo || c.department || 'Not Assigned'}</span>
                        </td>
                        <td>
                          <span className={`badge-status ${getStatusBadgeClass(c.currentStatus)}`}>
                            {c.currentStatus}
                          </span>
                        </td>
                        <td className="cell-date">
                          <span>{c.dateReported || c.createdAt || 'Recent'}</span>
                        </td>
                        <td>
                          <button 
                            type="button"
                            className="btn-manage-action"
                            onClick={() => handleOpenDetail(c)}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Announcements List section */}
        {announcements.length > 0 && (
          <section className="admin-announcements-card">
            <h3 className="section-heading">Active Notices &amp; Announcements</h3>
            <div className="announcements-grid">
              {announcements.map((a) => (
                <div key={a.id} className="announcement-item">
                  <div className="announcement-top">
                    <span className="announcement-title">{a.title}</span>
                    <span className="announcement-date">
                      {new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="announcement-body">{a.message}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* DETAIL & STATUS MANAGEMENT MODAL */}
      {selectedComplaint && (
        <div className="modal-backdrop" onClick={handleCloseDetail}>
          <div className="modal-container admin-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <div className="modal-badges-row">
                  <code>{selectedComplaint.id || selectedComplaint.complaint_id}</code>
                  <span className={`badge-priority ${getPriorityBadgeClass(selectedComplaint.priority)}`}>
                    {selectedComplaint.priority} Priority
                  </span>
                  <span className={`badge-status ${getStatusBadgeClass(selectedComplaint.currentStatus)}`}>
                    {selectedComplaint.currentStatus}
                  </span>
                </div>
                <h3 className="modal-title">{selectedComplaint.title}</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={handleCloseDetail}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="modal-body-scrollable">
              {/* Feedback alert */}
              {actionFeedback && (
                <div className={`action-alert ${actionFeedback.type}`}>
                  {actionFeedback.message}
                </div>
              )}

              {/* Student & Room Info */}
              <div className="detail-meta-grid">
                <div className="meta-box">
                  <span className="meta-label">Reported By</span>
                  <span className="meta-val">{selectedComplaint.studentName}</span>
                  <span className="meta-sub">{selectedComplaint.studentEmail}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Location</span>
                  <span className="meta-val">{selectedComplaint.hostel}</span>
                  <span className="meta-sub">Room #{selectedComplaint.room}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Category &amp; Issue</span>
                  <span className="meta-val">{selectedComplaint.category}</span>
                  <span className="meta-sub">{selectedComplaint.issueType}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Date Reported</span>
                  <span className="meta-val">{selectedComplaint.dateReported || selectedComplaint.createdAt}</span>
                </div>
              </div>

              {/* Problem Description */}
              <div className="detail-description-section">
                <h4 className="detail-subheading">Problem Description</h4>
                <div className="description-content-box">
                  {selectedComplaint.description}
                </div>
              </div>

              {/* AI Diagnostic Summary */}
              {selectedComplaint.aiAnalysis && (
                <div className="ai-diagnostic-card">
                  <div className="ai-diag-header">
                    <span className="ai-sparkle-icon">&#10024;</span>
                    <h4>AI Diagnostic Engine Analysis</h4>
                  </div>
                  <div className="ai-diag-grid">
                    <div>
                      <span className="ai-diag-lbl">Detected Department</span>
                      <strong className="ai-diag-val">{selectedComplaint.aiAnalysis.department}</strong>
                    </div>
                    <div>
                      <span className="ai-diag-lbl">Priority Assessment</span>
                      <strong className="ai-diag-val">{selectedComplaint.aiAnalysis.priority}</strong>
                    </div>
                    <div>
                      <span className="ai-diag-lbl">Routing Confidence</span>
                      <strong className="ai-diag-val">{selectedComplaint.aiAnalysis.confidence || '95%'}</strong>
                    </div>
                  </div>
                  <p className="ai-diag-reason">
                    <strong>Rule Rationale:</strong> {selectedComplaint.aiAnalysis.reason}
                  </p>
                </div>
              )}

              {/* Management Actions: Update Status */}
              <div className="admin-action-forms-grid">
                <form className="action-form-card" onSubmit={handleUpdateStatus}>
                  <h4 className="action-form-title">Update Resolution Status</h4>
                  <div className="form-group">
                    <label>Lifecycle Stage</label>
                    <select 
                      value={statusUpdate.status} 
                      onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                      required
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status Update Note (Visible in Student Timeline)</label>
                    <input 
                      type="text"
                      placeholder="e.g., Electrician assigned for inspection at 4 PM"
                      value={statusUpdate.note}
                      onChange={(e) => setStatusUpdate(prev => ({ ...prev, note: e.target.value }))}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn-action-submit"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Updating...' : 'Update Status'}
                  </button>
                </form>

                {/* Management Actions: Reassign Department */}
                <form className="action-form-card" onSubmit={handleAssignDepartment}>
                  <h4 className="action-form-title">Assign / Route Department</h4>
                  <div className="form-group">
                    <label>Responsible Department / Personnel</label>
                    <select 
                      value={assignUpdate.assigned_to} 
                      onChange={(e) => setAssignUpdate(prev => ({ ...prev, assigned_to: e.target.value }))}
                      required
                    >
                      <option value="">Select Department...</option>
                      {DEPARTMENT_OPTIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assignment Note (Internal / Timeline)</label>
                    <input 
                      type="text"
                      placeholder="e.g., Forwarded to Senior Wireman Rajesh Kumar"
                      value={assignUpdate.note}
                      onChange={(e) => setAssignUpdate(prev => ({ ...prev, note: e.target.value }))}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn-action-submit btn-secondary-action"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : 'Assign Department'}
                  </button>
                </form>
              </div>

              {/* Complaint Timeline Track */}
              {selectedComplaint.timeline && selectedComplaint.timeline.length > 0 && (
                <div className="timeline-history-section">
                  <h4 className="detail-subheading">Complaint Lifecycle History</h4>
                  <div className="timeline-trail">
                    {selectedComplaint.timeline.map((item, idx) => (
                      <div key={idx} className={`timeline-trail-item ${item.completed ? 'completed' : ''} ${item.isCurrent ? 'current' : ''}`}>
                        <div className="trail-dot" />
                        <div className="trail-content">
                          <div className="trail-stage-line">
                            <span className="trail-stage-name">{item.stage}</span>
                            {item.timestamp && <span className="trail-time">{item.timestamp}</span>}
                          </div>
                          {item.note && <p className="trail-note">{item.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showAnnouncementModal && (
        <div className="modal-backdrop" onClick={() => setShowAnnouncementModal(false)}>
          <div className="modal-container announcement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Publish Hostel Maintenance Notice</h3>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setShowAnnouncementModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="modal-body">
              {announcementSuccess && (
                <div className={`action-alert ${announcementSuccess.startsWith('Error') ? 'error' : 'success'}`}>
                  {announcementSuccess}
                </div>
              )}
              <div className="form-group">
                <label>Notice Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Scheduled Water Tank Cleaning on Sunday"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Notice Message Details</label>
                <textarea 
                  rows="4"
                  placeholder="Provide all essential information for hostel residents..."
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-footer-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowAnnouncementModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-action-submit"
                  disabled={announcementLoading}
                >
                  {announcementLoading ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
