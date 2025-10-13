import { Message } from '../types';

interface ApiResponse {
  response: string;
}

// Generate a persistent session ID for conversation memory
const sessionId = `classroom_session_${Date.now()}`;

// Allow overriding the backend URL via Vite env (e.g., VITE_BACKEND_URL)
const DEFAULT_BACKEND_URL = 'http://localhost:8000';
export const backendBaseUrl = (import.meta as any).env?.VITE_BACKEND_URL || DEFAULT_BACKEND_URL;

export const getAiTeacherResponse = async (
  query: string,
  messages: Message[],
  interruptionContext?: string
): Promise<string> => {
  try {
    const url = `${backendBaseUrl}/chat`;

    const body = {
      query,
      thread_id: sessionId,
      interruption_context: interruptionContext || ""
    };
    
    console.log('[apiService] Sending request to:', url, 'with body:', body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    const text = await response.text();
    console.log('[apiService] Response status:', response.status, 'length:', text?.length ?? 0);
    
    let data: ApiResponse | null = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      console.error('[apiService] JSON parse error:', e);
    }

    if (response.ok && data && typeof data.response === 'string') {
      console.log('[apiService] Success, response length:', data.response.length);
      console.log('[apiService] First 500 chars:', data.response.substring(0, 500));
      return data.response;
    }

    const serverMsg = data && typeof (data as any).response === 'string' ? (data as any).response : text;
    throw new Error(`Backend error ${response.status}: ${serverMsg || 'No details'}`);
  } catch (error) {
    console.error("Error calling AI Teacher backend:", error);
    return "Oh dear, it seems my circuits are a bit scrambled. Could you try asking again?";
  }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const url = `${backendBaseUrl}/transcribe`;
    const form = new FormData();
    form.append('file', audioBlob, 'recording.webm');
    const response = await fetch(url, {
      method: 'POST',
      body: form
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && typeof data.text === 'string') {
      return data.text as string;
    }
    console.error('[apiService] transcribe error', response.status, data);
    return '';
  } catch (e) {
    console.error('[apiService] transcribe exception', e);
    return '';
  }
};