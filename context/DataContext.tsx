
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { 
  User, Student, Teacher, Parent, Admin, 
  Grade, Section, Period, Announcement, AttendanceRecord,
  UserRole, ScheduleItem, Exam, GradeResult, Message
} from '../types';
import * as Mock from '../data/mockData';

interface DataContextType {
  students: Student[];
  teachers: Teacher[];
  parents: Parent[];
  admins: Admin[];
  grades: Grade[];
  sections: Section[];
  periods: Period[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  schedule: ScheduleItem[];
  exams: Exam[];
  gradeResults: GradeResult[];
  messages: Message[];
  
  // Actions
  addAttendance: (record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => void;
  getStudentAttendance: (studentId: string) => AttendanceRecord[];
  getClassAttendance: (date: string, periodId: number, sectionId: string) => AttendanceRecord[];
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  getAllUsers: () => User[];
  
  addExam: (exam: Omit<Exam, 'id'>) => void;
  updateGrade: (examId: string, studentId: string, score: number) => void;
  sendMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'read'>) => void;
  markMessagesAsRead: (senderId: string, receiverId: string) => void;
  deleteUser: (userId: string) => void;
  addUser: (user: User) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(Mock.STUDENTS);
  const [teachers, setTeachers] = useState<Teacher[]>(Mock.TEACHERS);
  const [parents, setParents] = useState<Parent[]>(Mock.PARENTS);
  const [admins, setAdmins] = useState<Admin[]>(Mock.ADMINS);
  
  const [grades] = useState<Grade[]>(Mock.GRADES);
  const [sections] = useState<Section[]>(Mock.SECTIONS);
  const [periods] = useState<Period[]>(Mock.PERIODS);
  
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(Mock.MOCK_ATTENDANCE);
  const [announcements, setAnnouncements] = useState<Announcement[]>(Mock.ANNOUNCEMENTS);
  const [schedule] = useState<ScheduleItem[]>(Mock.SCHEDULE);
  
  const [exams, setExams] = useState<Exam[]>(Mock.EXAMS);
  const [gradeResults, setGradeResults] = useState<GradeResult[]>(Mock.GRADE_RESULTS);
  const [messages, setMessages] = useState<Message[]>(Mock.MESSAGES);

  const addAttendance = useCallback((record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
    };
    setAttendance(prev => {
      const filtered = prev.filter(r => 
        !(r.date === record.date && 
          r.periodId === record.periodId && 
          r.studentId === record.studentId)
      );
      return [...filtered, newRecord];
    });
  }, []);

  const getStudentAttendance = useCallback((studentId: string) => {
    return attendance.filter(r => r.studentId === studentId);
  }, [attendance]);

  const getClassAttendance = useCallback((date: string, periodId: number, sectionId: string) => {
    return attendance.filter(r => 
      r.date === date && 
      r.periodId === periodId && 
      r.sectionId === sectionId
    );
  }, [attendance]);

  const addAnnouncement = useCallback((ann: Omit<Announcement, 'id'>) => {
    const newAnn = { ...ann, id: `ann-${Date.now()}` };
    setAnnouncements(prev => [newAnn, ...prev]);
  }, []);

  const getAllUsers = useCallback(() => {
    return [...admins, ...teachers, ...students, ...parents];
  }, [admins, teachers, students, parents]);

  const addExam = useCallback((exam: Omit<Exam, 'id'>) => {
    const newExam = { ...exam, id: `exam-${Date.now()}` };
    setExams(prev => [...prev, newExam]);
  }, []);

  const updateGrade = useCallback((examId: string, studentId: string, score: number) => {
    setGradeResults(prev => {
      const existing = prev.find(r => r.examId === examId && r.studentId === studentId);
      if (existing) {
        return prev.map(r => r.id === existing.id ? { ...r, score } : r);
      } else {
        return [...prev, {
          id: `res-${Date.now()}-${Math.random()}`,
          examId,
          studentId,
          score
        }];
      }
    });
  }, []);

  const sendMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp' | 'read'>) => {
    const newMsg: Message = {
      ...msg,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    setMessages(prev => [...prev, newMsg]);
  }, []);

  const markMessagesAsRead = useCallback((senderId: string, receiverId: string) => {
    setMessages(prev => prev.map(m => 
      (m.senderId === senderId && m.receiverId === receiverId && !m.read)
        ? { ...m, read: true }
        : m
    ));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setStudents(prev => prev.filter(u => u.id !== userId));
    setTeachers(prev => prev.filter(u => u.id !== userId));
    setParents(prev => prev.filter(u => u.id !== userId));
    setAdmins(prev => prev.filter(u => u.id !== userId));
  }, []);

  const addUser = useCallback((user: User) => {
    switch(user.role) {
      case UserRole.STUDENT: setStudents(prev => [...prev, user as Student]); break;
      case UserRole.TEACHER: setTeachers(prev => [...prev, user as Teacher]); break;
      case UserRole.PARENT: setParents(prev => [...prev, user as Parent]); break;
      case UserRole.ADMIN: setAdmins(prev => [...prev, user as Admin]); break;
    }
  }, []);

  const value = useMemo(() => ({
    students, teachers, parents, admins, grades, sections, periods, attendance, announcements,
    schedule, exams, gradeResults, messages,
    addAttendance, getStudentAttendance, getClassAttendance, addAnnouncement, getAllUsers,
    addExam, updateGrade, sendMessage, markMessagesAsRead, deleteUser, addUser
  }), [
    students, teachers, parents, admins, grades, sections, periods, attendance, announcements,
    schedule, exams, gradeResults, messages,
    addAttendance, getStudentAttendance, getClassAttendance, addAnnouncement, getAllUsers,
    addExam, updateGrade, sendMessage, markMessagesAsRead, deleteUser, addUser
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
