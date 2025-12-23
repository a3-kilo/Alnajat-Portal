import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { UserRole, GradeResult } from '../types';
import { BookOpen, Edit2, Plus, Save, TrendingUp } from 'lucide-react';

const Grades: React.FC = () => {
  const { currentUser } = useAuth();
  const { sections, grades, students, exams, gradeResults, addExam, updateGrade, teachers } = useData();
  
  // Teacher State
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamMax, setNewExamMax] = useState(20);

  // Student/Parent State
  const [viewStudentId, setViewStudentId] = useState<string>('');

  const handleScoreChange = (studentId: string, val: string) => {
    const score = parseInt(val);
    if (!isNaN(score) && selectedExamId) {
      updateGrade(selectedExamId, studentId, score);
    }
  };

  const handleCreateExam = () => {
    if (!newExamTitle || !selectedSection || !selectedSubject) return;
    addExam({
      sectionId: selectedSection,
      subject: selectedSubject,
      title: newExamTitle,
      maxScore: newExamMax,
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddExam(false);
    setNewExamTitle('');
  };

  // TEACHER VIEW
  if (currentUser?.role === UserRole.TEACHER) {
    const teacher = currentUser as any;
    const mySections = sections.filter(s => teacher.assignedSections.includes(s.id));
    const sectionStudents = students.filter(s => s.sectionId === selectedSection);
    const sectionExams = exams.filter(e => e.sectionId === selectedSection && e.subject === selectedSubject);

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="text-emerald-600" />
          إدارة الدرجات والاختبارات
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-xl shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-1">الشعبة</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedSection} 
              onChange={e => setSelectedSection(e.target.value)}
            >
              <option value="">اختر الشعبة...</option>
              {mySections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المادة</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedSubject} 
              onChange={e => setSelectedSubject(e.target.value)}
            >
              <option value="">اختر المادة...</option>
              {teacher.subjects.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-end">
             <button 
               disabled={!selectedSection || !selectedSubject}
               onClick={() => setShowAddExam(true)}
               className="w-full bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex justify-center items-center gap-2"
             >
               <Plus size={18} /> إضافة اختبار جديد
             </button>
          </div>
        </div>

        {showAddExam && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex gap-4 items-end animate-fade-in">
             <div className="flex-1">
               <label className="text-sm font-bold text-emerald-800">عنوان الاختبار</label>
               <input type="text" value={newExamTitle} onChange={e => setNewExamTitle(e.target.value)} className="w-full border p-2 rounded" placeholder="مثال: كويز قصير" />
             </div>
             <div className="w-32">
               <label className="text-sm font-bold text-emerald-800">الدرجة العظمى</label>
               <input type="number" value={newExamMax} onChange={e => setNewExamMax(Number(e.target.value))} className="w-full border p-2 rounded" />
             </div>
             <button onClick={handleCreateExam} className="bg-emerald-600 text-white px-6 py-2 rounded font-bold">حفظ</button>
             <button onClick={() => setShowAddExam(false)} className="text-gray-500 px-4">إلغاء</button>
          </div>
        )}

        {selectedSection && selectedSubject && (
          <div className="flex gap-6 flex-col md:flex-row">
            {/* Exam List */}
            <div className="w-full md:w-1/4 bg-white rounded-xl shadow p-4 h-fit">
              <h3 className="font-bold mb-4 text-gray-700">قائمة الاختبارات</h3>
              <div className="space-y-2">
                {sectionExams.length === 0 && <p className="text-sm text-gray-400">لا يوجد اختبارات</p>}
                {sectionExams.map(exam => (
                  <button 
                    key={exam.id}
                    onClick={() => setSelectedExamId(exam.id)}
                    className={`w-full text-right p-3 rounded-lg border transition-all ${selectedExamId === exam.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'hover:bg-gray-50'}`}
                  >
                    <div className="font-bold">{exam.title}</div>
                    <div className="text-xs text-gray-500 flex justify-between mt-1">
                      <span>{exam.date}</span>
                      <span>{exam.maxScore} درجة</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Grading Table */}
            <div className="flex-1 bg-white rounded-xl shadow overflow-hidden">
               {selectedExamId ? (
                 <>
                   <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                     <h3 className="font-bold text-gray-700">رصد الدرجات: {exams.find(e => e.id === selectedExamId)?.title}</h3>
                     <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">الدرجة من {exams.find(e => e.id === selectedExamId)?.maxScore}</span>
                   </div>
                   <table className="w-full text-right">
                     <thead className="bg-gray-50 text-gray-500 text-sm">
                       <tr>
                         <th className="p-4">اسم الطالب</th>
                         <th className="p-4">الدرجة المستحقة</th>
                         <th className="p-4">الحالة</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y">
                       {sectionStudents.map(student => {
                         const result = gradeResults.find(r => r.examId === selectedExamId && r.studentId === student.id);
                         const max = exams.find(e => e.id === selectedExamId)?.maxScore || 100;
                         const isPass = (result?.score || 0) >= (max / 2);
                         return (
                           <tr key={student.id}>
                             <td className="p-4 font-medium">{student.name}</td>
                             <td className="p-4">
                               <input 
                                 type="number" 
                                 max={max}
                                 className="border p-2 rounded w-24 text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                                 value={result?.score || ''}
                                 onChange={e => handleScoreChange(student.id, e.target.value)}
                               />
                             </td>
                             <td className="p-4">
                               {result ? (
                                 <span className={`text-xs px-2 py-1 rounded ${isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                   {isPass ? 'ناجح' : 'راسب'}
                                 </span>
                               ) : <span className="text-gray-400 text-xs">غير مرصود</span>}
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </>
               ) : (
                 <div className="p-10 text-center text-gray-400">
                   <Edit2 className="mx-auto mb-2 opacity-50" size={48} />
                   <p>اختر اختباراً من القائمة لرصد الدرجات</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // STUDENT/PARENT VIEW
  let targetStudentId = currentUser?.role === UserRole.STUDENT ? currentUser.id : viewStudentId;
  
  // Set default child for parent
  if (currentUser?.role === UserRole.PARENT && !viewStudentId && (currentUser as any).childrenIds.length > 0) {
    targetStudentId = (currentUser as any).childrenIds[0];
    // We don't set state directly in render to avoid loops, handled by effect usually, but for simple var assignment it's fine
  }

  const studentExams = exams.filter(e => {
    const student = students.find(s => s.id === targetStudentId);
    return student && e.sectionId === student.sectionId;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="text-purple-600" />
          سجل الدرجات والتقارير
        </h2>
        {currentUser?.role === UserRole.PARENT && (
           <select 
             className="border border-gray-300 p-2 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
             value={viewStudentId} 
             onChange={e => setViewStudentId(e.target.value)}
           >
             {(currentUser as any).childrenIds.map((id: string) => {
               const s = students.find(st => st.id === id);
               return <option key={id} value={id}>{s?.name}</option>;
             })}
           </select>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <table className="w-full text-right">
          <thead className="bg-purple-50 text-purple-900">
            <tr>
              <th className="p-4">المادة</th>
              <th className="p-4">الاختبار</th>
              <th className="p-4">التاريخ</th>
              <th className="p-4">الدرجة</th>
              <th className="p-4">النسبة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {studentExams.map(exam => {
              const result = gradeResults.find(r => r.examId === exam.id && r.studentId === targetStudentId);
              const percentage = result ? Math.round((result.score / exam.maxScore) * 100) : 0;
              return (
                <tr key={exam.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-700">{exam.subject}</td>
                  <td className="p-4 text-gray-600">{exam.title}</td>
                  <td className="p-4 text-gray-500 text-sm">{exam.date}</td>
                  <td className="p-4">
                    {result ? (
                      <span className="font-bold text-gray-800">{result.score} / {exam.maxScore}</span>
                    ) : <span className="text-gray-400">--</span>}
                  </td>
                  <td className="p-4">
                    {result ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${percentage >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold">{percentage}%</span>
                      </div>
                    ) : <span>--</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {studentExams.length === 0 && (
          <div className="p-8 text-center text-gray-500">لا توجد اختبارات مسجلة لهذا الطالب بعد.</div>
        )}
      </div>
    </div>
  );
};

export default Grades;