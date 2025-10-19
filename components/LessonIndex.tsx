import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import lessonsData from '../frontend_lessons.json';

interface Subchapter {
  title: string;
  children: Subchapter[];
}

interface Chapter {
  chapter_number: string;
  chapter_title: string;
  subchapters: Subchapter[];
}

interface LessonsData {
  chapters: Chapter[];
}

const LessonItem: React.FC<{ subchapter: Subchapter; level: number; onTopicSelect: (topic: string) => void }> = ({ 
  subchapter, 
  level, 
  onTopicSelect 
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const handleClick = () => {
    if (subchapter.children.length > 0) {
      setIsExpanded(!isExpanded);
    } else {
      onTopicSelect(subchapter.title);
    }
  };

  return (
    <div className="my-1">
      <div 
        onClick={handleClick}
        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
          subchapter.children.length > 0 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        <div className="flex items-center flex-1">
          <div style={{ marginLeft: `${level * 20}px` }} className="flex items-center">
            {subchapter.children.length > 0 && (
              <svg 
                className={`w-4 h-4 mr-2 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            <span className="text-white text-sm md:text-base">
              {subchapter.title}
            </span>
          </div>
        </div>
        {subchapter.children.length === 0 && (
          <span className="text-green-300 text-xs bg-green-800 px-2 py-1 rounded ml-2">
            Study
          </span>
        )}
      </div>
      
      {isExpanded && subchapter.children.length > 0 && (
        <div className="ml-4 border-l-2 border-gray-600 pl-2">
          {subchapter.children.map((child, index) => (
            <LessonItem 
              key={index} 
              subchapter={child} 
              level={level + 1} 
              onTopicSelect={onTopicSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LessonIndex: React.FC = () => {
  const navigate = useNavigate();
  const data = lessonsData as LessonsData;

  const handleTopicSelect = (topic: string) => {
    navigate('/ask', { state: { selectedTopic: topic } });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            ← Back to Home
          </button>
          <button
            onClick={() => navigate('/ask')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Ask AIRA
          </button>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">Lesson Index</h1>
        <p className="text-gray-400 text-center mb-8">Select a topic to start learning</p>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          {data.chapters.map((chapter) => (
            <div key={chapter.chapter_number} className="mb-8 last:mb-0">
              <h2 className="text-xl md:text-2xl font-semibold text-green-400 mb-4 p-3 bg-gray-750 rounded-lg">
                Chapter {chapter.chapter_number}: {chapter.chapter_title}
              </h2>
              <div className="space-y-1">
                {chapter.subchapters.map((subchapter, index) => (
                  <LessonItem 
                    key={index} 
                    subchapter={subchapter} 
                    level={0} 
                    onTopicSelect={handleTopicSelect}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};