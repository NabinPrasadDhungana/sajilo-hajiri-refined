// src/pages/AdminPanel.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import userFetch from "../services/UserFetchService";
import { toast } from "react-toastify";
import StudentRecords from "../services/StudentRecords";
import { AuthContext } from "../context/Authcontext";
import { useContext } from "react";

/**
 * AdminPanel
 * - Full admin dashboard with users, classes, subjects, enrollments, assignments, feedback, and CRUD ops.
 * - Preserves original functionality but fixes loading / fetch timing / duplication issues.
 */

export default function AdminPanel() {
  const auth = useContext(AuthContext);
  const user = auth.user;
  const navigate = useNavigate();
  const location = useLocation();

  // UI tabs
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("students"); // 'students' | 'teachers'
  const [searchQuery, setSearchQuery] = useState("");

  // loading & error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [searchRoll, setSearchRoll] = useState("");

  // Form / modal state
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [editMode, setEditMode] = useState({
    class: null,
    subject: null,
    teacher: null,
    student: null,
    user: null,
  });
  const [viewUser, setViewUser] = useState(null);

  const [formData, setFormData] = useState({
    // Class
    className: "",
    year: "",
    semester: "",
    department: "",
    // Subject
    subjectName: "",
    subjectCode: "",
    // Teacher/Student assignment
    teacherId: "",
    classId: "",
    subjectId: "",
    studentId: "",
    enrollClassId: "",
    // User
    userName: "",
    userEmail: "",
    userRole: "student",
    userPassword: "",
  });

  // Helper
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      className: "",
      year: "",
      semester: "",
      department: "",
      subjectName: "",
      subjectCode: "",
      teacherId: "",
      classId: "",
      subjectId: "",
      studentId: "",
      enrollClassId: "",
      userName: "",
      userEmail: "",
      userRole: "student",
      userPassword: "",
    });
    setEditMode({
      class: null,
      subject: null,
      teacher: null,
      student: null,
      user: null,
    });
  };

  // ---------- Data fetching ----------
  // use ref to prevent duplicate fetches for same user
  const initializedRef = useRef(false);
  const lastUserIdRef = useRef(null);

  // derive primitives to stabilize effect deps
  const userId = useMemo(() => user?.id ?? null, [user?.id]);
  const isAdmin = useMemo(() => user?.role === "admin", [user?.role]);

  // Single unified fetching function
  const fetchAllData = async () => {
    try {
      setIsLoading(true);

      const [
        
        usersData,
        teachersData,
        studentsData,
        classesData,
        subjectsData,
        enrollmentsData,
        assignmentsData,
      ] = await Promise.all([
        
        userFetch.get("/accounts/api/users/"),
        userFetch.get("/accounts/api/users/?role=teacher"),
        userFetch.get("/accounts/api/users/?role=student"),
        userFetch.get("academics/api/classes/"),
        userFetch.get("academics/api/subjects/"),
        userFetch.get("academics/api/student-class-enrollment/"),
        userFetch.get("academics/api/class-subject/"),
      ]);

     
      setUsers(Array.isArray(usersData) ? usersData : []);
      console.log("Users data:", usersData);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setError(null);
    } catch (err) {
      console.error("Admin data fetch error:", err);
      setError(err?.message || String(err) || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

 useEffect(() => {
    // wait until user context fully loaded
    if (auth.loading) return;

    // redirect non-admins away from /admin
    if (user && user.role !== "admin" && location.pathname === "/admin") {
      navigate("/dashboard");
      return;
    }

    // only fetch if user is admin
    if (user && user.role === "admin") {
      fetchAllData();
    }
  }, [user, auth.loading, navigate, location.pathname]);


  // ---------- CRUD helper (generic) ----------
  const handleSubmit = async (endpoint, data = {}, method = "POST", successMessage = "Success") => {
    try {
      let res;
      if (method === "DELETE") {
        res = await userFetch.delete(endpoint);
      } else if (method === "PUT" || method === "PATCH") {
        res = await userFetch.put(endpoint, data);
      } else {
        res = await userFetch.post(endpoint, data);
      }

      if (successMessage) toast.success(successMessage);
      await fetchAllData();
      resetForm();
      return res;
    } catch (err) {
      console.error("Operation error:", err);
      toast.error(`Operation failed: ${err?.message || String(err)}`);
      throw err;
    }
  };

  // ---------- Class handlers ----------
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!formData.className || !formData.year || !formData.semester || !formData.department) {
      toast.error("Please fill all class fields");
      return;
    }
    try {
      await userFetch.post("academics/api/classes/", {
        name: formData.className,
        year: formData.year,
        semester: formData.semester,
        department: formData.department,
      });
      toast.success("Class created successfully!");
      const classesList = await userFetch.get("academics/api/classes/");
      setClasses(Array.isArray(classesList) ? classesList : []);
      setFormData((prev) => ({ ...prev, className: "", year: "", semester: "", department: "" }));
    } catch (err) {
      console.error("Class creation error:", err);
      toast.error(`Class creation failed: ${err?.message || String(err)}`);
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!editMode.class) return;
    try {
      await userFetch.put(`/academics/api/classes/${editMode.class}/`, {
        name: formData.className,
        year: formData.year,
        semester: formData.semester,
        department: formData.department,
      });
      toast.success("Class updated successfully!");
      const classesList = await userFetch.get("academics/api/classes/");
      setClasses(Array.isArray(classesList) ? classesList : []);
      resetForm();
    } catch (err) {
      console.error("Update class error:", err);
      toast.error(`Update failed: ${err?.message || String(err)}`);
    }
  };

  const editClass = (classItem) => {
    setFormData((prev) => ({
      ...prev,
      className: classItem.name,
      year: classItem.year,
      semester: classItem.semester,
      department: classItem.department,
    }));
    setEditMode((prev) => ({ ...prev, class: classItem.id }));
    document.getElementById("class-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const deleteClass = async (id) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    try {
      await handleSubmit(`academics/api/classes/${id}/`, {}, "DELETE", "Class deleted successfully!");
    } catch (err) {
      console.error("Delete class error:", err);
    }
  };

  // ---------- Subject handlers ----------
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!formData.subjectName || !formData.subjectCode) {
      toast.error("Please provide subject name and code");
      return;
    }
    try {
      await userFetch.post("/api/subjects/", { name: formData.subjectName, code: formData.subjectCode });
      toast.success("Subject created successfully!");
      const subjectsList = await userFetch.get("/api/subjects/");
      setSubjects(Array.isArray(subjectsList) ? subjectsList : []);
      setFormData((prev) => ({ ...prev, subjectName: "", subjectCode: "" }));
    } catch (err) {
      console.error("Subject creation error:", err);
      toast.error(`Subject creation failed: ${err?.message || String(err)}`);
    }
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    if (!editMode.subject) return;
    try {
      await userFetch.put(`/api/subjects/${editMode.subject}/`, {
        name: formData.subjectName,
        code: formData.subjectCode,
      });
      toast.success("Subject updated successfully!");
      const subjectsList = await userFetch.get("/api/subjects/");
      setSubjects(Array.isArray(subjectsList) ? subjectsList : []);
      resetForm();
    } catch (err) {
      console.error("Update subject error:", err);
      toast.error(`Update failed: ${err?.message || String(err)}`);
    }
  };

  const editSubject = (subject) => {
    setFormData((prev) => ({ ...prev, subjectName: subject.name, subjectCode: subject.code }));
    setEditMode((prev) => ({ ...prev, subject: subject.id }));
    document.getElementById("subject-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const deleteSubject = async (subjectId) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await userFetch.delete(`/api/subjects/${subjectId}/`);
      toast.success("Subject deleted successfully");
      const subjectsList = await userFetch.get("/api/subjects/");
      setSubjects(Array.isArray(subjectsList) ? subjectsList : []);
    } catch (err) {
      console.error("Delete subject error:", err);
      toast.error(`Failed to delete subject: ${err?.message || String(err)}`);
    }
  };

  // ---------- User CRUD ----------
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.userName,
      email: formData.userEmail,
      role: formData.userRole,
      password: formData.userPassword,
    };

    try {
      if (editMode.user) {
        await handleSubmit(`/accounts/api/users/${editMode.user}/`, payload, "PUT", "User updated successfully!");
      } else {
        await handleSubmit("/accounts/api/users/", payload, "POST", "User created successfully!");
      }
    } catch (err) {
      console.error("User submit error:", err);
    }
  };

  const editUser = (u) => {
    setEditMode((prev) => ({ ...prev, user: u.id }));
    setFormData((prev) => ({
      ...prev,
      userName: u.name,
      userEmail: u.email,
      userRole: u.role,
    }));
  };

  const deleteUser = async (id) => {
    if (id === user?.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await userFetch.delete(`/accounts/api/users/${id}/`);
      toast.success("User deleted successfully");
      await fetchAllData();
    } catch (err) {
      console.error("Delete user error:", err);
      toast.error(`Delete failed: ${err?.message || String(err)}`);
    }
  };

  // ---------- Enrollment / Assignment ----------
  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.enrollClassId) {
      toast.error("Please select both student and class");
      return;
    }
    try {
      await userFetch.post("/api/enrollments/", {
        student: formData.studentId,
        enrolled_class: formData.enrollClassId,
      });
      toast.success("Student enrolled successfully!");
      const enrollList = await userFetch.get("/api/enrollments/");
      setEnrollments(Array.isArray(enrollList) ? enrollList : []);
      setFormData((prev) => ({ ...prev, studentId: "", enrollClassId: "" }));
    } catch (err) {
      console.error("Enrollment error:", err);
      toast.error(`Enrollment failed: ${err?.message || String(err)}`);
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!formData.teacherId || !formData.classId || !formData.subjectId) {
      toast.error("Please select a teacher, class, and subject");
      return;
    }
    try {
      await userFetch.post("/api/admin/assign-teacher/", {
        teacher: formData.teacherId,
        class_instance: formData.classId,
        subject: formData.subjectId,
      });
      toast.success("Teacher assigned successfully!");
      const assignmentsList = await userFetch.get("/api/assignments/");
      setAssignments(Array.isArray(assignmentsList) ? assignmentsList : []);
      setFormData((prev) => ({ ...prev, teacherId: "", classId: "", subjectId: "" }));
    } catch (err) {
      console.error("Assignment error:", err);
      toast.error(`Assignment failed: ${err?.message || String(err)}`);
    }
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm("Are you sure you want to remove this assignment?")) return;
    try {
      await handleSubmit(`/api/assignments/${id}/`, {}, "DELETE", "Assignment removed successfully!");
    } catch (err) {
      console.error("Delete assignment error:", err);
    }
  };

  const deleteEnrollment = async (enrollmentId) => {
    if (!window.confirm("Are you sure you want to remove this enrollment?")) return;
    try {
      await userFetch.delete(`/api/enrollments/${enrollmentId}/`);
      toast.success("Enrollment removed successfully");
      const enrollList = await userFetch.get("/api/enrollments/");
      setEnrollments(Array.isArray(enrollList) ? enrollList : []);
    } catch (err) {
      console.error("Delete enrollment error:", err);
      toast.error(`Failed to remove enrollment: ${err?.message || String(err)}`);
    }
  };

  // ---------- Approve / Unapprove / Feedback ----------
  const handleUserAction = async (email, action) => {
    try {
      await userFetch.post("/api/admin/approve-user/", { email, action });
      toast.success(`User ${action}d successfully`);
      const usersList = await userFetch.get("/api/admin/pending-users/");
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (err) {
      console.error("Action error:", err);
      toast.error(`Failed to ${action} user: ${err?.message || String(err)}`);
    }
  };

  const sendFeedback = async () => {
    if (!selectedEmail || !feedbackText.trim()) {
      toast.error("Please select a user and enter feedback");
      return;
    }
    try {
      await userFetch.post("/api/admin/send-feedback/", { email: selectedEmail, feedback: feedbackText });
      toast.success("Feedback sent successfully!");
      setFeedbackText("");
      setSelectedEmail(null);
      const usersList = await userFetch.get("/api/admin/pending-users/");
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (err) {
      console.error("Feedback error:", err);
      toast.error(`Failed to send feedback: ${err?.message || String(err)}`);
    }
  };

  // ---------- Utilities ----------
  const filteredUsers = users.filter((u) =>
    u.role === (activeSubTab === "students" ? "student" : "teacher") &&
    (
      u.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (activeSubTab === "students" && u.roll_number?.toString().includes(searchQuery))
    )
  );

  // ---------- Render ----------
  if (isLoading) {
    return <div className="main-content container text-center mt-5"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="main-content container alert alert-danger mt-5">Error: {error}</div>;
  }

  // Build filter options
  const classOptions = classes?.map((c) => ({ value: c.id, label: c.name })) || [];
  const subjectOptions = subjects?.map((s) => ({ value: s.id, label: s.name })) || [];
  const filtersConfig = [
    { name: "class_id", label: "Class", type: "select", options: classOptions },
    { name: "subject_id", label: "Subject", type: "select", options: subjectOptions },
    { name: "date", label: "Date", type: "date" },
    { name: "status", label: "Status", type: "text" },
    { name: "name", label: "Student Name", type: "text" },
    { name: "roll_number", label: "Roll Number", type: "text" },
  ];

  return (
    <div className="container-fluid">
      <h1 className="mb-4">Admin Panel</h1>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>User Management</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "classes" ? "active" : ""}`} onClick={() => setActiveTab("classes")}>Class Management</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "subjects" ? "active" : ""}`} onClick={() => setActiveTab("subjects")}>Subject Management</button>
        </li>
      </ul>

      {/* DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="dashboard-tab">
          <div className="row mb-4">
            {[
              { title: "Total Users", value: stats.total_users ?? users.length, icon: "👥" },
              { title: "Total Students", value: stats.total_students ?? students.length, icon: "🎓" },
              { title: "Total Teachers", value: stats.total_teachers ?? teachers.length, icon: "👨‍🏫" },
              { title: "Pending Approvals", value: users.filter(u => u.approval_status === "pending").length, icon: "⏳" },
            ].map((stat, i) => (
              <div key={i} className="col-md-3 mb-3">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <h2>{stat.icon}</h2>
                    <h5 className="card-title">{stat.title}</h5>
                    <p className="card-text display-6">{stat.value || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header bg-primary text-white"><h5 className="mb-0">Quick Assign Teacher</h5></div>
                <div className="card-body">
                  <form onSubmit={handleAssignTeacher}>
                    <div className="mb-3">
                      <select name="teacherId" className="form-select" onChange={handleChange} required value={formData.teacherId}>
                        <option value="">Select Teacher</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <select name="classId" className="form-select" onChange={handleChange} required value={formData.classId}>
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <select name="subjectId" className="form-select" onChange={handleChange} required value={formData.subjectId}>
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Assign Teacher</button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header bg-success text-white"><h5 className="mb-0">Quick Enroll Student</h5></div>
                <div className="card-body">
                  <form onSubmit={handleEnrollStudent}>
                    <div className="mb-3">
                      <select name="studentId" className="form-select" onChange={handleChange} required value={formData.studentId}>
                        <option value="">Select Student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <select name="enrollClassId" className="form-select" onChange={handleChange} required value={formData.enrollClassId}>
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-success w-100">Enroll Student</button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Recent assignments / enrollments */}
          <div className="card mb-4">
            <div className="card-header"><h5 className="mb-0">Recent Teacher Assignments</h5></div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead><tr><th>Teacher</th><th>Class</th><th>Subject</th><th>Actions</th></tr></thead>
                  <tbody>
                    {assignments.slice(0, 5).map(assign => {
                      const teacher = teachers.find(t => t.id === assign.teacher);
                      const classItem = classes.find(c => c.id === assign.class_instance);
                      const subject = subjects.find(s => s.id === assign.subject);
                      return (
                        <tr key={assign.id}>
                          <td>{teacher?.name || "Unknown"}</td>
                          <td>{classItem?.name || "Unknown"}</td>
                          <td>{subject?.name || "Unknown"}</td>
                          <td><button className="btn btn-sm btn-danger" onClick={() => deleteAssignment(assign.id)}>Remove</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h5 className="mb-0">Recent Student Enrollments</h5></div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead><tr><th>Student</th><th>Class</th><th>Enrolled On</th><th>Actions</th></tr></thead>
                  <tbody>
                    {enrollments.slice(0, 5).map(enr => {
                      const student = students.find(s => s.id === enr.student);
                      const classItem = classes.find(c => c.id === enr.enrolled_class);
                      return (
                        <tr key={enr.id}>
                          <td>{student?.name || "Unknown"}</td>
                          <td>{classItem?.name || "Unknown"}</td>
                          <td>{new Date(enr.enrolled_on).toLocaleDateString()}</td>
                          <td><button className="btn btn-sm btn-danger" onClick={() => deleteEnrollment(enr.id)}>Remove</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="user-management-tab">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button className={`nav-link ${activeSubTab === "students" ? "active" : ""}`} onClick={() => setActiveSubTab("students")}>Students</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeSubTab === "teachers" ? "active" : ""}`} onClick={() => setActiveSubTab("teachers")}>Teachers</button>
            </li>
          </ul>

          <div className="card mb-4">
            <div className="card-header bg-primary text-white"><h5 className="mb-0">{editMode.user ? "Edit User" : "Create New User"}</h5></div>
            <div className="card-body">
              <form onSubmit={handleUserSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name</label>
                    <input type="text" name="userName" className="form-control" value={formData.userName} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" name="userEmail" className="form-control" value={formData.userEmail} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Role</label>
                    <select name="userRole" className="form-select" value={formData.userRole} onChange={handleChange} required>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {!editMode.user && (
                    <div className="col-md-6">
                      <label className="form-label">Password</label>
                      <input type="password" name="userPassword" className="form-control" value={formData.userPassword} onChange={handleChange} required minLength={8} />
                    </div>
                  )}
                  <div className="col-12">
                    <div className="d-flex justify-content-end gap-2">
                      {editMode.user && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
                      <button type="submit" className="btn btn-primary">{editMode.user ? "Update User" : "Create User"}</button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* User list */}
          <div className="card">
            <div className="card-header"><h5 className="mb-0">User List</h5></div>
            <div className="card-body">
              <div className="mb-3">
                <input type="text" className="form-control" placeholder={`Search ${activeSubTab} by ${activeSubTab === "students" ? "Roll No., Name, or Email" : "Name or Email"}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr><th>Roll No.</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      
                      <tr key={u.id}>
                        <td>{u.roll_number}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className={`badge ${u.role === "teacher" ? "bg-info" : u.role === "admin" ? "bg-danger" : "bg-primary"}`}>{u.role}</span></td>
                        <td><span className={`badge ${u.approval_status === "approved" ? "bg-success" : u.approval_status === "unapproved" ? "bg-danger" : "bg-warning"}`}>{u.approval_status || "pending"}</span></td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-info" onClick={() => setViewUser(u)}>View</button>
                            <button className="btn btn-sm btn-primary" onClick={() => editUser(u)}>Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u.id)} disabled={u.id === user?.id}>Delete</button>
                            {u.approval_status !== "approved" && <button className="btn btn-sm btn-success" onClick={() => handleUserAction(u.email, "approve")}>Approve</button>}
                            {u.approval_status !== "unapproved" && <button className="btn btn-sm btn-warning" onClick={() => handleUserAction(u.email, "unapprove")}>Unapprove</button>}
                            <button className={`btn btn-sm ${selectedEmail === u.email ? "btn-secondary" : "btn-info"}`} onClick={() => setSelectedEmail(selectedEmail === u.email ? null : u.email)}>{selectedEmail === u.email ? "Cancel" : "Feedback"}</button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* User Details Modal */}
                    {viewUser && (
                      <tr>
                        <td colSpan="6">
                          <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }} tabIndex="-1">
                            <div className="modal-dialog">
                              <div className="modal-content">
                                <div className="modal-header">
                                  <h5 className="modal-title">User Details</h5>
                                  <button type="button" className="btn-close" onClick={() => setViewUser(null)} />
                                </div>
                                <div className="modal-body">
                                  <div className="text-center mb-3">
                                    <img
                                      src={
                                        viewUser.avatar
                                          ? (viewUser.avatar.startsWith("http") ? viewUser.avatar : `/media/avatars/${viewUser.avatar}`)
                                          : (viewUser.avatar_url ? (viewUser.avatar_url.startsWith("http") ? viewUser.avatar_url : `/media/avatars/${viewUser.avatar_url}`) : "/media/avatars/Logo.png")
                                      }
                                      alt="User Avatar"
                                      className="rounded-circle border"
                                      style={{ width: 100, height: 100, objectFit: "cover", background: "#f0f0f0" }}
                                    />
                                  </div>
                                  <dl className="row">
                                    <dt className="col-sm-4">Name</dt><dd className="col-sm-8">{viewUser.name}</dd>
                                    <dt className="col-sm-4">Email</dt><dd className="col-sm-8">{viewUser.email}</dd>
                                    {viewUser.roll_number && <>
                                      <dt className="col-sm-4">Roll Number</dt><dd className="col-sm-8">{viewUser.roll_number}</dd>
                                    </>}
                                    {viewUser.department && <>
                                      <dt className="col-sm-4">Department</dt><dd className="col-sm-8">{viewUser.department}</dd>
                                    </>}
                                    {viewUser.semester && <>
                                      <dt className="col-sm-4">Semester</dt><dd className="col-sm-8">{viewUser.semester}</dd>
                                    </>}
                                    {viewUser.section && <>
                                      <dt className="col-sm-4">Section</dt><dd className="col-sm-8">{viewUser.section}</dd>
                                    </>}
                                    <dt className="col-sm-4">Role</dt><dd className="col-sm-8">{viewUser.role}</dd>
                                    <dt className="col-sm-4">Status</dt><dd className="col-sm-8">{viewUser.approval_status || "pending"}</dd>
                                  </dl>
                                </div>
                                <div className="modal-footer">
                                  {viewUser.approval_status !== "approved" && <button className="btn btn-success" onClick={() => { handleUserAction(viewUser.email, "approve"); setViewUser(null); }}>Approve</button>}
                                  {viewUser.approval_status !== "unapproved" && <button className="btn btn-warning" onClick={() => { handleUserAction(viewUser.email, "unapprove"); setViewUser(null); }}>Unapprove</button>}
                                  <button className="btn btn-secondary" onClick={() => setViewUser(null)}>Close</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {selectedEmail && (
            <div className="card mt-4">
              <div className="card-header bg-info text-white"><h5 className="mb-0">Send Feedback to {selectedEmail}</h5></div>
              <div className="card-body">
                <textarea className="form-control mb-3" rows="4" placeholder="Enter your feedback here..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-secondary" onClick={() => { setFeedbackText(""); setSelectedEmail(null); }}>Cancel</button>
                  <button className="btn btn-primary" onClick={sendFeedback} disabled={!feedbackText.trim()}>Send Feedback</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLASS MANAGEMENT */}
      {activeTab === "classes" && (
        <div className="class-management-tab">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white"><h5 className="mb-0">{editMode.class ? "Edit Class" : "Create New Class"}</h5></div>
            <div className="card-body">
              <form id="class-form" onSubmit={editMode.class ? handleUpdateClass : handleCreateClass}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Class Name</label>
                    <input type="text" name="className" className="form-control" value={formData.className} onChange={handleChange} required />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Year</label>
                    <input type="number" name="year" className="form-control" value={formData.year} onChange={handleChange} required />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Semester</label>
                    <input type="number" name="semester" className="form-control" value={formData.semester} onChange={handleChange} required />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Department</label>
                    <input type="text" name="department" className="form-control" value={formData.department} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <div className="d-flex justify-content-end gap-2">
                      {editMode.class && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
                      <button type="submit" className="btn btn-primary">{editMode.class ? "Update Class" : "Create Class"}</button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h5 className="mb-0">Class List</h5></div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead><tr><th>Name</th><th>Year</th><th>Semester</th><th>Department</th><th>Students</th><th>Actions</th></tr></thead>
                  <tbody>
                    {classes.map(classItem => (
                      <tr key={classItem.id}>
                        <td>{classItem.name}</td>
                        <td>{classItem.year}</td>
                        <td>{classItem.semester}</td>
                        <td>{classItem.department}</td>
                        <td>{enrollments.filter(e => e.enrolled_class === classItem.id).length}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-primary" onClick={() => editClass(classItem)}>Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => deleteClass(classItem.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBJECT MANAGEMENT */}
      {activeTab === "subjects" && (
        <div className="subject-management-tab">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white"><h5 className="mb-0">{editMode.subject ? "Edit Subject" : "Create New Subject"}</h5></div>
            <div className="card-body">
              <form id="subject-form" onSubmit={editMode.subject ? handleUpdateSubject : handleCreateSubject}>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Subject Name</label>
                    <input type="text" name="subjectName" className="form-control" value={formData.subjectName} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Subject Code</label>
                    <input type="text" name="subjectCode" className="form-control" value={formData.subjectCode} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <div className="d-flex justify-content-end gap-2">
                      {editMode.subject && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
                      <button type="submit" className="btn btn-primary">{editMode.subject ? "Update Subject" : "Create Subject"}</button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h5 className="mb-0">Subject List</h5></div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead><tr><th>Name</th><th>Code</th><th>Assigned Classes</th><th>Actions</th></tr></thead>
                  <tbody>
                    {subjects.map(subject => (
                      <tr key={subject.id}>
                        <td>{subject.name}</td>
                        <td>{subject.code}</td>
                        <td>{assignments.filter(a => a.subject === subject.id).length}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-primary" onClick={() => editSubject(subject)}>Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => deleteSubject(subject.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student records / report component */}
      <div className="card my-4">
        <div className="card-header bg-primary text-white"><h5 className="mb-0">All Student Records</h5></div>
        <div className="card-body">
          <StudentRecords apiUrl="/accounts/api/users/?role=student" filtersConfig={filtersConfig} title="Admin: Student Records" />
        </div>
      </div>
    </div>
  );
}
