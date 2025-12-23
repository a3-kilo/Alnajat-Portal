import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { UserRole, User } from '../types';
import { Trash2, UserPlus, Search, Shield, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const Users: React.FC = () => {
  const { getAllUsers, deleteUser, addUser } = useData();
  const [activeTab, setActiveTab] = useState<UserRole>(UserRole.STUDENT);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.STUDENT);

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Optimize filtering
  const filteredUsers = useMemo(() => {
    const allUsers = getAllUsers();
    return allUsers
      .filter(u => u.role === activeTab)
      .filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [getAllUsers, activeTab, searchTerm]); // Re-calc only when necessary

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddUser = () => {
    if (!newName || !newEmail) return;
    addUser({
      id: `${newRole.toLowerCase()}-${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      avatar: `https://ui-avatars.com/api/?name=${newName}&background=random`
    } as any); 
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserIcon className="text-emerald-600" />
          إدارة المستخدمين
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors"
        >
          <UserPlus size={18} />
          إضافة مستخدم
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[UserRole.STUDENT, UserRole.TEACHER, UserRole.PARENT, UserRole.ADMIN].map(role => (
          <button
            key={role}
            onClick={() => setActiveTab(role)}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === role ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {role === 'STUDENT' ? 'الطلاب' : role === 'TEACHER' ? 'المعلمون' : role === 'PARENT' ? 'أولياء الأمور' : 'الإدارة'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <input 
          type="text" 
          placeholder="بحث بالاسم أو البريد الإلكتروني..." 
          className="w-full pl-4 pr-10 py-3 rounded-lg border focus:ring-2 focus:ring-emerald-500 outline-none"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 flex flex-col min-h-[500px]">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
              <tr>
                <th className="p-4">الاسم</th>
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4">الدور</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-4 flex items-center gap-3">
                    <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                    <span className="font-bold text-gray-700">{user.name}</span>
                  </td>
                  <td className="p-4 text-gray-500 font-mono text-sm">{user.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center">
                    <button 
                      onClick={() => { if(window.confirm('هل أنت متأكد؟')) deleteUser(user.id) }}
                      className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="p-8 text-center text-gray-400">لا توجد نتائج</div>}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
             <div className="text-sm text-gray-500">
               عرض {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredUsers.length)} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} من {filteredUsers.length}
             </div>
             <div className="flex gap-2">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="p-2 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <ChevronRight size={16} />
               </button>
               <span className="px-4 py-2 bg-white border rounded text-sm font-bold text-gray-700 flex items-center">
                 {currentPage} / {totalPages}
               </span>
               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
                 className="p-2 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <ChevronLeft size={16} />
               </button>
             </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">إضافة مستخدم جديد</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
                <input type="text" className="w-full border p-2 rounded" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                <input type="email" className="w-full border p-2 rounded" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الدور</label>
                <select 
                  className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newRole} 
                  onChange={e => setNewRole(e.target.value as UserRole)}
                >
                  <option value={UserRole.STUDENT}>طالب</option>
                  <option value={UserRole.TEACHER}>معلم</option>
                  <option value={UserRole.PARENT}>ولي أمر</option>
                  <option value={UserRole.ADMIN}>إدارة</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">إلغاء</button>
              <button onClick={handleAddUser} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">حفظ المستخدم</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;