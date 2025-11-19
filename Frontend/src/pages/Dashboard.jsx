import React, { useState, useEffect, useMemo, useRef } from "react";
import TeacherAttendanceSession from '../services/TeacherAttendanceSession';
import { useNavigate, useLocation } from "react-router-dom";
import AdminPanel from "./AdminPanel";
import userFetch from "../services/UserFetchService";
import Register from "./Register";
import StudentRecords from '../services/StudentRecords';
import { exportToCsv } from "../services/Csvexpoter";
import { AuthContext } from "../context/Authcontext";
import { useContext } from "react";

export default function Dashboard({ user }) {
  // All hooks must be declared at the top level, never inside conditionals
   const auth = useContext(AuthContext);
     user = auth.user;
  if (auth.loading) return <div>Loading...</div>;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null); // For teacher attendance session
  const [currentPage, setCurrentPage] = useState(1);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
   



  // derive saved user once (stable reference) to avoid re-running effects on each render
  const savedUser = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  }, []);

  // compute currentRole as primitive to stabilize redirect effect deps
  const currentRole = user.role;
  // Only navigate when the role indicates admin and we are not already on /admin
  const location = useLocation();
  useEffect(() => {
    if (user.role === "admin") return <AdminPanel />;
  }, [currentRole, location.pathname, navigate, user.approval_status]);

  // Use a ref to mark in-flight fetch (stable across renders)
  const dashboardFetchRef = useRef(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // avoid duplicate fetch if data already loaded or fetch in-progress
      if (data || dashboardFetchRef.current) return;
      dashboardFetchRef.current = true;
      try {
        // NOTE: backend may return an array of users for /accounts/api/users/
        // Normalize into { users, user } where `user` is the current profile.
        const result = await userFetch.get("accounts/api/users/");
        // if (Array.isArray(result) && result.length > 0) {
        //   // Try to find the logged-in user's record by email
        //   const matched = savedUser && savedUser.email ? result.find(u => u.email === savedUser.email) : null;
        //   const serverProfile = matched || result[0];
        //   const mergedProfile = { ...(serverProfile || {}), ...(savedUser || {}) };
        //   setData({ users: result, user: mergedProfile });
        // } else {
          // If backend returned an object (dashboard shape), use it directly
          setData(result);
        // }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        // if unauthorized, redirect to login
        if (err.status === 401 || err.status === 403) {
          navigate('/login');
        }
        setError(err.message || String(err));
      } finally {
        dashboardFetchRef.current = false;
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, data, savedUser]); // data and savedUser are stable primitives / memoized

  // Use unified currentUser throughout render
  const currentUser = user || (data && data.user) || savedUser;

  if (loading) return <div className="main-content container mt-5"><p>Loading dashboard...</p></div>;
  if (error) return <div className="main-content container mt-5 alert alert-danger">Error: {error}</div>;
  if (!data) return <div className="main-content container mt-5"><p>No dashboard data found.</p></div>;
  if (!currentUser) return null;

  // use profile from data.user or fallback to currentUser (localStorage/prop)
  const profile = data.user || currentUser;
  console.log("Dashboard profile:", profile);
  if (profile.approval_status === 'pending' || profile.approval_status === 'unapproved') {
    return (
      <div className="main-content container mt-5">
        <div className="alert alert-warning">
          Your account is <strong>{profile.approval_status}</strong>. Please update your info below.
        </div>
        {profile.feedback && (
          <div className="alert alert-info">
            <strong>Admin Feedback:</strong> {data.feedback}
          </div>
        )}
        <Register editMode={true} />
      </div>
    );
  }


 

  // Prepare student dashboard variables
  let student = null, summaryBySubject = {}, sortedSubjects = [], totalPages = 1, startIdx = 0, endIdx = 0, pagedAttendance = [], subjectOptions = [];

  if (currentUser?.role === "student" && data) {
    student = data.find(e => e.email === currentUser.email);
    // Attendance summary by subject
    console.log(student);
    const getAttendanceSummaryBySubject = attendance => {
      const summary = {};
      attendance.forEach(a => {
        const subj = a.subject || 'Unknown';
        if (!summary[subj]) summary[subj] = { present: 0, absent: 0, total: 0 };
        if (a.entry_status === 'present' || a.entry_status === 'manual-present') {
          summary[subj].present += 1;
        } else {
          summary[subj].absent += 1;
        }
        summary[subj].total += 1;
      });
      return summary;
    };
    summaryBySubject = getAttendanceSummaryBySubject(student.attendance || []);
    sortedSubjects = Object.keys(summaryBySubject).sort();

    // Build subject options from attendance records for exact match
    const subjectNames = Array.from(new Set((student.attendance || []).map(r => r.subject_name).filter(Boolean)));
    subjectOptions = subjectNames.map(name => ({ value: name, label: name })) || [];

    let filteredAttendance = (student.attendance || []).filter(record => {
      let match = true;
      if (filterSubject && record.subject_name && record.subject_name.trim().toLowerCase() !== filterSubject.trim().toLowerCase()) match = false;
      if (filterDate && record.date !== filterDate) match = false;
      if (filterStatus && record.entry_status !== filterStatus && record.exit_status !== filterStatus) match = false;
      if (searchText && !(
        (record.subject_name && record.subject_name.toLowerCase().includes(searchText.trim().toLowerCase())) ||
        (record.entry_status && record.entry_status.toLowerCase().includes(searchText.toLowerCase())) ||
        (record.exit_status && record.exit_status.toLowerCase().includes(searchText.toLowerCase())) ||
        (record.date && record.date.includes(searchText))
      )) match = false;
      return match;
    });

    totalPages = Math.ceil(filteredAttendance.length / PAGE_SIZE) || 1;
    startIdx = (currentPage - 1) * PAGE_SIZE;
    endIdx = startIdx + PAGE_SIZE;
    pagedAttendance = filteredAttendance.slice(startIdx, endIdx);
  }
  if (currentUser?.role === "student") {
    
    // Status options for filter dropdown
    const statusOptions = [
      { value: '', label: 'All' },
      { value: 'present', label: 'Present' },
      { value: 'absent', label: 'Absent' },
      { value: 'manual-present', label: 'Manual Present' },
      { value: 'manual-exit', label: 'Manual Exit' },
    ];
    return (
      <div className="main-content container ">
        <h2 className="mb-4">Welcome, {student.name || currentUser.username} 👨‍🎓</h2>
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="card-title">📚 Class: <span className="text-primary">{student.department } {student.section}</span></h5>
          </div>
        </div>
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="card-title">📘 Subjects:</h5>
            {student.subjects?.length > 0 ? (
              <ul className="list-group list-group-flush">
                {student.subjects.map((subj) => (
                  <li key={subj.id} className="list-group-item">
                    {subj.name} <small className="text-muted">({subj.code})</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No subjects assigned.</p>
            )}
          </div>
        </div>
        <div className="card shadow-sm mb-4" id="records">
          <div className="card-body">
            <h5 className="card-title">📝 Attendance Summary by Subject:</h5>
            {sortedSubjects.length === 0 ? (
              <span className="text-muted">No attendance records found.</span>
            ) : (
              <ul className="list-unstyled mb-0">
                {sortedSubjects.map(subj => {
                  const stats = summaryBySubject[subj];
                  const percent = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;
                  let color = 'secondary';
                  if (percent >= 75) color = 'success';
                  else if (percent >= 50) color = 'warning';
                  else color = 'danger';
                  return (
                    <li key={subj}>
                      <span className="fw-bold">{subj}:</span>
                      <span className="badge bg-success ms-2">Present: {stats.present}</span>
                      <span className="badge bg-danger ms-2">Absent: {stats.absent}</span>
                      <span className={`badge bg-${color} ms-2`} title={`Attendance: ${percent}%`}>{percent}%</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title">🔍 Filter & Search Attendance Records:</h5>
            <div className="row mb-3">
              <div className="col-md-4 mb-2">
                <select className="form-select" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                  <option value="">All Subjects</option>
                  {subjectOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-2">
                <input type="date" className="form-control" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              </div>
              <div className="col-md-4 mb-2">
                <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-12 mb-2">
                <input type="text" className="form-control" placeholder="Search by subject, status, date..." value={searchText} onChange={e => setSearchText(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title">📝 Attendance Records:</h5>

            {pagedAttendance.length > 0 ? (
              <>
                <div className="mb-2">
                  <button
                    className="btn btn-outline-success btn-sm"
                    onClick={() => {
                      const headers = [
                        { label: 'Date', key: 'date' },
                        { label: 'Subject', key: 'subject_name' },
                        { label: 'Entry Status', key: 'entry_status' },
                        { label: 'Exit Status', key: 'exit_status' },
                      ];
                      const rows = pagedAttendance.map(rec => ({
                        date: rec.date,
                        subject_name: rec.subject_name,
                        entry_status: rec.entry_status,
                        exit_status: rec.exit_status
                      }));
                      exportToCsv(`attendance-${currentUser.username || currentUser.name}.csv`, headers, rows);
                    }}
                  >
                    ⬇️ Download CSV
                  </button>
                </div>

                <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                      <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Entry Status</th>
                        <th>Exit Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedAttendance.map((record) => (
                        <tr key={record.id}>
                          <td>{record.date}</td>
                          <td>{record.subject_name}</td>
                          <td>
                            <span className={`badge bg-${record.entry_status === 'present' ? 'success' : record.entry_status === 'manual-present' ? 'info' : 'danger'}`}>{record.entry_status}</span>
                          </td>
                          <td>
                            <span className={`badge bg-${record.exit_status === 'present' ? 'success' : record.exit_status === 'manual-exit' ? 'info' : 'danger'}`}>{record.exit_status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div>
                      <button
                        className="btn btn-outline-primary btn-sm me-2"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >Prev</button>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >Next</button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted">No attendance records found.</p>
            )}

          </div>
        </div>
      </div>
    );
  }

  if (currentUser?.role === "teacher") {
    const teacher = data.teacher_data;
    if (!teacher || teacher.teaching.length === 0) {
      return <div className="main-content container  alert alert-info">📘 You are not assigned to teach any classes yet.</div>;
    }

    // Build subject options for filter
    const subjectOptions = teacher.teaching.map(t => ({ value: t.id, label: `${t.class} - ${t.subject}` }));
    const filtersConfig = [
      { name: 'subject_id', label: 'Subject', type: 'select', options: subjectOptions },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'text' },
      { name: 'name', label: 'Student Name', type: 'text' },
      { name: 'roll_number', label: 'Roll Number', type: 'text' },
    ];

    return (
      <div className="main-content container " id="attendance">
        <h2 className="mb-4">Welcome, {currentUser.name || currentUser.username} 👨‍🏫</h2>
        {teacher.teaching.map((assignment, index) => (
          <div className="card mb-4 shadow-sm" key={index}>
            <div className="card-body">
              <h5 className="card-title">
                Class: <span className="text-primary">{assignment.class}</span> | Subject: <strong>{assignment.subject}</strong>
              </h5>
              <button
                className="btn btn-success mb-2"
                onClick={() => setActiveSession({
                  classSubjectId: assignment.id, // Always use ClassSubject id
                  sessionTitle: `${assignment.subject} - ${new Date().toLocaleDateString()}`
                })}
              >
                Start Attendance Session
              </button>
              {activeSession && activeSession.classSubjectId === assignment.id && (
                <div className="mt-3">
                  <TeacherAttendanceSession
                    classSubjectId={activeSession.classSubjectId}
                    sessionTitle={activeSession.sessionTitle}
                    students={assignment.students}
                  />
                  <button className="btn btn-link mt-2" onClick={() => setActiveSession(null)}>Close Attendance Session</button>
                </div>
              )}
              <h6 className="mt-3">👨‍🎓 Students Enrolled:</h6>
              {assignment.students?.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {assignment.students.map((student, idx) => (
                    <li key={idx} className="list-group-item d-flex align-items-center">
                      <img
                        src={student.avatar ? `http://localhost:8000${student.avatar}` : "/default-avatar.png"}
                        alt="avatar"
                        className="rounded-circle me-2"
                        width="35"
                        height="35"
                      />
                      <div>
                        <strong>{student.name || student.username}</strong><br />
                        <small className="text-muted">{student.email} | Roll: {student.roll_number}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No students enrolled yet.</p>
              )}
            </div>
          </div>
        ))}
        <div className="card my-4" id="records">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">Student Records for Your Subjects</h5>
          </div>
          <div className="card-body">
            <StudentRecords apiUrl="/api/teacher/student-records/" filtersConfig={filtersConfig} title="Teacher: Student Records" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
