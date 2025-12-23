
import { UserRole, Student, Teacher, Parent, Admin, Grade, Section, Period, Announcement, AttendanceRecord, AttendanceStatus, ScheduleItem, Exam, GradeResult, Message } from '../types';

// Constants
export const GRADES: Grade[] = [
  { id: 'g6', name: 'الصف السادس' },
  { id: 'g7', name: 'الصف السابع' },
  { id: 'g8', name: 'الصف الثامن' },
  { id: 'g9', name: 'الصف التاسع' },
];

export const SECTIONS: Section[] = [];
GRADES.forEach(g => {
  for (let i = 1; i <= 8; i++) {
    SECTIONS.push({
      id: `${g.id}-s${i}`,
      name: `شعبة ${i}`,
      gradeId: g.id,
    });
  }
});

// School periods
export const PERIODS: Period[] = [
  { id: 1, name: 'الحصة الأولى', startTime: '07:30', endTime: '08:15' },
  { id: 2, name: 'الحصة الثانية', startTime: '08:20', endTime: '09:05' },
  { id: 3, name: 'الحصة الثالثة', startTime: '09:30', endTime: '10:15' },
  { id: 4, name: 'الحصة الرابعة', startTime: '10:20', endTime: '11:05' },
  { id: 5, name: 'الحصة الخامسة', startTime: '11:10', endTime: '11:55' },
  { id: 6, name: 'الحصة السادسة', startTime: '12:20', endTime: '13:05' },
  { id: 7, name: 'الحصة السابعة', startTime: '13:10', endTime: '13:55' },
];

export const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
export const SUBJECTS = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'التربية الإسلامية', 'الاجتماعيات', 'الحاسوب', 'التربية الفنية'];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generate Users
export const STUDENTS: Student[] = [];
export const PARENTS: Parent[] = [];
export const TEACHERS: Teacher[] = [];
export const ADMINS: Admin[] = [];

// 1. Create Parents
for (let i = 0; i < 300; i++) {
  const isMale = Math.random() > 0.1; 
  const firstName = getRandomElement(isMale ? ['أحمد', 'محمد', 'علي', 'عمر', 'خالد'] : ['فاطمة', 'نورة', 'سارة', 'ريم']);
  const lastName = getRandomElement(['العتيبي', 'المطيري', 'القحطاني', 'الدوسري', 'العنزي']);
  
  PARENTS.push({
    id: `parent-${i}`,
    name: `${firstName} ${lastName}`,
    email: `p${i}@alnajat.edu`,
    role: UserRole.PARENT,
    childrenIds: [],
    avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
  });
}

// 2. Create Students linked to Parents
let studentCounter = 1000;
SECTIONS.forEach(section => {
  for (let i = 0; i < 30; i++) {
    const parent = getRandomElement(PARENTS);
    const firstName = getRandomElement(['بدر', 'سلطان', 'عبدالعزيز', 'فيصل', 'فهد', 'مشعل']); 
    const lastName = parent.name.split(' ').slice(1).join(' ');

    const student: Student = {
      id: `student-${studentCounter}`,
      name: `${firstName} ${lastName}`,
      email: `s${studentCounter}@alnajat.edu`,
      role: UserRole.STUDENT,
      studentId: `${studentCounter}`,
      gradeId: section.gradeId,
      sectionId: section.id,
      parentId: parent.id,
      avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&color=fff`,
    };

    STUDENTS.push(student);
    parent.childrenIds.push(student.id);
    studentCounter++;
  }
});

// 3. Create Teachers
for (let i = 0; i < 20; i++) {
  const firstName = getRandomElement(['محمد', 'إبراهيم', 'أحمد', 'ياسين']);
  const lastName = getRandomElement(['الشمري', 'العجمي', 'الرشيدي']);
  const subject = SUBJECTS[i % SUBJECTS.length];
  
  const assignedSections = SECTIONS.sort(() => 0.5 - Math.random()).slice(0, 8).map(s => s.id);

  TEACHERS.push({
    id: `teacher-${i}`,
    name: `أ. ${firstName} ${lastName}`,
    email: `t${i}@alnajat.edu`,
    role: UserRole.TEACHER,
    subjects: [subject],
    assignedSections: assignedSections,
    avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=0D9488&color=fff`,
  });
}

// 4. Create Admin
ADMINS.push({
  id: 'admin-1',
  name: 'أ. شريف محمد السباعي',
  email: 'admin@alnajat.edu',
  role: UserRole.ADMIN,
  avatar: 'https://ui-avatars.com/api/?name=Sherif+Sebaei&background=000&color=fff',
});

// ==========================================
// OVERRIDE DEMO ACCOUNTS
// ==========================================

// 1. Parent: مجدي العمري
PARENTS[0].name = "مجدي العمري";

// 2. Student: أمير مجدي العمري
STUDENTS[0].name = "أمير مجدي العمري";
STUDENTS[0].parentId = PARENTS[0].id;
STUDENTS[0].gradeId = 'g9';
STUDENTS[0].sectionId = 'g9-s4';

// 3. Teacher: أ. محمد سعد (حاسوب)
TEACHERS[0].name = "أ. محمد سعد";
TEACHERS[0].subjects = ["الحاسوب"];
TEACHERS[0].avatar = "https://ui-avatars.com/api/?name=Mohamed+Saad&background=0D9488&color=fff";
if (!TEACHERS[0].assignedSections.includes('g9-s4')) {
  TEACHERS[0].assignedSections.push('g9-s4');
}

// ==========================================

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'تحديث الجداول الدراسية',
    content: 'تم تحديث الجدول اليومي ليشمل 7 حصص دراسية مع فترات الصلاة والفسحة.',
    authorId: 'admin-1',
    date: new Date().toISOString(),
    targetRoles: [UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER],
  }
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [];
export const SCHEDULE: ScheduleItem[] = [];
SECTIONS.forEach(section => {
  DAYS.forEach(day => {
    PERIODS.forEach(period => {
      if (Math.random() > 0.1) {
        const teacher = getRandomElement(TEACHERS);
        SCHEDULE.push({
          id: `sch-${section.id}-${day}-${period.id}`,
          day: day,
          periodId: period.id,
          sectionId: section.id,
          subject: teacher.subjects[0],
          teacherId: teacher.id
        });
      }
    });
  });
});

export const EXAMS: Exam[] = [];
export const GRADE_RESULTS: GradeResult[] = [];
export const MESSAGES: Message[] = [
  {
    id: 'msg-1',
    senderId: 'teacher-0',
    receiverId: 'parent-0',
    content: 'السلام عليكم، نود إبلاغكم بتميز الطالب أمير في مادة الحاسوب.',
    timestamp: new Date().toISOString(),
    read: false
  }
];
