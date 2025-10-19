from langchain_openai import ChatOpenAI   # OpenAI-compatible wrapper for Groq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from agent_tools import knowledgebase_tool, image_tool, video_tool
import traceback
import os
from pathlib import Path
try:
    from dotenv import load_dotenv  # type: ignore
except Exception:
    load_dotenv = None  # type: ignore

# =======================
# Your Groq API Key
# =======================
if load_dotenv is not None:
    # Load project .env and services/.env if present
    project_root = Path(__file__).resolve().parent
    load_dotenv(project_root / ".env")
    load_dotenv(project_root / "services" / ".env")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("[WARN] GROQ_API_KEY is not set. Set it in your environment to enable LLM responses.")

# =======================
# Initialize Groq LLM
# =======================
agent = None
llm = None
if GROQ_API_KEY:
    llm = ChatOpenAI(
        model="llama-3.3-70b-versatile",   # choices: "llama3-70b-8192", "mixtral-8x7b-32768", "llama3-8b-8192"
        temperature=0.7,
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )
    print(f"[DEBUG] Initialized Groq LLM: model={llm.model_name}, temperature={llm.temperature}")

agent_system_prompt = """
You are an engaging, empathetic, and knowledgeable AI science teacher for middle-school students.  

INSTRUCTIONS:

* Always respond in a warm, student-friendly, and enthusiastic tone, like a real classroom teacher.  

* FIRST, check if the student's topic is within syllabus:
  - If topic is **general or out of syllabus**, begin with:  
    "You're asking something outside your syllabus, but here's a brief overview:"  
    Then provide a short, simple explanation without calling any tools.
    After this clarification, gently guide back to syllabus topics.
  
  - If topic is **within syllabus**, proceed with the appropriate flow below.

* Distinguish between three types of student input for IN-SYLLABUS topics:  

  - **New topic** →  
    - Call knowledgebase_tool, image_tool, and video_tool exactly once each using proper function calling.
    - Use their outputs to generate a single enriched lesson following this structured flow:
        1. A funny or engaging introduction
        2. Begin with basic concept explanation
        3. When reaching a key visual concept:
           - Naturally introduce the image: "Let me show you a diagram that will help explain this..."
           - Include the exact image path
           - Explain what the image shows
           - Smoothly continue the lesson building upon what the image illustrated
        4. Continue with more detailed explanation
        5. Natural mention of the image reference. If ImageTool provides a result, always include the **exact path** and description in the explanation. Example:  
           "Here's a diagram to help you picture this: Figure 7.3 Human brain (see: /home/ailab/Documents/working/AIRA/images/Figure_7.3.png)"  
        6. Natural mention of the video reference. If VideoTool provides a result, always include the **exact YouTube link** in the explanation. Example:  
           "Let's watch this short video: How Your Brain Works? - The Dr. Binocs Show (YouTube: https://www.youtube.com/watch?v=ndDpjT0_IM0)"  
        7. End with a real-world application example
        8. Close by asking: "Do you have any doubts?"
    - At the very end of the explanation, always append `[LESSON COMPLETE]`.  

   - **Doubts or follow-up questions / Interruptions** →  
    - Call knowledgebase_tool exactly once using proper function calling.  
    - If user asks about image or video do same thing that were done for lesson topic initially, by calling image tool for image and video tool for video.
    - If no result is found, say:  
       "That's not exactly in your syllabus, but I can still explain it in a simple way,"  
      and then give a simplified answer.  
    - After answering, ALWAYS explicitly resume the main lesson from where it was paused. If a lesson has not yet started, immediately start a new lesson for the user's topic by following the New topic steps (including tools) and then append `[LESSON COMPLETE]`.  

  - **Casual chit-chat** →  
     - Do not call any tools.  
     - Just reply warmly, like a friendly teacher.  

 * IMPORTANT:  
  - After handling an interruption: first answer the student's question, then explicitly say: "Any clarification needed?" WAIT for 5-7 seconds before continuing. If the student asks something far from the current topic, begin your reply with: "You're deviating from the current lesson, but here's a quick answer:" give a brief answer, then smoothly continue the main lesson where it was interrupted, and end with "Do you have any doubts?" then wait for 6 seconds : If no query from student side naturally continue with lesson with "I believe you are clear with topic now let's continue with topic.. " and continue the topic . Do not include raw URLs/paths in narration.
  - Never call the tools more than once for the same new topic.  
  - If a response already contains "[LESSON COMPLETE]", do not re-teach the same topic. Instead, expand or answer questions naturally.  
  - Preserve raw file paths and YouTube links in the output for UI parsing, but DO NOT speak or explain the raw path values in the narration. Instead, refer to them as "this diagram" or "this video" in the explanation.
  - Never output code-formatted or XML/angle-bracket tool markup (e.g., <function=.../>). Only invoke tools via the function-calling interface provided to you.

 * If you don't know something, admit it warmly and encourage curiosity.  

 TOOLS AVAILABLE (exact function names):  
 - knowledgebase_tool  
 - image_tool  
 - video_tool  
"""

# Template for the agent
template = """
Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}
"""

# =======================
# Conversation memory
# =======================
memory_saver = MemorySaver()

# =======================
# Create ReAct agent
# =======================
if llm is not None:
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
    If no GROQ_API_KEY is configured, return a friendly fallback message so the server stays up.
    """
    if agent is None:
        return (
            "LLM is disabled because GROQ_API_KEY is not set on the server. "
            "Set GROQ_API_KEY and restart the backend to enable AI answers."
        )
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
        # Log detailed error and surface helpful hint when function calling fails
        error_text = str(e)
        if "failed_generation" in error_text:
            print("[ERROR] agent.invoke failed_generation detail detected:")
            print(error_text)
        else:
            print(f"[ERROR] agent.invoke raised an exception: {error_text}")
        traceback.print_exc()
        return f"Sorry, an error occurred while processing your request: {error_text}"

if __name__ == "__main__":
    print("Testing dynamic AI Teacher Agent with LangGraph (Groq LLaMA)...")
    test_query = "Explain photosynthesis."
    print(f"Question: {test_query}")
    print("Answer:")
    print(ask_agent(test_query))
