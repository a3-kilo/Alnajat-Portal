import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { AttendanceStatus } from '../types';
import { CalendarCheck, Download, AlertCircle, User, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const AttendanceReport: React.FC = () => {
  const { attendance, students, sections, grades, teachers } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  // Filter attendance for the selected date
  const dailyRecords = attendance.filter(r => r.date === selectedDate);
  const presentCount = dailyRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
  const absentCount = dailyRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
  const lateCount = dailyRecords.filter(r => r.status === AttendanceStatus.LATE).length;
  
  // Get absent students list details
  const absentRecords = dailyRecords.filter(r => r.status === AttendanceStatus.ABSENT);

  const getFullClassName = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const grade = grades.find(g => g.id === section?.gradeId);
    return section && grade ? `${grade.name} / ${section.name}` : 'غير معروف';
  };

  const getTeacherName = (teacherId: string) => {
    const t = teachers.find(u => u.id === teacherId);
    return t ? t.name : 'غير معروف';
  };

  const handleExportPDF = async () => {
    const input = document.getElementById('printable-report');
    if (!input) return;

    setIsExporting(true);

    try {
      // Capture the element as an image with better scaling
      const canvas = await html2canvas(input, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Initialize PDF (A4 Portrait)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate ratio to fit width
      const ratio = pageWidth / imgWidth;
      const imgHeightInPdf = imgHeight * ratio;

      let heightLeft = imgHeightInPdf;
      let position = 0;

      // First Page
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeightInPdf);
      heightLeft -= pageHeight;

      // Add subsequent pages if content is long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeightInPdf; // Shift image up
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeightInPdf);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`تقارير_الغياب_${selectedDate}.pdf`);
    } catch (error) {
      console.error("Export failed", error);
      alert("حدث خطأ أثناء تصدير الملف");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarCheck className="text-emerald-600" />
          تقارير الحضور والغياب
        </h2>
        <div className="flex gap-2">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            className="border p-2 rounded-lg shadow-sm"
          />
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-white border text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? 'جاري التصدير...' : 'تصدير PDF'}
          </button>
        </div>
      </div>

      {/* Printable Area Wrapper */}
      <div id="printable-report" className="space-y-6 bg-white p-6 rounded-xl">
        {/* Header for PDF only (visible in UI too but looks fine) */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
           <div>
             <h1 className="text-xl font-bold text-emerald-800">بوابة النجاة التعليمية</h1>
             <p className="text-sm text-gray-500">تقرير الحضور والغياب الرسمي</p>
           </div>
           <div className="text-left">
             <p className="font-bold text-gray-700">التاريخ: {selectedDate}</p>
             <p className="text-xs text-gray-400">تم التصدير بواسطة: الإدارة</p>
           </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
           <div className="bg-blue-600 text-white p-6 rounded-xl shadow-sm print:shadow-none">
             <p className="text-blue-100 font-bold text-sm">إجمالي المسجلين</p>
             <p className="text-4xl font-bold mt-2">{dailyRecords.length}</p>
           </div>
           <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
             <p className="text-gray-500 font-bold text-sm">حضور</p>
             <p className="text-3xl font-bold mt-2 text-emerald-600">{presentCount}</p>
           </div>
           <div className="bg-red-50 p-6 rounded-xl border border-red-100">
             <p className="text-gray-500 font-bold text-sm">غياب</p>
             <p className="text-3xl font-bold mt-2 text-red-600">{absentCount}</p>
           </div>
           <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
             <p className="text-gray-500 font-bold text-sm">تأخير</p>
             <p className="text-3xl font-bold mt-2 text-yellow-600">{lateCount}</p>
           </div>
        </div>

        {/* Detailed List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
               <AlertCircle size={18} className="text-red-500" />
               تفاصيل الغياب
            </h3>
          </div>
          <table className="w-full text-right">
            <thead className="text-gray-500 bg-white border-b">
              <tr>
                <th className="p-4">اسم الطالب</th>
                <th className="p-4">الصف / الشعبة</th>
                <th className="p-4">الحصة</th>
                <th className="p-4">قام بالرصد</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {absentRecords.map(record => {
                const student = students.find(s => s.id === record.studentId);
                return (
                  <tr key={record.id} className="hover:bg-red-50">
                    <td className="p-4 font-bold text-gray-800 flex items-center gap-2">
                       {/* Don't show avatars in PDF usually as they might be broken links, but html2canvas handles them if CORS allowed. We'll keep them for now. */}
                       <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                         <img src={student?.avatar} className="w-full h-full object-cover" alt="" />
                       </div>
                       {student?.name}
                    </td>
                    <td className="p-4 text-gray-700 font-medium">{getFullClassName(record.sectionId)}</td>
                    <td className="p-4 text-gray-700 font-bold">الحصة {record.periodId}</td>
                    <td className="p-4 text-sm text-gray-600 flex items-center gap-2">
                      <User size={14} />
                      {getTeacherName(record.markedBy)}
                    </td>
                  </tr>
                );
              })}
              {absentRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-emerald-600 font-bold">
                    لا يوجد غياب مسجل لهذا اليوم 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;