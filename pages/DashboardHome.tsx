import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserRole, AttendanceStatus } from '../types';
import { Users, UserCheck, TrendingUp, AlertTriangle, Calendar, Clock, BookOpen, Activity, Star, ArrowUpRight, Bell, Send, X, ListFilter } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, colorClass, subtext, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 ${colorClass} opacity-5 rounded-bl-full transition-transform group-hover:scale-110`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
        <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
      </div>
      {trend && (
        <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          {trend} <ArrowUpRight size={12} className="mr-1" />
        </span>
      )}
    </div>
    <div className="relative z-10">
      <h3 className="text-3xl font-black text-gray-800 mb-1">{value}</h3>
      <p className="text-gray-500 font-medium text-sm">{title}</p>
      {subtext && <p className="text-xs text-gray-400 mt-3 border-t pt-2 border-gray-100">{subtext}</p>}
    </div>
  </div>
);

const ActivityItem = ({ title, time, type, compact = false }: any) => (
  <div className={`flex gap-4 items-start ${compact ? 'pb-3 mb-3' : 'pb-4 mb-4'} border-b border-gray-50 last:border-0 last:pb-0 last:mb-0 group`}>
    <div className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
      type === 'alert' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
      type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
      'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
    }`}></div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-bold text-gray-700 truncate group-hover:text-emerald-700 transition-colors leading-tight">{title}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{time}</p>
    </div>
  </div>
);

const DashboardHome: React.FC = () => {
  const { currentUser } = useAuth();
  const { students, teachers, attendance, announcements, exams, addAnnouncement } = useData();
  
  // States
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<string>('ALL');

  // Dynamic Recent Activities calculation
  const allActivities = useMemo(() => {
    const activities: any[] = [];

    // 1. Process Attendance (Absences and Lates)
    attendance
      .filter(a => a.status === AttendanceStatus.ABSENT || a.status === AttendanceStatus.LATE)
      .forEach(a => {
        const student = students.find(s => s.id === a.studentId);
        activities.push({
          id: a.id,
          title: `تسجيل ${a.status === AttendanceStatus.ABSENT ? 'غياب' : 'تأخر'} لـ ${student?.name || 'طالب'}`,
          time: new Date(a.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          type: a.status === AttendanceStatus.ABSENT ? 'alert' : 'info',
          timestamp: new Date(a.timestamp).getTime()
        });
      });

    // 2. Process Announcements
    announcements.forEach(ann => {
      activities.push({
        id: ann.id,
        title: `إعلان: ${ann.title}`,
        time: new Date(ann.date).toLocaleDateString('ar-SA'),
        type: 'info',
        timestamp: new Date(ann.date).getTime()
      });
    });

    // 3. Process Exams
    exams.forEach(ex => {
      activities.push({
        id: ex.id,
        title: `إضافة اختبار ${ex.title}`,
        time: new Date(ex.date).toLocaleDateString('ar-SA'),
        type: 'success',
        timestamp: new Date(ex.date).getTime()
      });
    });

    // Sort by timestamp descending
    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }, [attendance, announcements, exams, students]);

  const displayedActivities = useMemo(() => allActivities.slice(0, 4), [allActivities]);

  if (!currentUser) return null;

  const handleBroadcastSubmit = () => {
    if(!broadcastTitle || !broadcastContent) return;
    
    let targets: UserRole[] = [];
    if (broadcastTarget === 'ALL') targets = [UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER];
    if (broadcastTarget === 'PARENTS') targets = [UserRole.PARENT];
    if (broadcastTarget === 'TEACHERS') targets = [UserRole.TEACHER];
    if (broadcastTarget === 'STUDENTS') targets = [UserRole.STUDENT];

    addAnnouncement({
      title: broadcastTitle,
      content: broadcastContent,
      authorId: currentUser.id,
      date: new Date().toISOString(),
      targetRoles: targets
    });

    alert('تم إرسال التنبيه الجماعي بنجاح!');
    setShowBroadcastModal(false);
    setBroadcastTitle('');
    setBroadcastContent('');
  };

  // Stats calculation
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today);
  const presentCount = todayAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
  const absentCount = todayAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
  const attendanceRate = todayAttendance.length > 0 ? Math.round((presentCount / todayAttendance.length) * 100) : 0;

  // Activities Modal Component
  const ActivitiesModal = () => (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-xl text-gray-800 flex items-center gap-3">
            <Activity className="text-blue-600" /> سجل النشاطات الكامل
          </h3>
          <button onClick={() => setShowActivitiesModal(false)} className="bg-white p-2 rounded-full border shadow-sm hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-1">
          {allActivities.length > 0 ? (
            allActivities.map(activity => (
              <ActivityItem 
                key={activity.id} 
                title={activity.title} 
                time={activity.time} 
                type={activity.type} 
              />
            ))
          ) : (
            <div className="text-center py-20 text-gray-400">لا توجد نشاطات مسجلة</div>
          )}
        </div>
        <div className="p-5 border-t bg-gray-50 flex justify-center">
           <button onClick={() => setShowActivitiesModal(false)} className="px-10 py-2.5 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-lg">
             إغلاق النافذة
           </button>
        </div>
      </div>
    </div>
  );

  const RecentActivitySidebar = () => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col min-h-[340px]">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-black text-gray-800 flex items-center gap-2">
          <Activity size={20} className="text-blue-500" />
          النشاط الحديث
        </h3>
        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">آخر 4 أحداث</span>
      </div>
      
      <div className="flex-1">
        {displayedActivities.map(activity => (
          <ActivityItem 
            key={activity.id} 
            title={activity.title} 
            time={activity.time} 
            type={activity.type}
            compact={true}
          />
        ))}
        {displayedActivities.length === 0 && (
          <p className="text-center py-10 text-gray-400 text-sm font-medium">لا يوجد نشاط مسجل مؤخراً</p>
        )}
      </div>

      {allActivities.length > 4 && (
        <button 
          onClick={() => setShowActivitiesModal(true)}
          className="mt-4 w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-black rounded-2xl border border-gray-100 transition-all flex items-center justify-center gap-2 group"
        >
          <ListFilter size={14} className="group-hover:rotate-12 transition-transform" />
          عرض المزيد من النشاطات
        </button>
      )}
    </div>
  );

  const AdminView = () => (
    <div className="space-y-8 animate-fade-in relative">
      {/* Modals */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in border border-gray-200 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                <Bell className="text-orange-500" /> إرسال تنبيه جماعي
              </h3>
              <button onClick={() => setShowBroadcastModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">عنوان التنبيه</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-2xl p-3.5 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-gray-50 font-medium"
                  placeholder="مثال: تعليق الدراسة غداً"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نص الرسالة</label>
                <textarea 
                  className="w-full border border-gray-200 rounded-2xl p-3.5 focus:ring-2 focus:ring-emerald-500 outline-none h-32 text-gray-900 bg-gray-50 font-medium leading-relaxed"
                  placeholder="اكتب تفاصيل التنبيه هنا..."
                  value={broadcastContent}
                  onChange={e => setBroadcastContent(e.target.value)}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الفئة المستهدفة</label>
                <select 
                  className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 font-black"
                  value={broadcastTarget}
                  onChange={e => setBroadcastTarget(e.target.value)}
                >
                  <option value="ALL">الجميع (طلاب، أولياء أمور، معلمين)</option>
                  <option value="PARENTS">أولياء الأمور فقط</option>
                  <option value="TEACHERS">المعلمين فقط</option>
                  <option value="STUDENTS">الطلاب فقط</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowBroadcastModal(false)} className="px-6 py-3 text-gray-600 font-black hover:bg-gray-200 rounded-2xl transition-colors">إلغاء</button>
              <button onClick={handleBroadcastSubmit} className="px-8 py-3 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-lg shadow-orange-200">
                <Send size={18} /> إرسال الآن
              </button>
            </div>
          </div>
        </div>
      )}
      {showActivitiesModal && <ActivitiesModal />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="إجمالي الطلاب" 
          value={totalStudents} 
          icon={Users} 
          colorClass="bg-blue-500" 
          subtext="موزعين على 4 صفوف دراسية"
          trend="+12%"
        />
        <StatCard 
          title="نسبة الحضور اليوم" 
          value={`${attendanceRate}%`} 
          icon={TrendingUp} 
          colorClass="bg-emerald-500" 
          subtext={`${presentCount} حاضر • ${absentCount} غائب`}
          trend={attendanceRate > 90 ? "ممتاز" : "متوسط"}
        />
        <StatCard 
          title="الكادر التعليمي" 
          value={totalTeachers} 
          icon={BookOpen} 
          colorClass="bg-purple-500" 
          subtext="جميعهم نشطون حالياً"
        />
        <StatCard 
          title="تنبيهات الغياب" 
          value={absentCount} 
          icon={AlertTriangle} 
          colorClass="bg-orange-500" 
          subtext="طلاب تغيبوا اليوم بدون عذر"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                <Clock size={24} className="text-emerald-600" />
                آخر الإعلانات والتعاميم
              </h3>
              <Link to="/settings" className="text-xs text-emerald-600 hover:underline font-black">إدارة الإعلانات</Link>
            </div>
            <div className="space-y-4">
              {announcements.map(ann => (
                <div key={ann.id} className="p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border-r-4 border-emerald-500 group">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-gray-800 text-lg group-hover:text-emerald-700 transition-colors">{ann.title}</h4>
                    <span className="text-[10px] font-black bg-white px-2 py-1 rounded text-gray-400 shadow-sm border">
                      {new Date(ann.date).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed font-medium">{ann.content}</p>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-20 text-gray-400 font-black">لا توجد إعلانات حالياً</div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-black text-xl text-gray-800 mb-6">الوصول السريع</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/attendance-report" className="flex flex-col items-center justify-center p-6 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-600 hover:text-white transition-all duration-300 hover:-translate-y-1 group border border-blue-100/50">
                <Calendar size={28} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-black text-xs">تقارير الغياب</span>
              </Link>
              <Link to="/users" className="flex flex-col items-center justify-center p-6 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all duration-300 hover:-translate-y-1 group border border-emerald-100/50">
                <UserCheck size={28} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-black text-xs">المستخدمين</span>
              </Link>
              
              <button 
                onClick={() => setShowBroadcastModal(true)}
                className="flex flex-col items-center justify-center p-6 bg-orange-50 text-orange-700 rounded-2xl hover:bg-orange-600 hover:text-white transition-all duration-300 hover:-translate-y-1 group border border-orange-100/50"
              >
                <Bell size={28} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-black text-xs">تنبيه جماعي</span>
              </button>

              <Link to="/settings" className="flex flex-col items-center justify-center p-6 bg-gray-50 text-gray-700 rounded-2xl hover:bg-gray-800 hover:text-white transition-all duration-300 hover:-translate-y-1 group border border-gray-100">
                <Activity size={28} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-black text-xs">النظام</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
           {/* New Sidebar Activity Widget */}
           <RecentActivitySidebar />

           <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-7 rounded-3xl shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full transition-transform group-hover:scale-125"></div>
             <div className="relative z-10">
               <h3 className="font-black text-xl mb-3">المساعد الذكي</h3>
               <p className="text-indigo-100/80 text-sm mb-6 leading-relaxed">هل تحتاج مساعدة في تحليل بيانات الغياب اليوم؟ اسأل ذكاء النجاة.</p>
               <Link to="/ai-assistant" className="block w-full bg-white text-indigo-900 text-center py-3 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-lg active:scale-95">
                 تحدث الآن
               </Link>
             </div>
             <Star className="absolute -bottom-6 -left-6 text-white opacity-10 rotate-12" size={120} />
           </div>
        </div>
      </div>
    </div>
  );

  const TeacherView = () => (
    <div className="space-y-8 animate-fade-in">
      {showActivitiesModal && <ActivitiesModal />}
      <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400"></div>
        <div className="flex flex-col md:flex-row justify-between items-center relative z-10">
          <div>
            <h1 className="text-4xl font-black text-gray-800 mb-2 tracking-tight">صباح الخير، {currentUser.name} 👋</h1>
            <p className="text-gray-500 text-lg">لديك <span className="font-black text-emerald-600">{(currentUser as any).assignedSections?.length} شعب</span> مكلف بالإشراف عليها.</p>
          </div>
          <div className="mt-8 md:mt-0 flex gap-4">
            <Link to="/take-attendance" className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 hover:-translate-y-1 flex items-center gap-2">
              <UserCheck size={20} />
              رصد الحضور
            </Link>
            <Link to="/schedule" className="bg-white border-2 border-gray-100 text-gray-700 px-8 py-4 rounded-2xl font-black hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center gap-2 shadow-sm">
              <Calendar size={20} />
              جدولي
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[450px]">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-2xl text-gray-800">جدول الحصص اليوم</h3>
              <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full">{new Date().toLocaleDateString('ar-SA')}</span>
           </div>
           <div className="space-y-5">
             {[1, 2, 3, 4].map((p, idx) => (
               <div key={p} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100 group">
                 <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-black text-gray-700 shadow-sm border group-hover:scale-110 transition-transform">{p}</div>
                   <div>
                      <p className="font-black text-gray-800 text-lg tracking-tight">الحصة المجدولة {p}</p>
                      <p className="text-sm text-gray-500 font-medium">مراجعة بيانات الطلاب والتحصيل</p>
                   </div>
                 </div>
                 <div className="text-right">
                    <span className={`text-xs px-3 py-1.5 rounded-xl font-black tracking-wide ${idx === 0 ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-200 text-gray-600'}`}>
                      {idx === 0 ? 'جارية الآن' : 'في انتظار البدء'}
                    </span>
                 </div>
               </div>
             ))}
           </div>
         </div>

         <div className="space-y-6">
           <RecentActivitySidebar />

           <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
             <h3 className="font-black text-xl text-gray-800 mb-6 flex items-center gap-2">
                <Bell size={20} className="text-orange-500" />
                إعلانات الإدارة
             </h3>
             {announcements.filter(a => a.targetRoles.includes(UserRole.TEACHER)).slice(0, 2).map(ann => (
               <div key={ann.id} className="mb-6 last:mb-0">
                 <div className="flex items-center gap-2 mb-3">
                   <h4 className="font-black text-gray-800 text-sm">{ann.title}</h4>
                 </div>
                 <p className="text-xs text-gray-600 bg-orange-50/50 p-5 rounded-2xl border border-orange-100 leading-relaxed font-medium">
                   {ann.content}
                 </p>
               </div>
             ))}
             {announcements.filter(a => a.targetRoles.includes(UserRole.TEACHER)).length === 0 && (
               <p className="text-center text-gray-400 py-8 text-sm font-medium">لا توجد إعلانات جديدة</p>
             )}
           </div>
         </div>
      </div>
    </div>
  );

  const StudentParentView = () => (
    <div className="space-y-8 animate-fade-in">
      {showActivitiesModal && <ActivitiesModal />}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-emerald-50/50 to-transparent"></div>
        <div className="relative z-10">
          <div className="inline-block p-6 rounded-[2rem] bg-white shadow-xl mb-8 border border-emerald-50">
             <UserCheck size={56} className="text-emerald-600" />
          </div>
          <h2 className="text-4xl font-black text-gray-800 mb-4 tracking-tight">
            {currentUser.role === UserRole.PARENT ? 'بوابة ولي الأمر' : 'ملفي الدراسي'}
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto text-xl font-medium leading-relaxed">
            منصة موحدة لمتابعة التحصيل الدراسي، الحضور، والتواصل المباشر مع المعلمين.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/schedule" className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group relative overflow-hidden">
          <Calendar size={140} className="absolute -right-10 -bottom-10 text-white opacity-10 group-hover:rotate-12 transition-transform duration-500" />
          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-3">جدول الحصص</h3>
            <p className="text-blue-100/80 font-medium text-lg">عرض الجدول الدراسي والمواعيد اليومية</p>
            <div className="mt-10 inline-flex items-center gap-2 bg-white/20 px-6 py-3 rounded-2xl text-sm font-black backdrop-blur-md hover:bg-white/30 transition-colors">
              عرض الجدول <ArrowUpRight size={18} />
            </div>
          </div>
        </Link>
        
        <Link to="/grades" className="bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group relative overflow-hidden">
          <BookOpen size={140} className="absolute -right-10 -bottom-10 text-white opacity-10 group-hover:rotate-12 transition-transform duration-500" />
          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-3">الدرجات والتقارير</h3>
            <p className="text-purple-100/80 font-medium text-lg">النتائج، الاختبارات، والتقارير الفصلية</p>
            <div className="mt-10 inline-flex items-center gap-2 bg-white/20 px-6 py-3 rounded-2xl text-sm font-black backdrop-blur-md hover:bg-white/30 transition-colors">
              عرض النتائج <ArrowUpRight size={18} />
            </div>
          </div>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
           <h3 className="font-black text-2xl text-gray-800 mb-8 flex items-center gap-3">
              <Bell size={28} className="text-orange-500" />
              تنبيهات هامة
           </h3>
           <div className="space-y-5">
             {announcements.filter(a => a.targetRoles.includes(currentUser.role)).map(ann => (
               <div key={ann.id} className="p-6 bg-orange-50/40 text-orange-900 rounded-3xl border border-orange-100/50 flex gap-5 items-start group hover:bg-orange-50 transition-all">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-orange-600 group-hover:scale-110 transition-transform">
                   <Bell size={24} />
                 </div>
                 <div>
                   <strong className="block mb-2 text-xl font-black tracking-tight">{ann.title}</strong>
                   <span className="text-gray-600 font-medium leading-relaxed text-lg">{ann.content}</span>
                   <p className="text-[10px] mt-3 font-black text-gray-400 uppercase tracking-widest">{new Date(ann.date).toLocaleDateString('ar-SA')}</p>
                 </div>
               </div>
             ))}
             {announcements.filter(a => a.targetRoles.includes(currentUser.role)).length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-400 font-black">لا توجد تنبيهات جديدة حالياً.</p>
                </div>
             )}
           </div>
        </div>

        <div className="space-y-6">
           <RecentActivitySidebar />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto pb-20">
      {currentUser.role === UserRole.ADMIN && <AdminView />}
      {currentUser.role === UserRole.TEACHER && <TeacherView />}
      {(currentUser.role === UserRole.STUDENT || currentUser.role === UserRole.PARENT) && <StudentParentView />}
    </div>
  );
};

export default DashboardHome;