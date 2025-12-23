import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { GraduationCap, Lock, Users, UserCheck, Code } from 'lucide-react'; // Changed Baby to Users
import { ADMINS, TEACHERS, STUDENTS, PARENTS } from '../data/mockData';

const Login: React.FC = () => {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleDemoLogin = (role: UserRole) => {
    let email = '';
    switch(role) {
      case UserRole.ADMIN: email = ADMINS[0].email; break;
      case UserRole.TEACHER: email = TEACHERS[0].email; break;
      case UserRole.STUDENT: email = STUDENTS[0].email; break;
      case UserRole.PARENT: email = PARENTS[0].email; break;
    }
    
    const success = login(email, role);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 to-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row rtl:flex-row-reverse relative">
        
        {/* Visual Side */}
        <div className="md:w-1/2 bg-emerald-800 p-10 flex flex-col justify-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
          <div className="relative z-10 text-center md:text-right flex flex-col items-center md:items-start">
            
            {/* Logo - Circular Style */}
            <div className="mb-8 mx-auto md:mx-0 relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl bg-white flex items-center justify-center">
                <img 
                  src="https://i.ibb.co/wf3KFqQ/images-3-1.jpg" 
                  alt="شعار مدارس النجاة" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">بوابة النجاة</h1>
            <p className="text-xl text-emerald-100 mb-8">منصة تعليمية ذكية متكاملة لإدارة المستقبل.</p>
            <ul className="space-y-3 text-sm text-emerald-200">
              <li className="flex items-center gap-2"><UserCheck size={16}/> تسجيل حضور ذكي</li>
              <li className="flex items-center gap-2"><Lock size={16}/> بيانات آمنة وموثوقة</li>
              <li className="flex items-center gap-2"><Users size={16}/> تواصل فعال بين الجميع</li>
            </ul>
          </div>
          
          {/* Footer Credits - Made Bigger */}
          <div className="absolute bottom-6 left-0 right-0 text-center">
             <div className="inline-block bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                <p className="text-emerald-300 font-bold text-sm flex items-center justify-center gap-2">
                  <Code size={16} />
                  عمل الطالب: أمير مجدي العمُري 9/4
                </p>
             </div>
          </div>
        </div>

        {/* Login Options Side */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">تسجيل الدخول</h2>
          <p className="text-gray-500 text-center mb-8">اختر نوع الحساب للمتابعة (تجريبي)</p>
          
          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => handleDemoLogin(UserRole.ADMIN)} 
              className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group">
              <div className="bg-purple-100 p-3 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Lock size={24} />
              </div>
              <div className="mr-4 text-right">
                <h3 className="font-bold text-gray-800">الإدارة</h3>
                <p className="text-xs text-gray-500">تحكم كامل بالنظام</p>
              </div>
            </button>

            <button onClick={() => handleDemoLogin(UserRole.TEACHER)}
              className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group">
              <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <UserCheck size={24} />
              </div>
              <div className="mr-4 text-right">
                <h3 className="font-bold text-gray-800">المعلم</h3>
                <p className="text-xs text-gray-500">رصد الحضور والدرجات</p>
              </div>
            </button>

            <button onClick={() => handleDemoLogin(UserRole.STUDENT)}
              className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group">
              <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <GraduationCap size={24} />
              </div>
              <div className="mr-4 text-right">
                <h3 className="font-bold text-gray-800">الطالب</h3>
                <p className="text-xs text-gray-500">متابعة الدروس والواجبات</p>
              </div>
            </button>

            <button onClick={() => handleDemoLogin(UserRole.PARENT)}
              className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group">
              <div className="bg-orange-100 p-3 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <div className="mr-4 text-right">
                <h3 className="font-bold text-gray-800">ولي الأمر</h3>
                <p className="text-xs text-gray-500">متابعة الأبناء</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;