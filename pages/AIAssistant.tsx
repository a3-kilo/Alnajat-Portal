
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getAIResponse, generateSpeech } from '../services/geminiService';
import { marked } from 'marked';
import pptxgen from 'pptxgenjs';
import { 
  Send, Loader2, Presentation, Paperclip, X, History, 
  Sparkles, BookOpen, Copy, Check, Video, 
  Rocket, BarChart3, FileText, BellRing, ShieldCheck, UserCog,
  Volume2, Mic, MicOff, Layout, Star
} from 'lucide-react';
import { UserRole, AttendanceStatus } from '../types';

marked.setOptions({ breaks: true, gfm: true });

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const AIAssistant: React.FC = () => {
  const { students, teachers, attendance } = useData();
  const { currentUser } = useAuth();
  const SCHOOL_LOGO = "https://i.ibb.co/wf3KFqQ/images-3-1.jpg";
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string, timestamp: Date}[]>([
    { 
      role: 'ai', 
      content: isAdmin 
        ? `أهلاً بك سعادة المدير **${currentUser?.name}**. بصفتي مستشارك الإداري الذكي، أنا مستعد لتحليل بيانات المدرسة، صياغة التعاميم، أو تقديم مشورات قيادية لرفع كفاءة مدرسة النجاة.`
        : `أهلاً بك يا **${currentUser?.name}**. أنا مساعدك التربوي الذكي، كيف يمكنني مساعدتك في التحضير أو الإبداع اليوم؟`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPPT, setIsExportingPPT] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<{id: string, name: string, promptBase: string, placeholder: string} | null>(null);
  const [toolInput, setToolInput] = useState('');
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'ar-SA';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onerror = () => setIsRecording(false);
    }
  }, []);

  const stats = {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    attendanceRate: attendance.length > 0 ? Math.round((attendance.filter(a => a.status === AttendanceStatus.PRESENT).length / attendance.length) * 100) : 0
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  const handlePlayVoice = async (text: string, index: number) => {
    if (playingIndex === index) return;
    setPlayingIndex(index);

    try {
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setPlayingIndex(null);
        source.start();
      } else {
        setPlayingIndex(null);
      }
    } catch (e) {
      console.error(e);
      setPlayingIndex(null);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    setActiveTool(null);
    setToolInput('');
    setIsLoading(true);

    const response = await getAIResponse(text, messages.map(m => ({ role: m.role, content: m.content })), { 
      currentUser, 
      stats 
    });
    
    setMessages(prev => [...prev, { role: 'ai', content: response, timestamp: new Date() }]);
    setIsLoading(false);
  };

  const handleToolAction = (toolId: string) => {
    if (toolId === 'video') {
      setShowVideoPopup(true);
      return;
    }
    const tools: Record<string, any> = {
      'admin_analysis': { name: 'تحليل أداء المدرسة', promptBase: 'بصفتك مستشاري، حلل لي بيانات الحضور والغياب الحالية وقدم لي 5 مقترحات عملية لتحسين الانضباط المدرسي. ', placeholder: 'أضف أي تفاصيل خاصة أو اتركها فارغة...' },
      'official_memo': { name: 'صياغة تعميم رسمي', promptBase: 'اكتب لي تعميماً رسمياً شديد اللهجة بخصوص: ', placeholder: 'موضوع التعميم (مثلاً: التأخر الصباحي)...' },
      'teacher_eval': { name: 'خطة تطوير معلمين', promptBase: 'اقترح لي خطة تدريبية سنوية للمعلمين لرفع كفاءة استخدام التقنية في التعليم بخصوص: ', placeholder: 'أدخل المادة أو التقنية المستهدفة...' },
      'pptx': { name: 'إنشاء عرض تقديمي', promptBase: 'صمم لي محتوى بوربوينت احترافي. ابدأ بـ [[PPT_START]] وانته بـ [[PPT_END]]. الشريحة الأولى للعنوان فقط، وباقي الشرائح تبدأ بـ ## للعنوان. الموضوع هو: ', placeholder: 'ما هو موضوع العرض؟' },
      'lesson': { name: 'تحضير درس', promptBase: 'قم بتحضير درس متكامل لموضوع: ', placeholder: 'اسم الدرس والمادة...' },
    };
    setActiveTool({ id: toolId, ...tools[toolId] });
  };

  const exportToPPTX = async (rawContent: string) => {
    if (isExportingPPT) return;
    setIsExportingPPT(true);

    try {
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';
      pres.rtl = true;

      const cleanContent = rawContent.includes('[[PPT_START]]') ? rawContent.match(/\[\[PPT_START\]\]([\s\S]*?)\[\[PPT_END\]\]/)?.[1] || rawContent : rawContent;
      const slidesData = cleanContent.split(/##/g).filter(s => s.trim().length > 2);
      
      if (slidesData.length === 0) {
        setIsExportingPPT(false);
        return;
      }

      const EMERALD = "0D9488";
      const SLATE = "1E293B";
      const LIGHT_SLATE = "334155";
      const WHITE = "FFFFFF";
      const SOFT_GRAY = "F1F5F9";
      
      let presentationTitle = "عرض_تقديمي";

      slidesData.forEach((slideRaw, index) => {
        const slide = pres.addSlide();
        const lines = slideRaw.trim().split('\n');
        const titleText = lines[0].replace(/[#*]/g, '').trim();
        const bodyLines = lines.slice(1).map(l => l.replace(/[#*]/g, '').trim()).filter(l => l.length > 0);
        
        if (index === 0) presentationTitle = titleText.replace(/\s+/g, '_');

        const commonArOpts: pptxgen.TextPropsOptions = { 
          rtl: true, lang: 'ar-SA', align: 'right', fontFace: 'Arial' 
        };
        
        if (index === 0) {
          slide.background = { color: SLATE };
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: EMERALD } });
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 5.52, w: '100%', h: 0.1, fill: { color: EMERALD } });
          slide.addShape(pres.ShapeType.roundRect, { 
            x: 4.15, y: 0.5, w: 1.7, h: 1.7, 
            fill: { color: WHITE }, 
            rectRadius: 0.1,
            line: { color: EMERALD, width: 2 }
          });
          slide.addImage({ path: SCHOOL_LOGO, x: 4.25, y: 0.6, w: 1.5, h: 1.5 });
          slide.addText("بوابة النجاة التعليمية الرقمية", { 
            ...commonArOpts, x: 0, y: 2.8, w: '100%', h: 0.5, 
            fontSize: 22, color: EMERALD, bold: true, align: 'center' 
          });
          slide.addText(titleText, { 
            ...commonArOpts, x: 0.5, y: 3.4, w: 9, h: 1.5, 
            fontSize: 54, bold: true, color: WHITE, align: 'center' 
          });
          slide.addText("عرض تقديمي احترافي • مدرسة النجاة الأهلية", { 
            ...commonArOpts, x: 0, y: 5.1, w: '100%', h: 0.3, 
            fontSize: 12, color: "94A3B8", align: 'center' 
          });
        } else {
          // تصميم جديد لشرائح المحتوى: مريح للعين (Minimalist Accent)
          slide.background = { color: SOFT_GRAY };
          
          // بدلاً من الكتلة السوداء: خط زمردي نحيف وأنيق على اليمين لتمييز المحتوى
          slide.addShape(pres.ShapeType.rect, { 
            x: 9.7, y: 0.8, w: 0.1, h: 4.0, 
            fill: { color: EMERALD } 
          });

          // البطاقة المركزية (Bento Card) أصبحت أكبر وأوضح
          slide.addShape(pres.ShapeType.roundRect, { 
            x: 0.5, y: 0.4, w: 9.0, h: 4.8, 
            fill: { color: WHITE },
            line: { color: "E2E8F0", width: 1 },
            rectRadius: 0.15
          });

          // عنوان الشريحة
          slide.addText(titleText, { 
            ...commonArOpts, 
            x: 1.0, y: 0.7, w: 8.0, h: 0.8, 
            fontSize: 32, bold: true, color: SLATE, align: 'right' 
          });

          // خط فاصل تحت العنوان
          slide.addShape(pres.ShapeType.rect, { x: 1.0, y: 1.5, w: 8.0, h: 0.02, fill: { color: SOFT_GRAY } });

          // المحتوى النصي
          if (bodyLines.length > 0) {
            const bodyTextArray = bodyLines.map(line => ({ 
              text: line, 
              options: { bullet: { type: 'bullet', code: '2022' }, color: LIGHT_SLATE, fontSize: 18, breakLine: true, rtl: true, lang: 'ar-SA', align: 'right' as const } 
            }));
            slide.addText(bodyTextArray, { 
              ...commonArOpts, x: 1.0, y: 1.7, w: 8.0, h: 3.3, valign: 'top', lineSpacing: 36, align: 'right'
            });
          }
          
          // العلامة المائية الهادئة في الأسفل (Footer) بدلاً من الجانب
          slide.addText("مــــدرسة النجـــاة الأهلية", { 
            x: 0.5, y: 5.25, w: 3.0, h: 0.3, 
            fontSize: 10, bold: true, color: "94A3B8", align: 'right', rtl: true
          });

          // رقم الصفحة
          slide.addShape(pres.ShapeType.ellipse, { x: 9.3, y: 5.2, w: 0.3, h: 0.3, fill: { color: EMERALD } });
          slide.addText(`${index + 1}`, { x: 9.3, y: 5.2, w: 0.3, h: 0.3, color: WHITE, fontSize: 8, align: 'center', bold: true });
        }
      });
      pres.writeFile({ fileName: `AlNajat_${presentationTitle}.pptx` });
    } catch (e) { 
      console.error("PPT Error:", e); 
      alert("حدث خطأ أثناء التصدير.");
    } finally {
      setIsExportingPPT(false);
    }
  };

  /**
   * إرجاع تصميم الأزرار الفخم (Premium Bento)
   */
  const ToolButton = ({ icon: Icon, label, id, color }: any) => (
    <button 
      onClick={() => handleToolAction(id)} 
      className={`w-full text-right p-4 rounded-xl border transition-all hover:translate-x-[-4px] flex items-center gap-3 group shadow-sm ${color}`}
    >
      <Icon size={18} className="group-hover:scale-110 transition-transform" />
      <span className="font-bold text-[11px] uppercase tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="h-screen flex flex-col md:flex-row gap-0 md:gap-4 p-0 md:p-4 bg-[#f8fafc] overflow-hidden">
      
      {/* Sidebar Tools - Premium Version (Restored) */}
      <div className="hidden lg:flex flex-col w-64 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5 h-full">
          <div className="flex items-center gap-2 mb-2 px-1">
            <ShieldCheck size={18} className="text-emerald-600" />
            <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em]">أدوات المساعد الذكي</h3>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-1">
            {isAdmin ? (
              <>
                <ToolButton id="admin_analysis" label="تحليل ذكاء الأعمال" icon={BarChart3} color="bg-indigo-50 border-indigo-100 text-indigo-700" />
                <ToolButton id="official_memo" label="صياغة قرار / تعميم" icon={FileText} color="bg-emerald-50 border-emerald-100 text-emerald-700" />
                <ToolButton id="teacher_eval" label="تطوير الكادر" icon={UserCog} color="bg-purple-50 border-purple-100 text-purple-700" />
              </>
            ) : (
              <>
                <ToolButton id="pptx" label="إنشاء عرض تقديمي" icon={Presentation} color="bg-emerald-50 border-emerald-100 text-emerald-700" />
                <ToolButton id="lesson" label="تحضير درس ذكي" icon={BookOpen} color="bg-blue-50 border-blue-100 text-blue-700" />
              </>
            )}
            <ToolButton id="video" label="صناعة فيديو للدرس" icon={Video} color="bg-orange-50 border-orange-100 text-orange-700" />
          </div>

          <div className="mt-auto bg-slate-900 p-5 rounded-2xl text-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-bl-full"></div>
             <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest relative z-10 mb-1">المطور الرئيسي</p>
             <p className="text-white font-bold text-xs relative z-10">أمير مجدي العمُري</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white md:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative">
        
        {showVideoPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-orange-400 to-orange-600"></div>
              <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Rocket size={40} className="animate-bounce" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-4">قريباً جداً!</h3>
              <p className="text-slate-500 font-bold leading-relaxed mb-8">
                الطالب <span className="text-emerald-600">أمير العمري</span> يطور حالياً محرك ذكاء اصطناعي لصناعة الفيديو، انتظرونا في التحديث القادم.
              </p>
              <button onClick={() => setShowVideoPopup(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all">حسناً، بانتظار الإبداع</button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-8 py-5 border-b flex items-center justify-between bg-white/95 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-md">
              <img src={SCHOOL_LOGO} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-black text-[15px] text-slate-800 tracking-tight">مساعد النجاة {isAdmin ? 'الإداري' : 'التربوي'}</h2>
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> متصل بنظام مدرسة النجاة
              </p>
            </div>
          </div>
          <button onClick={() => setMessages([{role: 'ai', content: 'كيف يمكنني خدمتك الآن؟', timestamp: new Date()}])} className="p-3 rounded-xl hover:bg-slate-50 text-slate-400 transition-all">
             <History size={20} />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 bg-slate-50/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-6 rounded-3xl text-[14px] shadow-sm border ${msg.role === 'user' ? 'bg-white text-slate-700 rounded-tr-none border-slate-200' : 'bg-emerald-600 text-white rounded-tl-none border-emerald-700'}`}>
                <div className="markdown-content font-bold leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content.replace(/\[\[PPT_START\]\]|\[\[PPT_END\]\]/g, '')) }} />
                <div className={`mt-5 pt-4 border-t flex items-center justify-between gap-5 text-[10px] ${msg.role === 'user' ? 'border-slate-100 text-slate-300' : 'border-white/10 text-emerald-100'}`}>
                  <span className="font-black uppercase">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <div className="flex gap-4">
                    {msg.role === 'ai' && (
                      <>
                        <button 
                          onClick={() => handlePlayVoice(msg.content, idx)} 
                          className={`flex items-center gap-1.5 font-black transition-colors ${playingIndex === idx ? 'text-white scale-110' : 'text-emerald-100 hover:text-white'}`}
                        >
                          <Volume2 size={16} className={playingIndex === idx ? 'animate-pulse' : ''} />
                          {playingIndex === idx ? 'جاري الاستماع...' : 'استماع'}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopiedIndex(idx); setTimeout(() => setCopiedIndex(null), 2000); }} className="flex items-center gap-1.5 font-black">
                          {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />} {copiedIndex === idx ? 'تم النسخ' : 'نسخ النص'}
                        </button>
                        {(msg.content.includes('##') || msg.content.includes('[[PPT_START]]')) && (
                          <button 
                            onClick={() => exportToPPTX(msg.content)} 
                            disabled={isExportingPPT}
                            className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-xl font-black shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                          >
                            {isExportingPPT ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                جاري تصدير العرض الفاخر...
                              </>
                            ) : (
                              <>
                                <Presentation size={16} /> تصدير (Premium PPTX)
                              </>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-end">
              <div className="bg-emerald-600 text-white px-8 py-5 rounded-3xl rounded-tl-none flex items-center gap-4 shadow-xl border border-emerald-700 animate-pulse">
                <Loader2 size={20} className="animate-spin text-emerald-200" />
                <span className="font-black text-[13px]">
                   {isAdmin ? 'جاري معالجة البيانات وصياغة الرؤية الإدارية...' : 'جاري إعداد المحتوى التربوي وتنسيق العرض...'}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100 relative shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          {activeTool && (
            <div className="absolute inset-x-0 bottom-full p-6 bg-white border-t border-slate-200 shadow-2xl animate-fade-in z-30">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                     <Sparkles size={20} />
                   </div>
                   <div>
                     <h4 className="font-black text-slate-800 text-[14px]">{activeTool.name}</h4>
                     <p className="text-[10px] text-slate-400 font-bold">أداة ذكية مخصصة لـ {currentUser?.name}</p>
                   </div>
                </div>
                <button onClick={() => setActiveTool(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
              </div>
              <div className="flex gap-3">
                <input type="text" autoFocus value={toolInput} onChange={e => setToolInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage(activeTool.promptBase + toolInput)} placeholder={activeTool.placeholder} className="flex-1 border-2 border-slate-200 rounded-2xl p-4 text-[14px] font-bold focus:border-emerald-500 outline-none transition-all bg-white text-slate-900" />
                <button onClick={() => sendMessage(activeTool.promptBase + toolInput)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[14px] shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2">توليد <Sparkles size={18} /></button>
              </div>
            </div>
          )}

          <div className="flex gap-4 items-center bg-slate-100/80 p-2 rounded-2xl border-2 border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all">
            <button className="p-3 text-slate-400 hover:text-emerald-600"><Paperclip size={22} /></button>
            <button 
              onClick={toggleRecording} 
              className={`p-3 transition-colors ${isRecording ? 'text-red-600 animate-pulse' : 'text-slate-400 hover:text-emerald-600'}`}
              title="تحدث الآن"
            >
              {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && sendMessage(input)} 
              placeholder={isRecording ? "جاري الاستماع إليك..." : (isAdmin ? "اطلب تحليلاً، تعميماً، أو مشورة إدارية..." : "اطلب تحضيراً، بوربوينت، أو شرحاً تعليمياً...")} 
              className={`flex-1 bg-transparent border-none focus:ring-0 text-slate-900 font-bold text-[14px] px-2 placeholder:text-slate-400 ${isRecording ? 'italic' : ''}`} 
            />
            <button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} className="bg-emerald-600 text-white p-3.5 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
              <Send size={22} className="rotate-180" />
            </button>
          </div>
          <div className="mt-4 text-center">
             <p className="text-[9px] text-slate-300 font-black tracking-[0.3em] uppercase">عمل الطالب: أمير مجدي العمُري 9/4 • مدرسة النجاة الأهلية</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
