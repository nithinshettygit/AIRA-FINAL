# AIRA - AI Science Teacher 🤖📚

<div align="center">

![AIRA Logo](https://img.shields.io/badge/AIRA-AI%20Teaching%20Assistant-blue?style=for-the-badge&logo=robot&logoColor=white)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.68.0-009688?style=for-the-badge&logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-3178C6?style=for-the-badge&logo=typescript)

**Your Intelligent Science Teaching Assistant for Interactive Learning**

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [API](#api) • [Structure](#project-structure)

</div>

## 🎯 Overview

AIRA is an advanced AI-powered science teaching assistant that provides interactive, personalized learning experiences for students. It combines voice interaction, real-time media sequencing, and comprehensive lesson management to create an engaging educational environment.

## ✨ Features

### 🎤 Multi-Modal Interaction
- **Voice Input**: Advanced speech recognition with real-time transcription
- **Text Input**: Traditional text-based queries
- **Smart Interruption**: Seamlessly interrupt and ask questions during lessons

### 🎭 Immersive Experience
- **Animated Robot Avatar**: Real-time lip-sync and facial animations
- **Media Sequencing**: Automatic display of images, videos, and explanations
- **Text-to-Speech**: Natural voice narration with visual subtitles

### 📚 Comprehensive Learning
- **Lesson Index**: Structured curriculum with hierarchical topic organization
- **Session Notes**: Automatic note-taking with bullet-point summaries
- **Progress Tracking**: Persistent conversation memory across sessions

### 🛠 Technical Excellence
- **Real-time Processing**: Instant response with media queuing
- **Responsive Design**: Works seamlessly across all devices
- **Type Safety**: Full TypeScript implementation
- **Modular Architecture**: Clean, maintainable code structure

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Groq API key (for AI responses)

### Installation

1. **Clone the Repository**
```bash
git clone <your-repo-url>
cd AIRA
```

2. **Frontend Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

3. **Backend Setup**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Add your Groq API key to .env

# Start backend server
python server.py
```

4. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## 🎮 Usage

### Home Page
- **AIRA Landing**: Welcome screen with two main options
- **ASK AIRA**: Direct interaction with the AI teacher
- **LESSON INDEX**: Browse structured curriculum topics

### Interactive Learning
1. **Start a Lesson**: Choose from lesson index or ask directly
2. **Engage with Content**: Watch videos, view images, listen to explanations
3. **Ask Questions**: Interrupt anytime with voice or text
4. **Review Notes**: Access automatically generated session notes

### Voice Commands
- Click the microphone icon to start speaking
- System automatically detects speech and silence
- Real-time transcription with confidence indicators

## 🏗 Project Structure

```
AIRA/
├── src/                    # Frontend React Application
│   ├── components/         # React Components
│   │   ├── HomePage.tsx    # Landing page
│   │   ├── LessonIndex.tsx # Curriculum browser
│   │   ├── RobotAvatar.tsx # Animated robot
│   │   ├── MessageDisplay.tsx # Subtitles
│   │   ├── InputBar.tsx    # Voice/text input
│   │   └── NotesModal.tsx  # Session notes
│   ├── hooks/
│   │   └── useMediaSequencer.ts # Media management
│   ├── services/           # Business logic
│   │   ├── apiService.ts   # Backend communication
│   │   ├── ttsService.ts   # Text-to-speech
│   │   └── notesService.ts # Session notes
│   ├── types.ts           # TypeScript definitions
│   └── constants.ts       # Application constants
├── backend/               # Python FastAPI Server
│   ├── server.py         # Main API server
│   ├── agent.py          # AI agent with LangChain
│   ├── agent_tools.py    # Custom tools for AI
│   ├── utils.py          # Utility functions
│   └── knowledgebase/    # Educational content
└── configuration/
    ├── package.json      # Node.js dependencies
    ├── requirements.txt  # Python dependencies
    └── vite.config.ts   # Build configuration
```

## 🔧 API Endpoints

### Backend Routes
- `POST /chat` - Get AI teacher responses
- `POST /transcribe` - Convert audio to text
- `GET /images/*` - Serve educational images

### Frontend Routes
- `/` - Home page with AIRA introduction
- `/ask` - Interactive chat interface
- `/lessons` - Curriculum topic browser

## 🎯 Key Components

### 🤖 RobotAvatar
- Real-time facial animations
- Lip-sync with speech
- Emotional expressions
- Media overlay support

### 🎤 InputBar
- Dual input modes (voice/text)
- Smart silence detection
- Real-time audio visualization
- Session control buttons

### 📖 LessonIndex
- Hierarchical topic organization
- Expandable/collapsible sections
- One-click topic selection
- Progress indicators

### 📝 NotesModal
- Automatic session summarization
- Bullet-point formatting
- Copy-to-clipboard functionality
- Persistent local storage

## 🔄 Media Sequencing

AIRA intelligently sequences learning content:

1. **Text Explanation** → TTS with subtitles
2. **Visual Aids** → Images with descriptions  
3. **Video Content** → YouTube integration
4. **Interactive Q&A** → Real-time interruptions

## 🛠 Development

### Adding New Features
1. Create component in `src/components/`
2. Add TypeScript definitions in `types.ts`
3. Implement services in `src/services/`
4. Update routing in `App.tsx`

### Backend Extensions
1. Add new tools in `agent_tools.py`
2. Create API routes in `server.py`
3. Update agent prompts in `agent.py`

### Environment Variables
```env
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=optional_openai_key
BACKEND_URL=http://localhost:8000
```

## 📊 Performance

- **Fast Response Times**: <2s for AI responses
- **Real-time Processing**: Instant voice transcription
- **Smooth Animations**: 60fps robot animations
- **Optimized Media**: Efficient image/video loading

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing frontend framework
- **FastAPI** for high-performance backend API
- **Groq** for lightning-fast AI inference
- **LangChain** for powerful AI agent capabilities
- **Tailwind CSS** for beautiful, responsive styling

## 📞 Support

For support and questions:
- 📧 Email: 

---

<div align="center">

**Made with ❤️ for the future of education**

*"Empowering every student with personalized AI tutoring"*

[⬆ Back to Top](#aira---ai-science-teacher-)

</div>