
import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  BookOpen, 
  MessageSquare, 
  LogOut,
  Settings,
  Code,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { messages } = useData();
  const location = useLocation();

  if (!currentUser) return null;

  const isActive = (path: string) => location.pathname === path;

  // Calculate unread messages count
  const unreadTotal = useMemo(() => {
    return messages.filter(m => m.receiverId === currentUser.id && !m.read).length;
  }, [messages, currentUser.id]);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const MenuItem = ({ to, icon: Icon, label, badge }: { to: string, icon: any, label: string, badge?: number }) => {
    const active = isActive(to);
    return (
      <Link 
        to={to} 
        className={`
          flex items-center gap-3 px-4 py-3 mx-3 mb-1 rounded-xl transition-all duration-200 group relative overflow-hidden
          ${active 
            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/20 font-bold translate-x-[-4px]" 
            : "text-emerald-100/80 hover:bg-white/10 hover:text-white hover:translate-x-[-4px]"
          }
        `}
      >
        <Icon size={20} className={`${active ? "text-white" : "text-emerald-300/80 group-hover:text-emerald-200"} transition-colors`} />
        <span className="relative z-10 flex-1">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="relative z-10 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-sm">
            {badge > 9 ? '+9' : badge}
          </span>
        )}
        {active && <div className="absolute right-0 top-0 h-full w-1 bg-white/20"></div>}
      </Link>
    );
  };

  return (
    <>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent; 
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1); 
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3); 
        }
      `}</style>
      <div className="w-64 h-screen fixed right-0 top-0 flex flex-col shadow-2xl z-50 bg-[#1e293b] text-white border-l border-white/5">
        {/* Header & Logo */}
        <div className="p-6 pb-8 flex flex-col items-center justify-center border-b border-white/10 relative shrink-0">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
          
          <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-white/20 to-transparent mb-3 shadow-xl">
             <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-emerald-500/50">
               <img 
                 src="https://i.ibb.co/wf3KFqQ/images-3-1.jpg" 
                 alt="شعار النجاة" 
                 className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
               />
             </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-wide text-white drop-shadow-sm">بوابة النجاة</h1>
            <p className="text-[11px] text-emerald-400 uppercase tracking-widest mt-1 font-black">مدرسة النجاة السالمية</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 space-y-1 sidebar-scroll">
          <div className="px-4 mb-2 text-xs font-bold text-emerald-400/50 uppercase tracking-wider">القائمة الرئيسية</div>
          
          <MenuItem to="/" icon={LayoutDashboard} label="لوحة التحكم" />
          
          {isAdmin && (
            <>
              <MenuItem to="/users" icon={Users} label="إدارة الحسابات" />
              <MenuItem to="/attendance-report" icon={CalendarCheck} label="تقارير الحضور" />
              <MenuItem to="/ai-assistant" icon={Sparkles} label="مستشار المدير" />
              <MenuItem to="/settings" icon={Settings} label="الإعدادات" />
            </>
          )}

          {currentUser.role === UserRole.TEACHER && (
            <>
              <MenuItem to="/take-attendance" icon={CalendarCheck} label="رصد الحصة" />
              <MenuItem to="/schedule" icon={BookOpen} label="الجدول الدراسي" />
              <MenuItem to="/ai-assistant" icon={Sparkles} label="المساعد الذكي" />
            </>
          )}

          {(currentUser.role === UserRole.STUDENT || currentUser.role === UserRole.PARENT) && (
            <>
               <MenuItem to="/schedule" icon={CalendarDays} label="جدول الحصص" />
               <MenuItem to="/grades" icon={BookOpen} label="الدرجات والنتائج" />
               <MenuItem to="/ai-assistant" icon={Sparkles} label="المساعد الذكي" />
            </>
          )}

          <div className="px-4 mt-6 mb-2 text-xs font-bold text-emerald-400/50 uppercase tracking-wider">التواصل والدردشة</div>
          <MenuItem to="/chat" icon={MessageSquare} label="الرسائل" badge={unreadTotal} />
        </div>

        {/* User Footer */}
        <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-white/5 shrink-0">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="relative">
              <img src={currentUser.avatar} alt="User" className="w-9 h-9 rounded-full border border-emerald-500/50 shadow-sm" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-emerald-900 rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-gray-100">{currentUser.name}</p>
              <p className="text-[10px] text-emerald-400 truncate uppercase font-black">
                {currentUser.role === UserRole.ADMIN ? 'مدير النظام' : 
                 currentUser.role === UserRole.TEACHER ? 'معلم' :
                 currentUser.role === UserRole.STUDENT ? 'طالب' : 'ولي أمر'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 text-red-300/80 hover:text-red-200 hover:bg-red-500/10 w-full py-2 rounded-lg transition-all text-xs font-bold mb-3"
          >
            <LogOut size={14} />
            <span>تسجيل الخروج</span>
          </button>
          
          <div className="pt-3 border-t border-white/5 text-center">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-emerald-950/30 rounded-full border border-emerald-500/20 shadow-sm">
              <Code size={12} className="text-emerald-400" />
              <p className="text-emerald-300 font-bold text-[10px] tracking-wide">
                أمير مجدي العمُري 9/4
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
