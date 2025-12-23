import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { AttendanceStatus, Student } from '../types';
import { Save, CheckCircle, XCircle, Clock, AlertCircle, Edit, CheckSquare, XSquare } from 'lucide-react';

const AttendanceSheet: React.FC = () => {
  const { currentUser } = useAuth();
  const { grades, sections, periods, students, addAttendance, getClassAttendance } = useData();
  
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [tempStatus, setTempStatus] = useState<Record<string, AttendanceStatus>>({});
  
  // Handle grade change and clear dependent state to prevent "hanging"
  const handleGradeChange = (gradeId: string) => {
    setSelectedGrade(gradeId);
    setSelectedSection(''); // Reset section to force re-selection
    setTempStatus({}); // Reset any unsaved changes
  };

  // Filter sections based on grade (Memoized for performance)
  const activeSections = useMemo(() => {
    return sections.filter(s => s.gradeId === selectedGrade);
  }, [sections, selectedGrade]);
  
  // Filter students based on section (Memoized for performance)
  const activeStudents = useMemo(() => {
    return students.filter(s => s.sectionId === selectedSection);
  }, [students, selectedSection]);

  // Check if attendance already exists for this slot
  // Fix: Memoize existingRecords to prevent infinite loop in useEffect
  const existingRecords = useMemo(() => {
    return getClassAttendance(attendanceDate, selectedPeriod, selectedSection);
  }, [getClassAttendance, attendanceDate, selectedPeriod, selectedSection]);

  const hasRecords = existingRecords.length > 0;

  // Counters for UI
  const [counts, setCounts] = useState({ present: 0, absent: 0, late: 0, excused: 0 });

  useEffect(() => {
    // Calculate live counts
    let p = 0, a = 0, l = 0, e = 0;
    activeStudents.forEach(st => {
      const existing = existingRecords.find(r => r.studentId === st.id);
      const status = tempStatus[st.id] || (existing ? existing.status : AttendanceStatus.PRESENT); // Default visual is Present
      if (status === AttendanceStatus.PRESENT) p++;
      if (status === AttendanceStatus.ABSENT) a++;
      if (status === AttendanceStatus.LATE) l++;
      if (status === AttendanceStatus.EXCUSED) e++;
    });
    setCounts({ present: p, absent: a, late: l, excused: e });
  }, [tempStatus, activeStudents, existingRecords]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setTempStatus(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newStatus: Record<string, AttendanceStatus> = {};
    activeStudents.forEach(s => {
      newStatus[s.id] = status;
    });
    setTempStatus(newStatus);
  };

  const handleSubmit = () => {
    if (activeStudents.length === 0) return;
    
    if (hasRecords) {
      if (!window.confirm('يوجد سجل حضور مسبق لهذه الحصة. هل تريد تحديث البيانات؟')) return;
    }

    activeStudents.forEach(student => {
      // Default to PRESENT if not marked, or keep existing status if editing
      const existingRecord = existingRecords.find(r => r.studentId === student.id);
      const defaultStatus = existingRecord ? existingRecord.status : AttendanceStatus.PRESENT;
      const status = tempStatus[student.id] || defaultStatus;

      addAttendance({
        date: attendanceDate,
        periodId: selectedPeriod,
        sectionId: selectedSection,
        studentId: student.id,
        status: status,
        markedBy: currentUser?.id || 'unknown',
      });
    });
    
    // Clear temp status to reflect saved state next render
    setTempStatus({});
    alert('تم حفظ سجل الحضور بنجاح!');
  };

  const getStatusColor = (status: AttendanceStatus, isSelected: boolean) => {
    // High contrast logic
    if (!isSelected) {
      return "bg-white border-2 border-gray-200 text-gray-500 hover:border-gray-400";
    }

    switch(status) {
      case AttendanceStatus.PRESENT: return 'bg-emerald-600 text-white border-2 border-emerald-700 shadow-md ring-2 ring-emerald-200';
      case AttendanceStatus.ABSENT: return 'bg-red-600 text-white border-2 border-red-700 shadow-md ring-2 ring-red-200';
      case AttendanceStatus.LATE: return 'bg-yellow-500 text-white border-2 border-yellow-600 shadow-md ring-2 ring-yellow-200';
      case AttendanceStatus.EXCUSED: return 'bg-blue-600 text-white border-2 border-blue-700 shadow-md ring-2 ring-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CheckCircle className="text-emerald-600" />
          رصد الحضور والغياب
        </h2>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-sm text-gray-500 font-bold flex items-center gap-2">
          التاريخ: <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="border-none bg-transparent outline-none text-gray-800" />
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">الصف الدراسي</label>
          <select 
            className="w-full border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-3 outline-none shadow-sm"
            value={selectedGrade}
            onChange={e => handleGradeChange(e.target.value)}
          >
            <option value="">اختر الصف...</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">الشعبة</label>
          <select 
            className="w-full border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-3 outline-none shadow-sm"
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            disabled={!selectedGrade}
          >
            <option value="">{selectedGrade ? 'اختر الشعبة...' : 'اختر الصف أولاً'}</option>
            {activeSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">الحصة</label>
          <select 
            className="w-full border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-3 outline-none shadow-sm"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(Number(e.target.value))}
          >
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.startTime} - {p.endTime})</option>)}
          </select>
        </div>
      </div>

      {/* Student List */}
      {selectedSection && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
               <h3 className="font-bold text-gray-700 text-lg">قائمة الطلاب</h3>
               <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{activeStudents.length} طالب</span>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-2">
               <div className="px-3 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1">
                 <CheckCircle size={14} /> حاضر: {counts.present}
               </div>
               <div className="px-3 py-1 rounded bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1">
                 <XCircle size={14} /> غائب: {counts.absent}
               </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2">
               <button onClick={() => handleMarkAll(AttendanceStatus.PRESENT)} className="text-xs bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-lg font-bold flex items-center gap-1 transition-colors">
                 <CheckSquare size={14} /> تحضير الكل
               </button>
               <button onClick={() => handleMarkAll(AttendanceStatus.ABSENT)} className="text-xs bg-white border border-red-200 text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg font-bold flex items-center gap-1 transition-colors">
                 <XSquare size={14} /> تغييب الكل
               </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b">
                <tr>
                  <th className="p-4 font-bold">#</th>
                  <th className="p-4 font-bold">اسم الطالب</th>
                  <th className="p-4 font-bold text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeStudents.map((student, idx) => {
                  // Determine status: Current selection > Existing Record > Default (Present)
                  const existingRecord = existingRecords.find(r => r.studentId === student.id);
                  const currentStatus = tempStatus[student.id] || (existingRecord ? existingRecord.status : AttendanceStatus.PRESENT);
                  
                  return (
                    <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-4 font-mono text-gray-400 text-sm w-16">{idx + 1}</td>
                      <td className="p-4 flex items-center gap-3">
                        <img src={student.avatar} alt="" className="w-10 h-10 rounded-full border border-gray-100 shadow-sm" />
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{student.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{student.studentId}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {[AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE, AttendanceStatus.EXCUSED].map(status => {
                            let label = 'حاضر';
                            let icon = <CheckCircle size={16} />;
                            
                            if (status === AttendanceStatus.ABSENT) { label = 'غائب'; icon = <XCircle size={16} />; }
                            else if (status === AttendanceStatus.LATE) { label = 'متأخر'; icon = <Clock size={16} />; }
                            else if (status === AttendanceStatus.EXCUSED) { label = 'عذر'; icon = <AlertCircle size={16} />; }

                            const isSelected = currentStatus === status;

                            return (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(student.id, status)}
                                className={`
                                  flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-bold
                                  ${getStatusColor(status, isSelected)}
                                  ${isSelected ? 'transform scale-105 z-10' : 'opacity-70 hover:opacity-100'}
                                `}
                              >
                                {icon} {label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end sticky bottom-0 z-10">
            <button 
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <Save size={20} />
              {hasRecords ? 'تحديث السجل' : 'اعتماد السجل النهائي'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSheet;