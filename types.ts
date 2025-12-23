export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Student extends User {
  role: UserRole.STUDENT;
  studentId: string; // رقم الطالب
  gradeId: string;
  sectionId: string;
  parentId: string;
}

export interface Teacher extends User {
  role: UserRole.TEACHER;
  subjects: string[];
  assignedSections: string[]; // Section IDs
}

export interface Parent extends User {
  role: UserRole.PARENT;
  childrenIds: string[];
}

export interface Admin extends User {
  role: UserRole.ADMIN;
}

export interface Grade {
  id: string;
  name: string; // e.g., "الصف السادس"
}

export interface Section {
  id: string;
  name: string; // e.g., "الشعبة 1"
  gradeId: string;
}

export interface Period {
  id: number;
  name: string; // e.g., "الحصة الأولى"
  startTime: string;
  endTime: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  periodId: number;
  studentId: string;
  sectionId: string;
  status: AttendanceStatus;
  markedBy: string; // Teacher ID
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  date: string;
  targetRoles: UserRole[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string; // If null, it's a broadcast or group
  content: string;
  timestamp: string;
  read: boolean;
}

export interface ScheduleItem {
  id: string;
  day: string; // 'الأحد', 'الاثنين', etc.
  periodId: number;
  sectionId: string;
  subject: string;
  teacherId: string;
}

export interface Exam {
  id: string;
  sectionId: string;
  subject: string;
  title: string; // "اختبار منتصف الفصل"
  maxScore: number;
  date: string;
}

export interface GradeResult {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  feedback?: string;
}

// Stats for dashboard
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  attendanceRate: number;
  activeAlerts: number;
}
