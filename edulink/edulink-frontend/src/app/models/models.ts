export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { name: string; email: string; phone: string; password: string; role: string; }
export interface StudentRegistrationRequest {
  name: string; email: string; phone: string; password: string;
  dob: string; gender: string; address: string; gradeLevel: string;
  idProofFileName: string; idProofFileType: string; idProofData: string;
  admissionLetterFileName: string; admissionLetterFileType: string; admissionLetterData: string;
}
export interface AuthResponse { token: string; role: string; email: string; name: string; }

export interface User {
  userId: number; name: string; email: string; phone: string; role: string; status: string;
  dob?: string; gender?: string; address?: string; gradeLevel?: string;
  idProofFileName?: string; idProofFileType?: string; idProofData?: string;
  admissionLetterFileName?: string; admissionLetterFileType?: string; admissionLetterData?: string;
}

export interface Course { courseId: number; title: string; subject: string; gradeLevel: string; credits: number; status: string; }
export interface ClassEntity { classId: number; courseId: number; teacherId: number; schedule: string; status: string; }
export interface LearningMaterial { materialId: number; courseId: number; title: string; fileUri: string; uploadedDate: string; status: string; }
export interface Assignment { assignmentId: number; courseId: number; studentId: number; title: string; submissionDate: string; status: string; }
export interface Student { studentId: number; name: string; dob: string; gender: string; address: string; contactInfo: string; enrollmentDate: string; status: string; gradeLevel?: string; }
export interface Attendance { attendanceId: number; studentId: number; classId: number; date: string; status: string; }
export interface PerformanceMetric { metricId: number; studentId: number; courseId: number; score: number; date: string; status: string; }
export interface Exam { examId: number; courseId: number; type: string; date: string; status: string; }
export interface Grade { gradeId: number; examId: number; studentId: number; score: number; grade: string; status: string; }
export interface Audit { auditId: number; officerId: number; scope: string; findings: string; date: string; status: string; }
export interface Report { reportId: number; scope: string; metrics: string; generatedDate: string; }
export interface Notification { notificationId: number; userId: number; entityId: number; message: string; category: string; status: string; createdDate: string; }
export interface AuditLog { id: number; userId: number; action: string; resource: string; timestamp: string; }
