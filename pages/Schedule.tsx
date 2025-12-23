import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Calendar, Clock, MapPin } from 'lucide-react';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

const Schedule: React.FC = () => {
  const { currentUser } = useAuth();
  const { schedule, periods, sections, students, grades } = useData();
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  let targetSectionIds: string[] = [];

  // Determine which schedule to show
  if (currentUser?.role === UserRole.STUDENT) {
    targetSectionIds = [(currentUser as any).sectionId];
  } else if (currentUser?.role === UserRole.TEACHER) {
    // Teacher sees all sections they teach? No, they want to see *their* schedule.
    // So filter schedule where teacherId == currentUser.id
  } else if (currentUser?.role === UserRole.PARENT) {
    const parent = currentUser as any;
    if (parent.childrenIds.length > 0 && !selectedChildId) {
      setSelectedChildId(parent.childrenIds[0]);
    }
    const child = students.find(s => s.id === selectedChildId);
    if (child) targetSectionIds = [child.sectionId];
  }

  const getCellData = (day: string, periodId: number) => {
    if (currentUser?.role === UserRole.TEACHER) {
      return schedule.find(s => s.day === day && s.periodId === periodId && s.teacherId === currentUser.id);
    } else {
      // Student/Parent
      return schedule.find(s => s.day === day && s.periodId === periodId && targetSectionIds.includes(s.sectionId));
    }
  };

  const getFullClassName = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const grade = grades.find(g => g.id === section?.gradeId);
    return section && grade ? `${grade.name} / ${section.name}` : '';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-emerald-600" />
          الجدول الدراسي الأسبوعي
        </h2>
        {currentUser?.role === UserRole.PARENT && (
          <select 
            className="border border-gray-300 p-2 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedChildId} 
            onChange={e => setSelectedChildId(e.target.value)}
          >
            {(currentUser as any).childrenIds.map((id: string) => {
              const s = students.find(st => st.id === id);
              return <option key={id} value={id}>{s?.name}</option>;
            })}
          </select>
        )}
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-emerald-800 text-white">
              <th className="p-4 border-l border-emerald-700 w-32">اليوم / الحصة</th>
              {periods.map(p => (
                <th key={p.id} className="p-4 border-l border-emerald-700 min-w-[140px]">
                  <div className="font-bold">{p.name}</div>
                  <div className="text-xs text-emerald-200 font-normal mt-1">{p.startTime} - {p.endTime}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {DAYS.map(day => (
              <tr key={day} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-gray-700 bg-gray-50 border-l">{day}</td>
                {periods.map(period => {
                  const session = getCellData(day, period.id);
                  return (
                    <td key={period.id} className="p-2 border-l border-gray-100 align-top h-24">
                      {session ? (
                        <div className="bg-emerald-50 p-2 rounded-lg h-full border border-emerald-100 flex flex-col justify-center gap-1 group hover:bg-emerald-100 transition-colors">
                          <span className="font-bold text-emerald-800 text-sm">{session.subject}</span>
                          {currentUser?.role === UserRole.TEACHER && (
                             <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 mt-1 bg-white/50 rounded px-1">
                               <MapPin size={10} />
                               {getFullClassName(session.sectionId)}
                             </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-300 text-xs flex items-center justify-center h-full">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Schedule;