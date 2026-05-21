import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/auth/login/login.component';
import { StudentRegisterComponent } from './components/auth/student-register/student-register.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { LayoutComponent } from './components/layout/layout/layout.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminStaffComponent } from './components/admin/admin-staff/admin-staff.component';
import { AdminCoursesComponent } from './components/admin/admin-courses/admin-courses.component';
import { AdminStudentsComponent } from './components/admin/admin-students/admin-students.component';
import { AdminAttendanceComponent } from './components/admin/admin-attendance/admin-attendance.component';
import { AdminExamsComponent } from './components/admin/admin-exams/admin-exams.component';
import { AdminReportsComponent } from './components/admin/admin-reports/admin-reports.component';
import { AdminNotificationsComponent } from './components/admin/admin-notifications/admin-notifications.component';
import { AdminApprovalsComponent } from './components/admin/admin-approvals/admin-approvals.component';
import { TeacherMaterialsComponent } from './components/teacher/teacher-materials/teacher-materials.component';
import { TeacherPerformanceComponent } from './components/teacher/teacher-performance/teacher-performance.component';
import { TeacherDashboardComponent } from './components/teacher/teacher-dashboard/teacher-dashboard.component';
import { TeacherStudentsComponent } from './components/teacher/teacher-students/teacher-students.component';
import { TeacherScheduleComponent } from './components/teacher/teacher-schedule/teacher-schedule.component';
import { TeacherExamsComponent } from './components/teacher/teacher-exams/teacher-exams.component';
import { StudentDashboardComponent } from './components/student/student-dashboard/student-dashboard.component';
import { StudentProfileComponent } from './components/student/student-profile/student-profile.component';
import { StudentCoursesComponent } from './components/student/student-courses/student-courses.component';
import { StudentLearningComponent } from './components/student/student-learning/student-learning.component';
import { StudentAttendanceComponent } from './components/student/student-attendance/student-attendance.component';
import { StudentExamsComponent } from './components/student/student-exams/student-exams.component';
import { StudentNotificationsComponent } from './components/student/student-notifications/student-notifications.component';
import { StudentReportsComponent } from './components/student/student-reports/student-reports.component';
import { DashboardComponent } from './components/shared/dashboard/dashboard.component';

const guard = [authGuard];

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register/student', component: StudentRegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: guard,
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'admin/users', component: AdminUsersComponent },
      { path: 'admin/staff', component: AdminStaffComponent },
      { path: 'admin/approvals', component: AdminApprovalsComponent },
      { path: 'admin/students', component: AdminStudentsComponent },
      { path: 'admin/courses', component: AdminCoursesComponent },
      { path: 'admin/attendance', component: AdminAttendanceComponent },
      { path: 'admin/exams', component: AdminExamsComponent },
      { path: 'admin/reports', component: AdminReportsComponent },
      { path: 'admin/notifications', component: AdminNotificationsComponent },
      { path: 'teacher/dashboard', component: TeacherDashboardComponent },
      { path: 'teacher/courses', component: AdminCoursesComponent },
      { path: 'teacher/materials', component: TeacherMaterialsComponent },
      { path: 'teacher/exams', component: TeacherExamsComponent },
      { path: 'teacher/attendance', component: AdminAttendanceComponent },
      { path: 'teacher/students', component: TeacherStudentsComponent },
      { path: 'teacher/schedule', component: TeacherScheduleComponent },
      { path: 'teacher/performance', component: TeacherPerformanceComponent },
      { path: 'student/dashboard', component: StudentDashboardComponent },
      { path: 'student/profile', component: StudentProfileComponent },
      { path: 'student/courses', component: StudentCoursesComponent },
      { path: 'student/learning', component: StudentLearningComponent },
      { path: 'student/exams', component: StudentExamsComponent },
      { path: 'student/attendance', component: StudentAttendanceComponent },
      { path: 'student/notifications', component: StudentNotificationsComponent },
      { path: 'student/reports', component: StudentReportsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
