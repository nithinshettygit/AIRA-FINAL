# AI Science Teacher (AIRA)

AIRA is an engaging, empathetic, and knowledgeable AI Science Teacher designed for middle-school students. It utilizes LangGraph, LLaMA 3.3 (via Groq), and various tools to provide interactive lessons, answer doubts, and enrich the learning experience with images and videos.

## 🚀 Features

- **Interactive Lessons**: Enriched with diagrams and educational videos.
- **Voice Interaction**: Support for local transcription (faster-whisper) and cloud-based options.
- **Intelligent Routing**: Distinguishes between syllabus-related topics, casual chat, and interruptions.
- **Multimedia Search**: Automated retrieval of relevant images from a local science textbook knowledge base and educational videos from YouTube.
- **Context-Aware**: Resumes lessons smoothly after answering student's side questions.

## 🛠️ Tech Stack

- **Backend**: FastAPI, LangChain, LangGraph, Groq (LLM), FAISS (Vector Store).
- **Frontend**: React, TypeScript, Vite, Tailwind CSS.
- **AI Models**: LLaMA 3.3 (Groq), Sentence Transformers (Embeddings).

## 📋 Prerequisites

- Python 3.10+
- Node.js & npm
- FFmpeg (for audio processing)
- Groq API Key
- OpenAI API Key (Optional, for Whisper transcription)

## ⚙️ Setup Instructions

### Backend Setup

1. **Create Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key
   OPENAI_API_KEY=your_openai_api_key (optional)
   LOCAL_WHISPER=0  # Set to 1 to use local faster-whisper
   ```

4. **Run the Server**:
   ```bash
   python server.py
   ```

### Frontend Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `server.py`: FastAPI backend entry point.
- `agent.py`: LangGraph agent definition and logic.
- `agent_tools.py`: Tool definitions (Knowledgebase, Image, Video).
- `knowledgebase.json`: Processed science textbook content.
- `images/`: Local store for textbook diagrams.
- `App.tsx`: Main React component for the chat interface.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.