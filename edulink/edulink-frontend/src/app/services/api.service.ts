import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(private http: HttpClient) {}

  getCourses(): Observable<any[]> { return this.http.get<any[]>('/api/courses'); }
  getCourse(id: number): Observable<any> { return this.http.get<any>(`/api/courses/${id}`); }
  createCourse(d: any): Observable<any> { return this.http.post<any>('/api/courses', d); }
  updateCourse(id: number, d: any): Observable<any> { return this.http.put<any>(`/api/courses/${id}`, d); }
  deleteCourse(id: number): Observable<any> { return this.http.delete(`/api/courses/${id}`); }

  getClasses(): Observable<any[]> { return this.http.get<any[]>('/api/classes'); }
  createClass(d: any): Observable<any> { return this.http.post<any>('/api/classes', d); }
  updateClass(id: number, d: any): Observable<any> { return this.http.put<any>(`/api/classes/${id}`, d); }
  deleteClass(id: number): Observable<any> { return this.http.delete(`/api/classes/${id}`); }

  getMaterials(): Observable<any[]> { return this.http.get<any[]>('/api/materials'); }
  createMaterial(d: any): Observable<any> { return this.http.post<any>('/api/materials', d); }
  updateMaterial(id: number, d: any): Observable<any> { return this.http.put<any>(`/api/materials/${id}`, d); }
  deleteMaterial(id: number): Observable<any> { return this.http.delete(`/api/materials/${id}`); }
  uploadMaterialFile(formData: FormData): Observable<any> { return this.http.post<any>('/api/materials/upload', formData); }

  getAssignments(): Observable<any[]> { return this.http.get<any[]>('/api/assignments'); }
  createAssignment(d: any): Observable<any> { return this.http.post<any>('/api/assignments', d); }
  updateAssignment(id: number, d: any): Observable<any> { return this.http.put<any>(`/api/assignments/${id}`, d); }
  deleteAssignment(id: number): Observable<any> { return this.http.delete(`/api/assignments/${id}`); }

  getStudents(): Observable<any[]> { return this.http.get<any[]>('/api/students'); }
  getStudent(id: number): Observable<any> { return this.http.get<any>(`/api/students/${id}`); }
  createStudent(d: any): Observable<any> { return this.http.post<any>('/api/students', d); }
  updateStudent(id: number, d: any): Observable<any> { return this.http.put<any>(`/api/students/${id}`, d); }
  deleteStudent(id: number): Observable<any> { return this.http.delete(`/api/students/${id}`); }

  getAllEnrollments(): Observable<any[]> { return this.http.get<any[]>('/api/students/enrollments'); }
  getMyEnrollments(): Observable<any[]> { return this.http.get<any[]>('/api/students/my-enrollments'); }
  getMyStudent(): Observable<any> { return this.http.get<any>('/api/students/me'); }
  getEnrollmentsByStudent(sid: number): Observable<any[]> { return this.http.get<any[]>(`/api/students/${sid}/enrollments`); }
  getEnrollmentsByCourse(cid: number): Observable<any[]> { return this.http.get<any[]>(`/api/students/enrollments/course/${cid}`); }
  getEnrollmentsByTeacher(tid: number): Observable<any[]> { return this.http.get<any[]>(`/api/students/enrollments/teacher/${tid}`); }
  enrollStudent(d: any): Observable<any> { return this.http.post<any>('/api/students/enroll', d); }
  enrollByGrade(courseId: number, classId: number, teacherId: number, gradeLevel: string): Observable<any[]> {
    return this.http.post<any[]>(`/api/students/enroll/grade?courseId=${courseId}&classId=${classId}&teacherId=${teacherId}&gradeLevel=${encodeURIComponent(gradeLevel)}`, {});
  }
  unenrollStudent(enrollmentId: number): Observable<any> { return this.http.delete(`/api/students/enroll/${enrollmentId}`); }

  enrollStudentInExam(examId: number, studentId: number): Observable<any> { return this.http.post<any>(`/api/exams/${examId}/enroll/${studentId}`, {}); }
  unenrollStudentFromExam(examId: number, studentId: number): Observable<any> { return this.http.delete(`/api/exams/${examId}/enroll/${studentId}`); }
  getStudentsForExam(examId: number): Observable<any[]> { return this.http.get<any[]>(`/api/exams/${examId}/students`); }
  getExamsByStudent(studentId: number): Observable<any[]> { return this.http.get<any[]>(`/api/exams/student/${studentId}`); }

  getAttendance(): Observable<any[]> { return this.http.get<any[]>('/api/attendance'); }
  getAttendanceByStudent(studentId: number): Observable<any[]> { return this.http.get<any[]>(`/api/attendance/student/${studentId}`); }
  createAttendance(d: any): Observable<any> { return this.http.post<any>('/api/attendance', d); }
  updateAttendance(id: number, d: any): Observable<any> { return this.http.put<any>(`/api/attendance/${id}`, d); }

  getPerformance(): Observable<any[]> { return this.http.get<any[]>('/api/performance'); }
  createPerformance(d: any): Observable<any> { return this.http.post<any>('/api/performance', d); }

  getExams(): Observable<any[]> { return this.http.get<any[]>('/api/exams'); }
  getExamsByGrade(grade: string): Observable<any[]> { return this.http.get<any[]>(`/api/exams/grade/${encodeURIComponent(grade)}`); }
  getUnattemptedExams(studentId: number, gradeLevel: string): Observable<any[]> { return this.http.get<any[]>(`/api/exams/student/${studentId}/unattempted?gradeLevel=${encodeURIComponent(gradeLevel)}`); }
  createExam(d: any): Observable<any> { return this.http.post<any>('/api/exams', d); }
  updateExam(id: number, d: any): Observable<any> { return this.http.put<any>(`/api/exams/${id}`, d); }
  deleteExam(id: number): Observable<any> { return this.http.delete(`/api/exams/${id}`); }

  getGrades(): Observable<any[]> { return this.http.get<any[]>('/api/grades'); }
  getGradesByStudent(sid: number): Observable<any[]> { return this.http.get<any[]>(`/api/grades/student/${sid}`); }
  createGrade(d: any): Observable<any> { return this.http.post<any>('/api/grades', d); }
  updateGrade(id: number, d: any): Observable<any> { return this.http.put<any>(`/api/grades/${id}`, d); }

  getAudits(): Observable<any[]> { return this.http.get<any[]>('/api/audits'); }
  createAudit(d: any): Observable<any> { return this.http.post<any>('/api/audits', d); }
  updateAudit(id: number, d: any): Observable<any> { return this.http.put<any>(`/api/audits/${id}`, d); }

  getReports(): Observable<any[]> { return this.http.get<any[]>('/api/reports'); }
  createReport(d: any): Observable<any> { return this.http.post<any>('/api/reports', d); }

  getNotifications(): Observable<any[]> { return this.http.get<any[]>('/api/notifications'); }
  getNotificationsByUser(uid: number): Observable<any[]> { return this.http.get<any[]>(`/api/notifications/user/${uid}`); }
  getUnreadNotifications(uid: number): Observable<any[]> { return this.http.get<any[]>(`/api/notifications/user/${uid}/unread`); }
  createNotification(d: any): Observable<any> { return this.http.post<any>('/api/notifications', d); }
  markNotificationRead(id: number): Observable<any> { return this.http.patch<any>(`/api/notifications/${id}/read`, {}); }
  submitQuiz(d: any): Observable<any> { return this.http.post<any>('/api/submissions', d); }
}
