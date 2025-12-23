
import { UserRole } from "../types";

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export const getAIResponse = async (currentMessage: string, history: ChatMessage[], contextData: any): Promise<string> => {
  
  // لـ GitHub Pages، إذا لم تكن تستخدم عملية Build معقدة، يفضل وضع المفتاح هنا مباشرةً 
  // أو استبداله بمتغير البيئة إذا كنت تستخدم Vite أو Webpack.
  const apiKey = "ضع_مفتاح_OpenRouter_الخاص_بك_هنا"; 

  if (!apiKey || apiKey === "ضع_مفتاح_OpenRouter_الخاص_بك_هنا") {
    return "تنبيه: يرجى وضع مفتاح API الخاص بـ OpenRouter في ملف geminiService.ts لكي يعمل المساعد الذكي.";
  }

  const { currentUser, stats } = contextData;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isTeacher = currentUser.role === UserRole.TEACHER;

  let roleInstructions = "";
  if (isAdmin) {
    roleInstructions = `أنت مساعد إداري لمدرسة النجاة. الإحصائيات: ${stats.totalStudents} طالب، حضور ${stats.attendanceRate}%.`;
  } else if (isTeacher) {
    roleInstructions = `أنت مساعد تربوي للمعلم ${currentUser.name}. ساعده في الدروس والبوربوينت.`;
  }

  const systemInstruction = `
    اسمك: 'مساعد بوابة النجاة الذكي'.
    المدرسة: مدرسة النجاة الأهلية.
    المستخدم: ${currentUser.name}.
    ${roleInstructions}
    قواعد: للبوربوينت ابدأ بـ [[PPT_START]] وانته بـ [[PPT_END]]. استخدم ## للعناوين.
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "AlNajat School Portal",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-001", 
        "messages": [
          { "role": "system", "content": systemInstruction },
          ...history.map(msg => ({
            "role": msg.role === 'ai' ? 'assistant' : 'user',
            "content": msg.content
          })),
          { "role": "user", "content": currentMessage }
        ],
        "temperature": 0.7
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "عذراً، لم أتمكن من الرد.";
  } catch (error) {
    return "حدث خطأ في الاتصال بالذكاء الاصطناعي.";
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text.replace(/\[\[PPT_START\]\]|\[\[PPT_END\]\]|##/g, ''));
    utterance.lang = 'ar-SA';
    window.speechSynthesis.speak(utterance);
  }
  return undefined; 
};
