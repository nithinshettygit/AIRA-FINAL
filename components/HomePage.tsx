import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// NOTE: Ensure your project structure includes the 'HomePage.css' file 
// and that it is imported/included correctly for the custom animations.
// import './HomePage.css'; 

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number; x: number; y: number; size: number; delay: number}>>([]);

  useEffect(() => {
    setIsVisible(true);
    
    // Create floating particles
    const newParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans">
      
      {/* Animated Background Particles and Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-cyan-400 opacity-20 animate-float-standard"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${15 + particle.delay * 2}s`
            }}
          />
        ))}
        
        <div className="absolute -top-40 -right-40 w-72 h-72 bg-purple-500 rounded-full mix-blend-lighten filter blur-3xl opacity-15 animate-pulse-slow-orb custom-delay-2s"></div>
        <div className="absolute -bottom-40 -left-40 w-72 h-72 bg-blue-500 rounded-full mix-blend-lighten filter blur-3xl opacity-15 animate-pulse-slow-orb custom-delay-4s"></div>
      </div>

      {/* Main Content Container */}
      <div className={`relative z-10 text-center transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        
        {/* AIRA Logo Section */}
        <div className="mb-10 relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-full blur-lg opacity-30 animate-pulse-standard"></div>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent relative z-10 animate-glow-standard">
            AIRA
          </h1>
        </div>

        {/* Subtitle/Slogan Section */}
        <div className="mb-20">
          <p className="text-xl md:text-2xl text-gray-300 font-light mb-4">
            Your Smart AI Teaching Assistant
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto rounded-full animate-expand-standard"></div>
        </div>

        {/* Action Buttons Section - Includes Descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl w-full mx-auto mb-24">
          
          {/* ASK AIRA Button */}
          <button
            onClick={() => navigate('/ask')}
            className="group relative bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-5 px-6 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            
            {/* Content updated to use flex-col and separate description */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="text-xl">ASK AIRA</span>
              </div>
              {/* Short Description */}
              <p className="text-sm font-normal text-gray-300 opacity-90 mt-1">
                AI-Powered Q&A and instant learning support.
              </p> 
            </div>
          </button>

          {/* LESSON INDEX Button */}
          <button
            onClick={() => navigate('/lessons')}
            className="group relative bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white font-semibold py-5 px-6 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            
            {/* Content updated to use flex-col and separate description */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xl">LESSON INDEX</span>
              </div>
              {/* Short Description */}
              <p className="text-sm font-normal text-gray-300 opacity-90 mt-1">
                Browse structured, adaptive learning modules.
              </p>
            </div>
          </button>
        </div>

        {/* Feature Highlights Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div className="text-cyan-400 text-3xl mb-3">🤖</div>
            <h3 className="text-white font-semibold mb-1">AI Powered</h3>
            <p className="text-gray-400 text-sm">Smart, adaptive learning engine.</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="text-blue-400 text-3xl mb-3">🎯</div>
            <h3 className="text-white font-semibold mb-1">Personalized</h3>
            <p className="text-gray-400 text-sm">Lessons tailored to your pace.</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/20">
            <div className="text-purple-400 text-3xl mb-3">⚡</div>
            <h3 className="text-white font-semibold mb-1">Interactive</h3>
            <p className="text-gray-400 text-sm">Engaging, real-time feedback.</p>
          </div>
        </div>

        {/* Footer Note Section */}
        <div className="mt-16">
          <p className="text-gray-500 text-sm">
            Start your learning journey today.
          </p>
        </div>
      </div>
    </div>
  );
};