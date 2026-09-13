import React, { useState, useEffect } from 'react';
import './MyComplaints.css';
import { COMPLAINT_STAGES } from '../services/complaintStorage.js';
import { complaintsAPI } from '../services/api.js';

/**
 * MyComplaints Component
 * Step 4 - Student: My Complaints & Live Status Tracking
 */
function MyComplaints({ student, onBackToDashboard, onNavigateToReport }) {
  const [complaints, setComplaints]             = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusFilter, setStatusFilter]         = useState('ALL');
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);

  useEffect(() => {
    async function loadComplaints() {
      setLoading(true);
      setError(null);
      const result = await complaintsAPI.getMyComplaints();
      setLoading(false);
      if (result.success) {
        setComplaints(result.complaints || []);
        if (result.complaints && result.complaints.length > 0) {
          setSelectedComplaint(result.complaints[0]);
        } else {
          setSelectedComplaint(null);
        }
      } else {
        setError(result.networkError
          ? 'Cannot connect to server. Please ensure the backend is running.'
          : result.message || 'Failed to load complaints.');
      }
    }
    loadComplaints();
  }, [student?.id]);

  const getFilteredComplaints = () => {
    if (statusFilter === 'ALL') return complaints;
    if (statusFilter === 'ACTIVE') {
      return complaints.filter(c => c.currentStatus !== 'Resolved');
    }
    if (statusFilter === 'RESOLVED') {
      return complaints.filter(c => c.currentStatus === 'Resolved');
    }
    return complaints.filter(c => c.currentStatus.toUpperCase() === statusFilter.toUpperCase());
  };

  const filteredList = getFilteredComplaints();

  // Helper for priority class
  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  // Helper for status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Reported': return 'status-reported';
      case 'Assigned': return 'status-assigned';
      case 'Scheduled': return 'status-scheduled';
      case 'In Progress': return 'status-inprogress';
      case 'Resolved': return 'status-resolved';
      default: return 'status-reported';
    }
  };

  return (
    <div className="my-complaints-container">
      {/* Background Campus Visual */}
      <div className="campus-backdrop" aria-hidden="true" />
      <div className="campus-backdrop-overlay" aria-hidden="true" />

      <div className="complaints-content-wrapper">
        
        {/* Top Navigation Bar */}
        <header className="complaints-top-bar">
          <button 
            type="button" 
            className="back-nav-btn" 
            id="back-to-dashboard-btn"
            onClick={onBackToDashboard}
            aria-label="Back to dashboard"
          >
            <svg className="back-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Dashboard</span>
          </button>

          <div className="top-bar-right-actions">
            <button 
              type="button" 
              className="new-complaint-btn"
              id="header-report-problem-btn"
              onClick={onNavigateToReport}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Report New Problem</span>
            </button>
          </div>
        </header>

        {/* Page Title & Intro */}
        <div className="complaints-page-header">
          <div className="institution-emblem-badge">
            <span className="emblem-text">PDPM IIITDM JABALPUR &bull; COMPLAINT TRACKING</span>
          </div>
          <h1 className="complaints-page-title">My Complaints &amp; Status Tracking</h1>
          <p className="complaints-page-subtitle">
            View submitted hostel maintenance requests and track live technician progress
          </p>
        </div>

        {/* Filter Bar */}
        {complaints.length > 0 && (
          <div className="complaints-filter-bar">
            <div className="filter-buttons-group">
              <button 
                type="button" 
                className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                All Complaints ({complaints.length})
              </button>
              <button 
                type="button" 
                className={`filter-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ACTIVE')}
              >
                Active / In Progress ({complaints.filter(c => c.currentStatus !== 'Resolved').length})
              </button>
              <button 
                type="button" 
                className={`filter-btn ${statusFilter === 'RESOLVED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('RESOLVED')}
              >
                Resolved ({complaints.filter(c => c.currentStatus === 'Resolved').length})
              </button>
            </div>
          </div>
        )}

        {/* Main Complaints & Tracking Layout */}
        {complaints.length === 0 ? (
          /* Empty State Section */
          <div className="complaints-empty-state-card" id="complaints-empty-state">
            <div className="empty-state-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="empty-state-title">No complaints registered yet</h3>
            <p className="empty-state-description">
              Your submitted hostel maintenance requests will appear here. If you are experiencing any electrical, plumbing, or facility issues, you can lodge a ticket right away.
            </p>
            <button 
              type="button" 
              className="empty-state-action-btn"
              id="empty-report-problem-btn"
              onClick={onNavigateToReport}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Report a Problem</span>
            </button>
          </div>
        ) : (
          /* Dual Column: Complaints List + Selected Complaint Detail Dossier */
          <div className="complaints-dual-grid">
            
            {/* Left Column: Complaint Cards List */}
            <div className="complaints-list-column">
              <div className="list-column-header">
                <h3 className="list-heading">Submitted Tickets ({filteredList.length})</h3>
                <span className="list-caption">Click a card to inspect live status</span>
              </div>

              <div className="complaints-cards-stack">
                {filteredList.map((complaint) => {
                  const isSelected = selectedComplaint?.id === complaint.id;
                  return (
                    <div 
                      key={complaint.id}
                      className={`complaint-card ${isSelected ? 'complaint-card-selected' : ''}`}
                      onClick={() => setSelectedComplaint(complaint)}
                      tabIndex="0"
                      role="button"
                      aria-label={`View details for complaint ${complaint.id}`}
                    >
                      <div className="card-top-meta">
                        <span className="complaint-id-badge">{complaint.id}</span>
                        <div className="badges-group">
                          <span className={`priority-tag ${getPriorityClass(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                          <span className={`status-tag ${getStatusClass(complaint.currentStatus)}`}>
                            {complaint.currentStatus}
                          </span>
                        </div>
                      </div>

                      <h4 className="complaint-card-title">{complaint.title}</h4>
                      <p className="complaint-card-desc">{complaint.description}</p>

                      <div className="complaint-card-footer">
                        <div className="location-info">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{complaint.hostel} &bull; {complaint.room}</span>
                        </div>
                        <span className="date-info">{complaint.dateReported}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Status Tracking Dossier */}
            <div className="complaint-detail-column">
              {selectedComplaint ? (
                <div className="complaint-detail-card" id="complaint-detail-view">
                  
                  {/* Detail Header */}
                  <div className="detail-card-header">
                    <div className="detail-header-main">
                      <div className="detail-id-row">
                        <span className="detail-id-text">{selectedComplaint.id}</span>
                        <span className={`status-tag-large ${getStatusClass(selectedComplaint.currentStatus)}`}>
                          {selectedComplaint.currentStatus}
                        </span>
                      </div>
                      <h3 className="detail-problem-title">{selectedComplaint.title}</h3>
                    </div>
                  </div>

                  {/* Quick Meta Grid */}
                  <div className="detail-meta-grid">
                    <div className="detail-meta-box">
                      <span className="meta-label">Category</span>
                      <span className="meta-val">{selectedComplaint.category}</span>
                    </div>
                    <div className="detail-meta-box">
                      <span className="meta-label">Priority</span>
                      <span className={`meta-val priority-text-${selectedComplaint.priority?.toLowerCase()}`}>
                        {selectedComplaint.priority} Priority
                      </span>
                    </div>
                    <div className="detail-meta-box">
                      <span className="meta-label">Location</span>
                      <span className="meta-val">{selectedComplaint.room}, {selectedComplaint.hostel}</span>
                    </div>
                    <div className="detail-meta-box">
                      <span className="meta-label">Reported On</span>
                      <span className="meta-val">{selectedComplaint.dateReported}</span>
                    </div>
                  </div>

                  {/* Problem Description Section */}
                  <div className="detail-section">
                    <h4 className="detail-section-title">Problem Description</h4>
                    <p className="detail-desc-text">{selectedComplaint.description}</p>
                  </div>

                  {/* AI Smart Analysis Section */}
                  {selectedComplaint.aiAnalysis && (
                    <div className="detail-ai-section">
                      <div className="detail-ai-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="detail-ai-icon">
                          <path d="M12 2a4 4 0 0 0-4 4c0 1.1.45 2.1 1.17 2.83L12 12l2.83-3.17A4 4 0 0 0 12 2z" />
                          <path d="M12 12l-2.83 3.17A4 4 0 1 0 12 22a4 4 0 0 0 2.83-1.17L12 12z" />
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                        <h4 className="detail-section-title" style={{ margin: 0 }}>AI Smart Analysis</h4>
                        <span className="detail-ai-confidence">{selectedComplaint.aiAnalysis.confidence}</span>
                      </div>
                      <div className="detail-ai-grid">
                        <div className="detail-ai-item">
                          <span className="detail-ai-label">Category</span>
                          <span className="detail-ai-val">{selectedComplaint.aiAnalysis.category}</span>
                        </div>
                        <div className="detail-ai-item">
                          <span className="detail-ai-label">Issue Type</span>
                          <span className="detail-ai-val">{selectedComplaint.aiAnalysis.issueType}</span>
                        </div>
                        <div className="detail-ai-item">
                          <span className="detail-ai-label">Department</span>
                          <span className="detail-ai-val">{selectedComplaint.aiAnalysis.department}</span>
                        </div>
                        <div className="detail-ai-item">
                          <span className="detail-ai-label">Priority</span>
                          <span className={`detail-ai-val priority-text-${selectedComplaint.aiAnalysis.priority?.toLowerCase()}`}>
                            ● {selectedComplaint.aiAnalysis.priority}
                          </span>
                        </div>
                      </div>
                      <div className="detail-ai-reason">
                        <em>{selectedComplaint.aiAnalysis.reason}</em>
                      </div>
                    </div>
                  )}

                  {/* Maintenance Assignment Info */}
                  <div className="detail-assigned-notice">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <div>
                      <strong>Assigned Maintenance Staff:</strong> {selectedComplaint.assignedTo}
                    </div>
                  </div>

                  {/* STATUS TIMELINE SECTION */}
                  <div className="timeline-section">
                    <h4 className="detail-section-title">Resolution Status Timeline</h4>
                    <p className="timeline-subtitle">Live tracking of caretaker workflow and technician visit</p>

                    <div className="status-timeline-track">
                      {COMPLAINT_STAGES.map((stageObj, idx) => {
                        const stageData = selectedComplaint.timeline?.find(t => t.stage === stageObj.key);
                        const isCompleted = stageData ? stageData.completed : false;
                        const isCurrent = stageData?.isCurrent || (selectedComplaint.currentStatus === stageObj.key);
                        const isLast = idx === COMPLAINT_STAGES.length - 1;

                        return (
                          <div 
                            key={stageObj.key} 
                            className={`timeline-step ${isCompleted ? 'step-completed' : ''} ${isCurrent ? 'step-current' : ''}`}
                          >
                            {/* Marker / Icon */}
                            <div className="step-marker-container">
                              <div className="step-circle">
                                {isCompleted && !isCurrent ? (
                                  <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : isCurrent ? (
                                  <span className="current-pulse-dot" />
                                ) : (
                                  <span className="pending-dot" />
                                )}
                              </div>
                              {!isLast && <div className={`step-connector ${isCompleted ? 'connector-filled' : ''}`} />}
                            </div>

                            {/* Stage Text & Details */}
                            <div className="step-content">
                              <div className="step-header-line">
                                <h5 className="step-stage-title">
                                  {stageObj.label}
                                  {isCurrent && <span className="current-badge">Current Status</span>}
                                </h5>
                                {stageData?.timestamp && (
                                  <span className="step-timestamp">{stageData.timestamp}</span>
                                )}
                              </div>
                              
                              <p className="step-stage-desc">
                                {stageData?.note || stageObj.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="no-selection-placeholder">
                  <p>Select a complaint from the list to view its complete status timeline.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Official Footer */}
        <footer className="institutional-footer complaints-footer">
          <p className="footer-institute-name">
            Pandit Dwarka Prasad Mishra Indian Institute of Information Technology, Design and Manufacturing Jabalpur
          </p>
          <p className="footer-address">
            Hostel Affairs &bull; Maintenance Redressal Portal
          </p>
        </footer>

      </div>
    </div>
  );
}

export default MyComplaints;
