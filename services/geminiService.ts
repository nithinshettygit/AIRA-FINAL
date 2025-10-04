import type { Message } from '../types';

/**
 * Sends the user's prompt and conversation history to a backend service
 * that hosts a LangChain agent, and returns the agent's response.
 * 
 * @param prompt - The current user input.
 * @param history - The previous messages in the conversation.
 * @param interruptionContext - The text that was being displayed when the user interrupted.
 * @returns A promise that resolves to the AI teacher's response string.
 */
export const getAiTeacherResponse = async (
  prompt: string,
  history: Message[],
  interruptionContext?: string
): Promise<string> => {
  // This endpoint points to your local Python Flask server.
  // Make sure your backend is running before you use the app.
  const LANGCHAIN_AGENT_ENDPOINT = 'http://127.0.0.1:5000/api/langchain-agent';

  try {
    const response = await fetch(LANGCHAIN_AGENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send all relevant context to the backend agent.
      body: JSON.stringify({
        prompt,
        history,
        interruptionContext,
      }),
    });

    if (!response.ok) {
      // Try to get more specific error info from the backend response body
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from server.' }));
      console.error("Backend API call failed:", response.status, errorData);
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Your backend should return a JSON object with a 'response' field containing the text.
    // For example: { "response": "Hello, I am your AI teacher..." }
    if (typeof data.response !== 'string') {
        console.error("Invalid response format from backend:", data);
        throw new Error("Received an invalid response format from the server.");
    }

    return data.response;
  } catch (error) {
    console.error("Error calling LangChain agent backend:", error);
    // Provide a user-friendly error message.
    return "I seem to be having a bit of trouble connecting to my knowledge base. Please make sure the backend service is running and try again!";
  }
};