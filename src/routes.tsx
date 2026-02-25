import type { ReactNode } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SchoolManagement from './pages/admin/SchoolManagement';
import AdminQuestionBank from './pages/admin/AdminQuestionBank';
import LoginHistory from './pages/admin/LoginHistory';
import ActiveUsers from './pages/admin/ActiveUsers';
import StorageMonitoring from './pages/admin/StorageMonitoring';
import CapacityPlanning from './pages/admin/CapacityPlanning';
import ErrorLogs from './pages/admin/ErrorLogs';
import PrincipalDashboard from './pages/principal/PrincipalDashboard';
import TeachersList from './pages/principal/TeachersList';
import StudentsList from './pages/principal/StudentsList';
import AcademicsManagement from './pages/principal/AcademicsManagement';
import ExamApprovals from './pages/principal/ExamApprovals';
import PrincipalLiveMonitoring from './pages/principal/LiveMonitoring';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import QuestionBank from './pages/teacher/QuestionBank';
import QuestionPaperPreparation from './pages/teacher/QuestionPaperPreparation';
import QuestionPaperManagement from './pages/teacher/QuestionPaperManagement';
import CreateExam from './pages/teacher/CreateExam';
import ManageExams from './pages/teacher/ManageExams';
import ManageLessons from './pages/teacher/ManageLessons';
import PrincipalManageLessons from './pages/principal/ManageLessons';
import ExamResults from './pages/teacher/ExamResults';
import StudentExamDetail from './pages/teacher/StudentExamDetail';
import TeacherLiveMonitoring from './pages/teacher/LiveMonitoring';
import TeacherAnalyses from './pages/teacher/Analyses';
import TeacherExamAnalysis from './pages/teacher/ExamAnalysis';
import TeacherStudentAnalysis from './pages/teacher/StudentAnalysis';
import QuestionBankAnalysis from './pages/teacher/QuestionBankAnalysis';
import StudentExamAttemptDetail from './pages/teacher/StudentExamAttemptDetail';
import PrincipalAnalyses from './pages/principal/Analyses';
import PrincipalExamAnalysis from './pages/principal/ExamAnalysis';
import PrincipalStudentAnalysis from './pages/principal/StudentAnalysis';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentExams from './pages/student/StudentExams';
import StudentResults from './pages/student/StudentResults';
import TakeExam from './pages/student/TakeExam';
import StudentResult from './pages/student/StudentResult';
import TimePickerDemo from './pages/TimePickerDemo';
import ProtectedRoute from './components/common/ProtectedRoute';
import { StudentDataProvider } from './contexts/StudentDataContext';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <Home />,
    visible: false,
  },
  {
    name: 'Login',
    path: '/login',
    element: <Login />,
    visible: false,
  },
  {
    name: 'Register',
    path: '/register',
    element: <Register />,
    visible: false,
  },
  {
    name: 'Forgot Password',
    path: '/forgot-password',
    element: <ForgotPassword />,
    visible: false,
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: <ResetPassword />,
    visible: false,
  },
  {
    name: 'Time Picker Demo',
    path: '/time-picker-demo',
    element: <TimePickerDemo />,
    visible: false,
  },
  {
    name: 'Admin Dashboard',
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'User Management',
    path: '/admin/users',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <UserManagement />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'School Management',
    path: '/admin/schools',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <SchoolManagement />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Question Bank',
    path: '/admin/questions',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminQuestionBank />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Login History',
    path: '/admin/login-history',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <LoginHistory />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Active Users',
    path: '/admin/active-users',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <ActiveUsers />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Storage Monitoring',
    path: '/admin/storage',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <StorageMonitoring />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Capacity Planning',
    path: '/admin/capacity',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <CapacityPlanning />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Error Logs',
    path: '/admin/error-logs',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <ErrorLogs />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Principal Dashboard',
    path: '/principal',
    element: (
      <ProtectedRoute allowedRoles={['principal']}>
        <PrincipalDashboard />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Teachers List',
    path: '/principal/teachers',
    element: (
      <ProtectedRoute allowedRoles={['principal']}>
        <TeachersList />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Students List',
    path: '/principal/students',
    element: (
      <ProtectedRoute allowedRoles={['principal']}>
        <StudentsList />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Academic Management',
    path: '/principal/academics',
    element: (
      <ProtectedRoute allowedRoles={['principal']}>
        <AcademicsManagement />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Manage Lessons',
    path: '/principal/lessons',
    element: (
      <ProtectedRoute allowedRoles={['principal', 'admin']}>
        <PrincipalManageLessons />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Question Bank',
    path: '/principal/questions',
    element: (
      <ProtectedRoute allowedRoles={['principal']}>
        <QuestionBank />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Teacher Dashboard',
    path: '/teacher',
    element: (
      <ProtectedRoute allowedRoles={['teacher']}>
        <TeacherDashboard />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Students List',
    path: '/teacher/students',
    element: (
      <ProtectedRoute allowedRoles={['teacher']}>
        <StudentsList />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Question Bank',
    path: '/teacher/questions',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <QuestionBank />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Question Paper Preparation',
    path: '/teacher/question-paper',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <QuestionPaperPreparation />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Question Paper Management',
    path: '/teacher/question-papers',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <QuestionPaperManagement />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Question Paper Management',
    path: '/principal/question-papers',
    element: (
      <ProtectedRoute allowedRoles={['principal']}>
        <QuestionPaperManagement />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Student Dashboard',
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <StudentDataProvider>
          <StudentDashboard />
        </StudentDataProvider>
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Student Exams',
    path: '/student/exams',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <StudentDataProvider>
          <StudentExams />
        </StudentDataProvider>
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Student Results',
    path: '/student/results',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <StudentDataProvider>
          <StudentResults />
        </StudentDataProvider>
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Take Exam',
    path: '/student/exams/:examId/take',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <StudentDataProvider>
          <TakeExam />
        </StudentDataProvider>
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Student Result',
    path: '/student/exams/:examId/result',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <StudentDataProvider>
          <StudentResult />
        </StudentDataProvider>
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Exam Approvals',
    path: '/principal/exam-approvals',
    element: (
      <ProtectedRoute allowedRoles={['principal']}>
        <ExamApprovals />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Live Monitoring',
    path: '/principal/live-monitoring',
    element: (
      <ProtectedRoute allowedRoles={['principal']}>
        <PrincipalLiveMonitoring />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Create Exam',
    path: '/teacher/exams/create',
    element: (
      <ProtectedRoute allowedRoles={['teacher']}>
        <CreateExam />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Manage Exams',
    path: '/teacher/exams',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal', 'admin']}>
        <ManageExams />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Manage Lessons',
    path: '/teacher/lessons',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal', 'admin']}>
        <ManageLessons />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Live Monitoring',
    path: '/teacher/live-monitoring',
    element: (
      <ProtectedRoute allowedRoles={['teacher']}>
        <TeacherLiveMonitoring />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Exam Results',
    path: '/teacher/exams/:examId/results',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal', 'admin']}>
        <ExamResults />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Student Exam Detail',
    path: '/teacher/exams/:examId/students/:studentId',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal', 'admin']}>
        <StudentExamDetail />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Teacher Analyses',
    path: '/teacher/analyses',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal', 'admin']}>
        <TeacherAnalyses />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Teacher Exam Analysis',
    path: '/teacher/analyses/exam',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal', 'admin']}>
        <TeacherExamAnalysis />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Teacher Student Analysis',
    path: '/teacher/analyses/student',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal', 'admin']}>
        <TeacherStudentAnalysis />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Question Bank Analysis',
    path: '/teacher/question-bank-analysis',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal', 'admin']}>
        <QuestionBankAnalysis />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Student Exam Attempt Detail',
    path: '/teacher/exam-attempt/:attemptId',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'principal', 'admin']}>
        <StudentExamAttemptDetail />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Principal Analyses',
    path: '/principal/analyses',
    element: (
      <ProtectedRoute allowedRoles={['principal', 'admin']}>
        <PrincipalAnalyses />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Principal Exam Analysis',
    path: '/principal/analyses/exam',
    element: (
      <ProtectedRoute allowedRoles={['principal', 'admin']}>
        <PrincipalExamAnalysis />
      </ProtectedRoute>
    ),
    visible: false,
  },
  {
    name: 'Principal Student Analysis',
    path: '/principal/analyses/student',
    element: (
      <ProtectedRoute allowedRoles={['principal', 'admin']}>
        <PrincipalStudentAnalysis />
      </ProtectedRoute>
    ),
    visible: false,
  },
];

export default routes;
