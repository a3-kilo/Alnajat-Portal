import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, User, Bell, Shield, Lock, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'security'>('general');

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-all ${activeTab === id ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gray-100 p-3 rounded-full">
           <SettingsIcon size={32} className="text-gray-700" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-gray-800">الإعدادات</h2>
          <p className="text-gray-500">تخصيص النظام وإدارة الحساب</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <TabButton id="general" label="عام" icon={Globe} />
        <TabButton id="profile" label="الملف الشخصي" icon={User} />
        <TabButton id="security" label="الأمان" icon={Shield} />
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
        
        {activeTab === 'general' && (
          <div className="space-y-8 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block font-bold text-gray-700 mb-2">اسم المدرسة</label>
                 <input type="text" className="w-full border-gray-300 bg-gray-50 border p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" defaultValue="مدرسة النجاة الأهلية" />
               </div>
               <div>
                 <label className="block font-bold text-gray-700 mb-2">رقم الهاتف</label>
                 <input type="text" className="w-full border-gray-300 bg-gray-50 border p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" defaultValue="+966 11 234 5678" />
               </div>
             </div>
             
             <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Bell size={20} className="text-emerald-600" /> التنبيهات
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <input type="checkbox" className="w-5 h-5 accent-emerald-600" defaultChecked />
                    <div>
                      <span className="font-bold text-gray-700 block">إشعارات الغياب</span>
                      <span className="text-xs text-gray-400">إرسال تنبيه تلقائي لولي الأمر عند الغياب</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <input type="checkbox" className="w-5 h-5 accent-emerald-600" defaultChecked />
                    <div>
                       <span className="font-bold text-gray-700 block">تقارير الدرجات</span>
                       <span className="text-xs text-gray-400">إشعار عند رصد درجات جديدة</span>
                    </div>
                  </label>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-fade-in">
             <div className="flex items-center gap-6 mb-8">
               <div className="relative">
                 <img src={currentUser?.avatar} className="w-24 h-24 rounded-full border-4 border-gray-100 shadow-sm object-cover" alt="" />
                 <button className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full shadow-md hover:bg-emerald-700">
                   <SettingsIcon size={16} />
                 </button>
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-gray-800">{currentUser?.name}</h3>
                 <p className="text-gray-500">{currentUser?.email}</p>
                 <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                   {currentUser?.role}
                 </span>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block font-bold text-gray-700 mb-2">الاسم الكامل</label>
                   <input type="text" className="w-full border p-3 rounded-xl" defaultValue={currentUser?.name} />
                </div>
                <div>
                   <label className="block font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
                   <input type="email" className="w-full border p-3 rounded-xl bg-gray-100 text-gray-500" defaultValue={currentUser?.email} disabled />
                </div>
             </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3 items-start">
               <Lock className="text-orange-500 mt-1" size={20} />
               <div>
                 <h4 className="font-bold text-orange-800">تغيير كلمة المرور</h4>
                 <p className="text-sm text-orange-600">ينصح بتغيير كلمة المرور بشكل دوري للحفاظ على أمان حسابك.</p>
               </div>
             </div>
             
             <div className="max-w-md space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-2">كلمة المرور الحالية</label>
                  <input type="password" className="w-full border p-3 rounded-xl" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-2">كلمة المرور الجديدة</label>
                  <input type="password" className="w-full border p-3 rounded-xl" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-2">تأكيد كلمة المرور</label>
                  <input type="password" className="w-full border p-3 rounded-xl" placeholder="••••••••" />
                </div>
             </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t flex justify-end">
          <button className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1">
            <Save size={20} />
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;