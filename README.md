# 🎓 AIRA Frontend - AI Science Teacher Interface

<div align="center">
  <img width="800" height="400" alt="AIRA Frontend" src="https://via.placeholder.com/800x400/1f2937/ffffff?text=AIRA+Frontend+Interface" />
</div>

## 📋 Project Overview

The **AIRA Frontend** is a modern React-based web application that provides an intuitive user interface for the AI Science Teacher platform. It features user authentication, lesson management, and an interactive learning environment designed for middle-school students.

## 🚀 Features

### 🔐 **User Authentication**
- **Firebase Authentication** integration
- User registration and login
- Secure session management
- Protected routes and user context

### 📚 **Lesson Management**
- Interactive lesson tree navigation
- Structured curriculum display
- Progress tracking capabilities
- Dynamic content loading

### 🤖 **AI Chat Interface**
- Real-time chat with AI teacher
- Context-aware conversations
- Multimedia support for images and videos
- Responsive design for all devices

### 🎨 **Modern UI/UX**
- Clean, student-friendly interface
- Responsive design (mobile-first)
- Dark theme with engaging colors
- Smooth animations and transitions

## 🛠️ Technology Stack

### **Frontend Technologies**
- **React 18.2.0** - Modern UI library
- **Vite 5.0.0** - Fast build tool and dev server
- **React Router DOM 6.20.1** - Client-side routing
- **Firebase 12.3.0** - Authentication and database
- **ESLint** - Code quality and consistency

### **Development Tools**
- **TypeScript** support (dev dependencies)
- **ESLint** with React plugins
- **Vite** for fast development and building
- **Modern JavaScript** (ES6+)

## 📁 Project Structure

```
FRONTEND/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── LessonsTree.jsx  # Interactive lesson navigation
│   ├── contexts/            # React context providers
│   │   └── UserContext.jsx  # User authentication context
│   ├── data/               # Static data and JSON files
│   │   ├── frontend_lessons.js
│   │   └── frontend_lessons.json
│   ├── firebase/           # Firebase configuration
│   │   └── config.js       # Firebase setup and config
│   ├── pages/              # Main application pages
│   │   ├── Welcome.jsx     # Landing page
│   │   ├── Login.jsx       # User login
│   │   ├── Signup.jsx      # User registration
│   │   ├── Home.jsx        # Dashboard/home
│   │   └── Bot.jsx         # AI chat interface
│   ├── App.jsx             # Main application component
│   └── main.jsx            # Application entry point
├── JSON/                   # Data processing scripts
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
└── .env                    # Environment variables
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase project setup

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/nithinshettygit/AIRA-FINAL.git
   cd AIRA-FINAL
   git checkout frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Configure Firebase credentials in `.env`
   - Update Firebase configuration in `src/firebase/config.js`

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### **Environment Variables**
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Development
NODE_ENV=development
VITE_APP_TITLE=AIRA Frontend
```

### **Firebase Setup**
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Copy configuration to `src/firebase/config.js`

## 📱 Pages & Features

### **Welcome Page** (`/`)
- Landing page with project introduction
- Call-to-action buttons for login/signup
- Responsive design with engaging visuals

### **Authentication** (`/login`, `/signup`)
- Firebase-powered user authentication
- Form validation and error handling
- Secure session management

### **Home Dashboard** (`/home`)
- User dashboard with lesson overview
- Interactive lesson tree navigation
- Progress tracking and statistics

### **AI Chat Interface** (`/bot`)
- Real-time chat with AI teacher
- Context-aware conversations
- Multimedia support for learning materials

## 🎨 UI/UX Design

### **Design Principles**
- **Student-Friendly**: Clean, engaging interface designed for middle-school students
- **Accessibility**: WCAG compliant with proper contrast and navigation
- **Responsive**: Mobile-first design that works on all devices
- **Performance**: Optimized for fast loading and smooth interactions

### **Color Scheme**
- Primary: Dark theme with blue accents
- Secondary: White text on dark backgrounds
- Accent: Bright colors for interactive elements
- Success/Error: Green and red for feedback

## 🔒 Security Features

- **Firebase Authentication** for secure user management
- **Protected Routes** with authentication guards
- **Environment Variables** for sensitive configuration
- **Input Validation** on all forms
- **CORS Configuration** for API security

## 📊 Performance Optimizations

- **Vite** for fast development and optimized builds
- **Code Splitting** with React Router
- **Lazy Loading** for better initial load times
- **Optimized Images** and assets
- **Modern JavaScript** with tree shaking

## 🧪 Development

### **Available Scripts**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### **Code Quality**
- **ESLint** configuration with React rules
- **Consistent Code Style** across the project
- **Component-based Architecture** for maintainability
- **TypeScript Support** for type safety

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the AIRA (AI Science Teacher) platform. See the main repository for license information.

## 🔗 Related Projects

- **AIRA Backend**: Python FastAPI server with AI agent
- **AIRA NSM2**: Advanced AI teacher with multimedia support
- **AIRA Database**: Educational content and knowledge base

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the main AIRA repository

---

<div align="center">
  <p>Built with ❤️ for better science education</p>
  <p>© 2024 AIRA Project. All rights reserved.</p>
</div>
