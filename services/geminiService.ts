
import { UserRole } from "../types";

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

/**
 * دالة جلب الرد من الذكاء الاصطناعي عبر OpenRouter
 * تم ضبطها لتعطي أفضل النتائج في اللغة العربية وتنسيق البوربوينت
 */
export const getAIResponse = async (currentMessage: string, history: ChatMessage[], contextData: any): Promise<string> => {
  
  // يتم استخدام المفتاح من البيئة البرمجية، أو يمكنك وضعه هنا مباشرة للتجربة
  const apiKey = process.env.API_KEY || "ضع_مفتاح_OpenRouter_هنا"; 

  if (!apiKey || apiKey === "ضع_مفتاح_OpenRouter_هنا") {
    return "تنبيه: يرجى التأكد من ضبط مفتاح API الخاص بـ OpenRouter في ملف geminiService.ts لكي يعمل المساعد الذكي.";
  }

  const { currentUser, stats } = contextData;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isTeacher = currentUser.role === UserRole.TEACHER;

  // تخصيص التعليمات بناءً على دور المستخدم للحصول على نتائج دقيقة
  let roleInstructions = "";
  if (isAdmin) {
    roleInstructions = `
      أنت الآن تعمل كـ 'خبير إدارة مدرسية' ومستشار لمدير مدرسة النجاة (الأستاذ شريف السباعي).
      سياق المدرسة الحالي:
      - عدد الطلاب: ${stats.totalStudents}
      - عدد المعلمين: ${stats.totalTeachers}
      - نسبة الحضور اليومي: ${stats.attendanceRate}%
      
      مهامك للمدير:
      1. تحليل بيانات الغياب بذكاء واقتراح حلول إدارية.
      2. صياغة تعاميم رسمية بلهجة وقورة وحازمة.
      3. تقديم أفكار تطويرية للمدرسة.
    `;
  } else if (isTeacher) {
    roleInstructions = `
      أنت مساعد تربوي خبير للمعلم (${currentUser.name}) في مدرسة النجاة.
      مهامك:
      1. تحضير دروس مبتكرة وشاملة.
      2. إنشاء محتوى تعليمي للعروض التقديمية (PPT) بأسلوب مشوق.
      3. اقتراح أنشطة صفية تفاعلية.
    `;
  } else {
    roleInstructions = `أنت مساعد تعليمي ذكي في مدرسة النجاة، تساعد الطالب أو ولي الأمر في فهم المناهج ومتابعة المسيرة التعليمية بأسلوب مشجع ولطيف.`;
  }

  const systemInstruction = `
    اسمك: 'مساعد بوابة النجاة الذكي'.
    المدرسة: مدرسة النجاة الأهلية - السالمية.
    المستخدم الحالي: ${currentUser.name}.
    
    ${roleInstructions}

    قواعد التنسيق الإلزامية (مهم جداً):
    - عند طلب إنشاء عرض تقديمي (بوربوينت) أو PPT:
      * يجب أن يبدأ المحتوى بـ [[PPT_START]] وينتهي بـ [[PPT_END]].
      * استخدم الرمز ## قبل عنوان كل شريحة (مثال: ## عنوان الشريحة).
      * اجعل المحتوى منسقاً على شكل نقاط واضحة.
    - استخدم اللغة العربية الفصحى الراقية.
    - لا تذكر أنك نموذج لغوي، تصرف دائماً كمساعد ذكي مدمج في بوابة النجاة.
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
        "model": "google/gemini-2.0-flash-001", // أفضل موديل من حيث السرعة والجودة والتكلفة
        "messages": [
          { "role": "system", "content": systemInstruction },
          ...history.map(msg => ({
            "role": msg.role === 'ai' ? 'assistant' : 'user',
            "content": msg.content
          })),
          { "role": "user", "content": currentMessage }
        ],
        "temperature": 0.7,
        "top_p": 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "فشل الاتصال بمزود الخدمة");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "عذراً، لم أتمكن من توليد رد حالياً. يرجى المحاولة مرة أخرى.";
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    return `نعتذر، حدث خطأ في النظام الذكي: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
  }
};

/**
 * دالة توليد الصوت (TTS)
 * ملاحظة: عبر OpenRouter يتم استخدام ميزة Speech Synthesis الخاصة بالمتصفح كبديل سريع
 */
export const generateSpeech = async (text: string): Promise<string | undefined> => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text.replace(/\[\[PPT_START\]\]|\[\[PPT_END\]\]|##/g, ''));
    utterance.lang = 'ar-SA';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
  return undefined; 
};
