
import { GoogleGenAI, Modality } from "@google/genai";
import { UserRole } from "../types";

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export const getAIResponse = async (currentMessage: string, history: ChatMessage[], contextData: any): Promise<string> => {
  if (!process.env.API_KEY) return "عذراً، نظام الذكاء الاصطناعي يتطلب مفتاح تشغيل. يرجى التواصل مع الإدارة.";

  const { currentUser, stats } = contextData;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = 'gemini-3-flash-preview';
    
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isTeacher = currentUser.role === UserRole.TEACHER;

    let roleInstructions = "";
    if (isAdmin) {
      roleInstructions = `
        أنت الآن تعمل كـ 'خبير إدارة مدرسية' ومستشار لمدير النظام (الأستاذ حسن).
        سياق العمل الحالي في مدرسة النجاة:
        - عدد الطلاب الإجمالي: ${stats.totalStudents}
        - عدد المعلمين: ${stats.totalTeachers}
        - نسبة الحضور اليوم: ${stats.attendanceRate}%
        
        مهامك الأساسية للمدير:
        1. تحليل اتجاهات الغياب بذكاء.
        2. صياغة تعاميم رسمية واحترافية جداً تليق بمدرسة النجاة.
        3. تقديم مشورات قيادية لرفع كفاءة الكادر.
      `;
    } else if (isTeacher) {
      roleInstructions = `
        أنت مساعد تربوي للمعلم (${currentUser.name}).
        مهامك:
        1. تحضير دروس مبتكرة تليق بمدرسة النجاة.
        2. إنشاء محتوى للعروض التقديمية (PPT) بأسلوب عصري جداً ومرتب.
        3. اقتراح أساليب تدريس تفاعلية.
      `;
    }

    const systemInstruction = `
      اسمك: 'مساعد بوابة النجاة الذكي'.
      المدرسة: مدرسة النجاة الأهلية.
      المستخدم: ${currentUser.name}.
      
      ${roleInstructions}

      قواعد عامة:
      - عند طلب بوربوينت، استخدم التنسيق: [[PPT_START]] ثم العناوين تبدأ بـ ## ثم [[PPT_END]].
      - تحدث بلهجة واثقة، مهنية، ومحترمة جداً.
      - لا تذكر أبداً أنك نموذج لغوي.
    `;

    const chatHistory = history.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: currentMessage }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "عذراً، لم أتمكن من معالجة طلبك حالياً.";
  } catch (error) {
    console.error("AI Error:", error);
    return "نعتذر، هناك ضغط على خوادم الذكاء الاصطناعي. حاول مرة أخرى لاحقاً.";
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  if (!process.env.API_KEY) return undefined;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `تحدث بوضوح واحترافية باللغة العربية: ${text.replace(/\[\[.*?\]\]/g, '').replace(/##/g, '')}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return undefined;
  }
};
