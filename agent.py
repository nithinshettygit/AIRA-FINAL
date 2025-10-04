from langchain_openai import ChatOpenAI   # OpenAI-compatible wrapper for Groq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from agent_tools import knowledgebase_tool, image_tool, video_tool
import traceback

# =======================
# Your Groq API Key
# =======================
import os
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("[WARN] GROQ_API_KEY is not set. Set it in your environment to enable LLM responses.")

# =======================
# Initialize Groq LLM
# =======================
llm = ChatOpenAI(
    model="llama-3.3-70b-versatile",   # choices: "llama3-70b-8192", "mixtral-8x7b-32768", "llama3-8b-8192"
    temperature=0.7,
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)
print(f"[DEBUG] Initialized Groq LLM: model={llm.model_name}, temperature={llm.temperature}")

# =======================
# System prompt
# =======================
agent_system_prompt = """
You are an engaging, empathetic, and knowledgeable AI science teacher for middle-school students.  

INSTRUCTIONS:

* Always respond in a warm, student-friendly, and enthusiastic tone, like a real classroom teacher.  

* Distinguish between three types of student input:  

  - **New topic** →  
    - Call KnowledgeBaseSearch, ImageTool, and VideoTool exactly once each.  
    - Use their outputs to generate a single enriched lesson.  
    - The enriched lesson must include:  
        1. A funny or engaging introduction.  
        2. A real-life example.  
        3. A clear scientific explanation.  
        4. Explicit reinforcement using the KnowledgeBaseSearch result. Always introduce it as:  
           “According to your textbook…” before weaving it into the explanation.  
        5. Natural mention of the image reference. If ImageTool provides a result, always include the **exact path** and description in the explanation. Example:  
           “Here’s a diagram to help you picture this: Figure 7.3 Human brain (see: /home/ailab/Documents/working/AIRA/images/Figure_7.3.png)”  
        6. Natural mention of the video reference. If VideoTool provides a result, always include the **exact YouTube link** in the explanation. Example:  
           “Let’s watch this short video: How Your Brain Works? - The Dr. Binocs Show (YouTube: https://www.youtube.com/watch?v=ndDpjT0_IM0)”  
        7. A summary that invites curiosity and questions.  
    - At the very end of the explanation, always append `[LESSON COMPLETE]`.  

  - **Doubts or follow-up questions / Interruptions** →  
    - Call KnowledgeBaseSearch exactly once.  
    - If no result is found, say:  
      “That’s not exactly in your syllabus, but I can still explain it in a simple way,”  
      and then give a simplified answer.  
    - After answering, ALWAYS explicitly resume the main lesson from where it was paused. If a lesson has not yet started, immediately start a new lesson for the user’s topic by following the New topic steps (including tools) and then append `[LESSON COMPLETE]`.  

  - **Casual chit-chat** →  
    - Do not call any tools.  
    - Just reply warmly, like a friendly teacher.  

* IMPORTANT:  
 - If topic is **general or out of syllabus**, begin with:  
   "You’re asking something outside your syllabus, but here’s a brief overview:"  
   Then provide a short, simple explanation without calling tools.  
 - After such clarification, ALWAYS resume the syllabus-aligned topic or start the intended lesson right away (calling the tools once as in New topic).  
  - Never call the tools more than once for the same new topic.  
  - If a response already contains “[LESSON COMPLETE]”, do not re-teach the same topic. Instead, expand or answer questions naturally.  
  - Preserve raw file paths and YouTube links in the output for UI parsing, but DO NOT speak or explain the raw path values in the narration. Instead, refer to them as “this diagram” or “this video” in the explanation.

* If you don’t know something, admit it warmly and encourage curiosity.  

TOOLS AVAILABLE:  
- KnowledgeBaseSearch  
- ImageTool  
- VideoTool  
"""


# =======================
# Conversation memory
# =======================
memory_saver = MemorySaver()

# =======================
# Create ReAct agent
# =======================
agent = create_react_agent(
    llm,
    tools=[knowledgebase_tool, image_tool, video_tool],  # removed lesson_builder
    prompt=agent_system_prompt,
    checkpointer=memory_saver
)

# =======================
# Query function
# =======================
def ask_agent(question: str, thread_id="main") -> str:
    """
    Send a query to the AI Teacher Agent and get a response.
    Maintains memory context across the session using thread_id.
    Includes debug statements for all steps.
    """
    print(f"[DEBUG] Calling agent.invoke with question: {question} | thread_id: {thread_id}")
    try:
        response = agent.invoke(
            {"messages": [("human", question)]},
            config={"configurable": {"thread_id": thread_id}}
        )
        if response and response.get("messages"):
            output = response["messages"][-1].content
            print(f"[DEBUG] AI output (final message, first 200 chars): {output[:200]}...")
            return output
        else:
            print("[DEBUG] agent.invoke: No messages in response, returning empty string.")
            return ""
    except Exception as e:
        print(f"[ERROR] agent.invoke raised an exception: {e}")
        traceback.print_exc()
        return f"Sorry, an error occurred while processing your request: {e}"

if __name__ == "__main__":
    print("Testing dynamic AI Teacher Agent with LangGraph (Groq LLaMA)...")
    test_query = "Explain photosynthesis."
    print(f"Question: {test_query}")
    print("Answer:")
    print(ask_agent(test_query))
