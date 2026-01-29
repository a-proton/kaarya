// lib/chatbotService.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatMessage {
  id: number;
  message: string;
  is_user: boolean;
  timestamp: string;
}

export interface ChatbotResponse {
  session_id: number;
  message: string;
  recommendations: Array<{
    provider_id: number;
    name: string;
    business_name: string;
    score: number;
    reason: string;
  }>;
  conversation_state: string;
}

export async function sendChatMessage(
  message: string,
  sessionId?: number,
  location?: string,
): Promise<ChatbotResponse> {
  try {
    const res = await fetch(`${API_URL}/api/v1/recommend/chatbot/message/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        location,
      }),
    });

    if (!res.ok) throw new Error("Chatbot request failed");
    return await res.json();
  } catch (error) {
    console.error("Chatbot error:", error);
    throw error;
  }
}

export async function getChatSession(sessionId: number) {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/recommend/chatbot/session/${sessionId}/`,
    );
    if (!res.ok) throw new Error("Failed to get session");
    return await res.json();
  } catch (error) {
    console.error("Get session error:", error);
    throw error;
  }
}
