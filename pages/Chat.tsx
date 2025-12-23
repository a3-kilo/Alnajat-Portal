
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, Search, Smile, Clock } from 'lucide-react';

const Chat: React.FC = () => {
  const { currentUser } = useAuth();
  const { messages, sendMessage, markMessagesAsRead, students, parents, teachers, admins } = useData();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. تحديد قائمة جهات الاتصال الأساسية حسب الصلاحيات
  const baseContacts = useMemo(() => {
    let contacts: any[] = [];
    if (currentUser) {
      if (currentUser.role === 'ADMIN') contacts = [...teachers, ...parents];
      else if (currentUser.role === 'TEACHER') contacts = [...parents, ...admins];
      else if (currentUser.role === 'PARENT') contacts = [...teachers, ...admins];
      else if (currentUser.role === 'STUDENT') contacts = [...teachers];
    }
    return contacts;
  }, [currentUser, teachers, parents, admins]);

  // 2. ترتيب جهات الاتصال حسب تاريخ آخر رسالة (الأحدث أولاً) وتطبيق البحث
  const sortedAndFilteredContacts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    // إضافة بيانات آخر رسالة لكل جهة اتصال للترتيب
    const contactsWithMeta = baseContacts.map(contact => {
      const contactMessages = messages.filter(m => 
        (m.senderId === currentUser?.id && m.receiverId === contact.id) ||
        (m.senderId === contact.id && m.receiverId === currentUser?.id)
      );
      
      const lastMsg = contactMessages.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

      return {
        ...contact,
        lastTimestamp: lastMsg ? new Date(lastMsg.timestamp).getTime() : 0,
        lastText: lastMsg ? lastMsg.content : ''
      };
    });

    // الترتيب: الأحدث أولاً
    const sorted = contactsWithMeta.sort((a, b) => b.lastTimestamp - a.lastTimestamp);

    // فلترة البحث
    return sorted.filter(contact => contact.name.toLowerCase().includes(query));
  }, [baseContacts, messages, currentUser?.id, searchQuery]);

  // 3. تحديث الرسائل كمقروءة عند اختيار مستخدم أو عند وصول رسالة جديدة والمحادثة مفتوحة
  useEffect(() => {
    if (selectedUserId && currentUser) {
      markMessagesAsRead(selectedUserId, currentUser.id);
    }
  }, [selectedUserId, currentUser, markMessagesAsRead, messages.length]);

  const conversation = useMemo(() => {
    return messages.filter(m => 
      (m.senderId === currentUser?.id && m.receiverId === selectedUserId) ||
      (m.senderId === selectedUserId && m.receiverId === currentUser?.id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, currentUser?.id, selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleSend = () => {
    if (!inputText.trim() || !selectedUserId) return;
    sendMessage({ senderId: currentUser!.id, receiverId: selectedUserId, content: inputText });
    setInputText('');
  };

  const getUnreadForContact = (contactId: string) => {
    return messages.filter(m => m.senderId === contactId && m.receiverId === currentUser?.id && !m.read).length;
  };

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden animate-fade-in p-0 md:p-6 gap-6">
      
      {/* قائمة جهات الاتصال */}
      <div className="hidden md:flex w-80 bg-white rounded-[2rem] border border-slate-200 shadow-xl flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-black text-gray-800 text-sm flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-emerald-600" /> المحادثات
          </h2>
          <div className="relative">
             <input 
               type="text" 
               placeholder="بحث عن مستخدم..." 
               className="w-full pl-3 pr-10 py-2.5 rounded-xl border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
             <Search size={16} className="absolute right-3 top-3 text-slate-300" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sortedAndFilteredContacts.map(contact => {
            const unreadCount = getUnreadForContact(contact.id);
            const isSelected = selectedUserId === contact.id;
            
            return (
              <button
                key={contact.id}
                onClick={() => setSelectedUserId(contact.id)}
                className={`w-full p-4 flex items-center gap-3 rounded-2xl transition-all relative ${isSelected ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                <div className="relative">
                  <img src={contact.avatar} className="w-10 h-10 rounded-full border border-white/20 object-cover" alt="" />
                  {unreadCount > 0 && !isSelected && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
                  )}
                </div>
                
                <div className="flex-1 text-right overflow-hidden">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className={`font-black text-xs truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>{contact.name}</p>
                    {contact.lastTimestamp > 0 && (
                      <span className={`text-[8px] shrink-0 mr-1 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {new Date(contact.lastTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                  <p className={`text-[9px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-500 font-medium'}`}>
                    {contact.lastText || contact.role}
                  </p>
                </div>

                {unreadCount > 0 && !isSelected && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
          {sortedAndFilteredContacts.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs font-bold">لا يوجد نتائج</div>
          )}
        </div>
      </div>

      {/* منطقة الدردشة */}
      <div className="flex-1 bg-white md:rounded-[2rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden relative">
        {selectedUserId ? (
          <>
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
               <div className="flex items-center gap-3">
                 <img src={baseContacts.find(c => c.id === selectedUserId)?.avatar} className="w-10 h-10 rounded-full border shadow-sm object-cover" alt="" />
                 <div>
                   <h3 className="font-black text-gray-800 text-sm">{baseContacts.find(c => c.id === selectedUserId)?.name}</h3>
                   <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider">متصل الآن</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-slate-50/30">
               {conversation.map(msg => {
                 const isMe = msg.senderId === currentUser?.id;
                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-xs font-bold shadow-sm ${isMe ? 'bg-white border border-slate-200 text-slate-800 rounded-tr-none' : 'bg-emerald-600 text-white border-emerald-700 rounded-tl-none'}`}>
                        {msg.content}
                        <div className={`text-[8px] mt-1 flex items-center gap-1 opacity-50 ${isMe ? 'text-slate-400 justify-end' : 'text-white justify-start'}`}>
                          <Clock size={8} />
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                <button className="p-2 text-slate-300 hover:text-emerald-600"><Smile size={20} /></button>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSend()}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 font-bold text-xs"
                  placeholder="اكتب رسالتك..."
                />
                <button onClick={handleSend} disabled={!inputText.trim()} className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100">
                  <Send size={20} className="rotate-180" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner mb-4 border border-slate-100">
                <MessageSquare size={40} className="opacity-20" />
             </div>
             <p className="font-black text-sm text-slate-400">اختر محادثة لبدء التواصل</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
