Of course! Here's the updated `README.md` file with FastAPI and uvicorn details included.

---

# AIRA: Smart AI Teacher 🤖

An intelligent, agent-based educational system designed to deliver interactive, personalized, and multimedia-rich science lessons. AIRA leverages cutting-edge AI to create a dynamic and responsive learning experience, acting as a smart teaching assistant.

HOME PAGE

<img width="1920" height="1080" alt="Screenshot (77)" src="https://github.com/user-attachments/assets/1c2da01f-0b09-4e95-a32e-bb2a5433cd64" />

LESSON INDEX

<img width="1920" height="1080" alt="Screenshot (79)" src="https://github.com/user-attachments/assets/3179b081-0f8a-4488-96c4-7b6d7d961119" />

ASK AIRA

<img width="1920" height="1080" alt="Screenshot (80)" src="https://github.com/user-attachments/assets/0d3ffb34-7301-472b-9ca2-ad9ba30bed00" />

FIGURE 

<img width="1920" height="1080" alt="Screenshot (81)" src="https://github.com/user-attachments/assets/fd66c877-4406-4ab2-9ffe-570dbb00d543" />

VIDEO 

<img width="1920" height="1080" alt="Screenshot (82)" src="https://github.com/user-attachments/assets/66269a6f-fffa-4ea4-8898-4e9e0b7b944e" />







---

## ✨ Features

- **🧠 Intelligent Lesson Delivery**: Powered by a LangChain Agent with a RAG (Retrieval-Augmented Generation) pipeline for accurate, curriculum-aligned explanations.
- **🎙️ Voice-First Interaction**: Real-time, conversational voice interaction using Speech-to-Text and Text-to-Speech.
- **🖼️ Multimedia Integration**: Dynamically displays relevant images and embeds educational YouTube videos alongside explanations.
- **⏸️ Interactive Learning**: Allows students to interrupt the lesson at any time to ask doubts, which are handled contextually before resuming.
- **🧩 Context & Memory**: Manages conversation flow and memory using LangGraph, ensuring lessons can pause and resume seamlessly.
- **💻 User-Friendly Interface**: Built with React for a smooth and engaging student experience.

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React |
| **Backend API** | FastAPI, Uvicorn |
| **AI Agent & Orchestration** | LangChain, LangGraph |
| **Language Model** | GPT (or specify your LLM, e.g., Llama, OpenAI) |
| **Semantic Search & Vector Store** | FAISS |
| **Knowledge Base** | Syllabus-aligned JSON data |
| **Speech Processing** | Vibe Speech Recognition (STT), (Specify your TTS) |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js (for the React frontend)
- An API key for your chosen LLM (e.g., OpenAI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/AIRA-Smart-AI-Teacher.git
   cd AIRA-Smart-AI-Teacher
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   # Set up your environment variables (LLM API keys, etc.)
   ```

3. **Run the Backend Server**
   ```bash
   uvicorn app:app --reload --port 8000
   ```
   The FastAPI server will start at `http://localhost:8000`
   - API documentation will be available at `http://localhost:8000/docs`

4. **Frontend Setup**
   ```bash
  
   npm install
   npm run dev
   ```
   The React frontend will be available at `http://localhost:3000`

5. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`
   - Ensure the backend is running on `http://localhost:8000`

---



## 🎥 Demo

See AIRA in action! Watch our full demo video below:

[![AIRA Demo Video](https://img.shields.io/badge/Watch-Demo_Video-red?style=for-the-badge)](https://drive.google.com/file/d/1YSNfnA3dv9BZl4HaEdXAIVWmxoSm0m6o/view?usp=drive_link)

---

## 👨‍💻 Team

This project was developed by the following team members from the Department of Artificial Intelligence & Machine Learning, Vivekananda College of Engineering & Technology, Puttur:

- **M Anusha Shetty**
- **Maneesh V**
- **[Nithin Shetty M](https://nithinshettym-official.netlify.app/)**
- **Rishal Jasmine D Souza**

**Guided by:** Prof. Abhishek Kumar K

---

## 📜 License

This project is licensed for academic use. Please contact the authors for more information.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues).

---

## 📞 Contact

[If you have any questions, please feel free to reach out to us via LinkedIn (links above) or open an issue on this repository.
](https://nithinshettym-official.netlify.app/)
---

<div align="center">

### If you found this project interesting, please give it a ⭐!

</div>

---
