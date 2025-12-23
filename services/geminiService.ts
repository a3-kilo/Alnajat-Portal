
// @google/genai Coding Guidelines followed:
// - Use GoogleGenAI with { apiKey: process.env.API_KEY }
// - Use ai.models.generateContent for text and TTS
// - Use correct model names (gemini-3-flash-preview, gemini-3-pro-preview, gemini-2.5-flash-preview-tts)
// - Extract text from .text property
import { GoogleGenAI, Modality } from "@google/genai";
import { UserRole } from "../types";

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

// Initializing the Gemini API client using the required environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * دالة جلب الرد من الذكاء الاصطناعي عبر Gemini API
 */
export const getAIResponse = async (currentMessage: string, history: ChatMessage[], contextData: any): Promise<string> => {
  const { currentUser, stats } = contextData;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  let roleInstructions = "";
  if (isAdmin) {
    roleInstructions = `
      أنت الآن تعمل كـ 'خبير إدارة مدرسية' ومستشار لمدير مدرسة النجاة.
      بيانات المدرسة الحالية:
      - الطلاب: ${stats.totalStudents}
      - المعلمون: ${stats.totalTeachers}
      - نسبة الحضور: ${stats.attendanceRate}%
      حلل البيانات بذكاء وقدم مشورات إدارية وصياغة تعاميم رسمية احترافية بلهجة وقورة وحازمة.
    `;
  } else {
    roleInstructions = `
      أنت مساعد تربوي ذكي للمعلم (${currentUser.name}) في مدرسة النجاة.
      ساعده في تحضير الدروس، ابتكار طرق تدريس، وإنشاء محتوى عروض بوربوينت (PPT) بأسلوب مشوق جداً.
    `;
  }

  const systemInstruction = `
    اسمك: 'مساعد بوابة النجاة الذكي'.
    المدرسة: مدرسة النجاة الأهلية.
    المستخدم: ${currentUser.name}.
    ${roleInstructions}
    قواعد هامة جداً لنتائج أسطورية:
    - عند طلب عرض تقديمي أو بوربوينت، ابدأ دائماً بـ [[PPT_START]] وانتهِ بـ [[PPT_END]].
    - الشريحة الأولى يجب أن تكون للعنوان الرئيسي فقط.
    - استخدم ## لعناوين الشرائح (مثال: ## أهمية التعليم التقني).
    - لغتك العربية فصيحة، ملهمة، ومحترمة جداً.
    - اجعل المحتوى منسقاً على شكل نقاط واضحة.
  `;

  try {
    // Mapping conversation history to Gemini format (user/model roles)
    const contents = [
      ...history.map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: currentMessage }] }
    ];

    // Using gemini-3-pro-preview for admin (complex analysis) and gemini-3-flash-preview for teachers
    const response = await ai.models.generateContent({
      model: isAdmin ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    // Accessing .text property directly as per guidelines (not a method)
    return response.text || "لم أحصل على رد، حاول مجدداً.";
  } catch (error) {
    console.error("API Error:", error);
    return `خطأ: ${error instanceof Error ? error.message : 'فشل الاتصال بمزود الخدمة'}`;
  }
};

/**
 * دالة توليد الكلام الصوتي باستخدام Gemini TTS موديل
 */
export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    // Using gemini-2.5-flash-preview-tts for high-quality Arabic speech generation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `تحدث باللغة العربية: ${text.replace(/\[\[PPT_START\]\]|\[\[PPT_END\]\]|##/g, '')}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // Using a prebuilt voice optimized for clear speech
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    // Returning the base64 encoded raw PCM data for decoding in the frontend
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    // Returning undefined to signal the UI to stop the loading state
    return undefined;
  }
};
