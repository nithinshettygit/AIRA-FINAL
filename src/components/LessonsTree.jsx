import React, { useState } from "react";
import { useUser } from "../contexts/UserContext";

const TreeNode = ({ node, onSelect, level = 0, isCompleted = false, computeCompleted }) => {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const [expanded, setExpanded] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      setExpanded((prev) => !prev);
    } else if (onSelect) {
      onSelect(node.title);
    }
  };

  const indentStyle = {
    marginLeft: level * 16,
    paddingLeft: level > 0 ? 8 : 0,
    borderLeft: level > 0 ? "1px solid #e0e0e0" : "none"
  };

  const getNodeStyle = () => {
    const baseStyle = {
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 12px",
      borderRadius: 8,
      marginBottom: 4,
      fontSize: hasChildren ? "14px" : "13px",
      fontWeight: hasChildren ? 600 : 400,
      transition: "all 0.3s ease",
      position: "relative",
      overflow: "hidden"
    };

    if (isCompleted) {
      return {
        ...baseStyle,
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        border: "1px solid rgba(34, 197, 94, 0.3)",
        color: "#15803d",
        boxShadow: "0 2px 8px rgba(34, 197, 94, 0.1)"
      };
    }

    if (hasChildren) {
      return {
        ...baseStyle,
        backgroundColor: "#f8f9fa",
        border: "1px solid #e9ecef",
        color: "#495057"
      };
    }

    return {
      ...baseStyle,
      backgroundColor: "transparent",
      border: "1px solid transparent",
      color: "#6c757d"
    };
  };

  const hoverStyle = isCompleted 
    ? {
        backgroundColor: "rgba(34, 197, 94, 0.25)",
        borderColor: "rgba(34, 197, 94, 0.5)",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)"
      }
    : {
        backgroundColor: "#e3f2fd",
        borderColor: "#2196f3",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px rgba(33, 150, 243, 0.15)"
      };

  return (
    <div style={indentStyle}>
      <div
        onClick={handleClick}
        style={getNodeStyle()}
        title={`${node.title}${isCompleted ? ' ✓ Completed' : ''}`}
        onMouseEnter={(e) => {
          Object.assign(e.target.style, hoverStyle);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.target.style, getNodeStyle());
        }}
      >
        {isCompleted && (
          <span style={{ 
            position: "absolute", 
            top: 4, 
            right: 4, 
            fontSize: "12px", 
            color: "#16a34a",
            fontWeight: "bold"
          }}>
            ✓
          </span>
        )}
        
        {hasChildren ? (
          <span style={{ 
            fontWeight: 600, 
            color: isCompleted ? "#15803d" : "#2196f3", 
            minWidth: 16,
            transition: "color 0.3s ease"
          }}>
            {expanded ? "▾" : "▸"}
          </span>
        ) : (
          <span style={{ 
            width: 16, 
            color: isCompleted ? "#16a34a" : "#666",
            fontSize: "16px",
            fontWeight: "bold"
          }}>
            {isCompleted ? "✓" : "•"}
          </span>
        )}
        <span style={{ flex: 1 }}>{node.title}</span>
      </div>
      {hasChildren && expanded && (
        <div style={{ marginTop: 4 }}>
          {node.children.map((child, idx) => {
            const childCompleted = typeof computeCompleted === 'function' 
              ? computeCompleted(child) 
              : false;
            return (
              <TreeNode 
                key={`${node.title}-${idx}`} 
                node={child} 
                onSelect={onSelect}
                level={level + 1}
                isCompleted={childCompleted}
                computeCompleted={computeCompleted}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const LessonsTree = ({ data, onSelect }) => {
  const { isLessonCompleted, isChapterCompleted, markLessonCompleted, markChapterCompleted } = useUser();
  
  if (!data || !Array.isArray(data.chapters)) return null;

  // Determine if a given node (subchapter or child) is completed
  // Leaf: completed if its title is marked completed
  // Non-leaf: completed only if ALL children (recursively) are completed
  const computeNodeCompleted = (node) => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    if (!hasChildren) {
      return isLessonCompleted(node.title);
    }
    return node.children.every((child) => computeNodeCompleted(child));
  };

  // Recursive function to get all lessons from a chapter
  const getAllLessonsFromChapter = (chapter) => {
    const allLessons = [];
    
    const collectLessons = (items) => {
      items.forEach(item => {
        allLessons.push(item.title);
        if (item.children && item.children.length > 0) {
          collectLessons(item.children); // Recursively collect from nested children
        }
      });
    };
    
    if (chapter.subchapters) {
      collectLessons(chapter.subchapters);
    }
    
    return allLessons;
  };

  const handleLessonSelect = (title) => {
    markLessonCompleted(title);
    onSelect(title);
    
    // Check if this lesson belongs to a chapter that might now be completed
    data.chapters.forEach(chapter => {
      // Get ALL lessons in this chapter (including nested children)
      const allLessonsInChapter = getAllLessonsFromChapter(chapter);
      
      // Check if all lessons in this chapter are completed
      const allCompleted = allLessonsInChapter.every(lessonTitle => 
        isLessonCompleted(lessonTitle)
      );
      
      if (allCompleted && allLessonsInChapter.length > 0) {
        markChapterCompleted(chapter.chapter_title, allLessonsInChapter);
      }
    });
  };

  return (
    <div style={{ 
      maxHeight: "600px", 
      overflowY: "auto",
      padding: "16px",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      borderRadius: "12px",
      border: "1px solid #e2e8f0"
    }}>
      {data.chapters.map((chapter) => {
        const chapterCompleted = isChapterCompleted(chapter.chapter_title);
        
        return (
          <div key={chapter.chapter_title} style={{ marginBottom: 20 }}>
            <div style={{ 
              fontWeight: 700, 
              marginBottom: 12,
              padding: "12px 16px",
              background: chapterCompleted 
                ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
                : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
              color: "white",
              borderRadius: 12,
              fontSize: "16px",
              position: "relative",
              boxShadow: chapterCompleted 
                ? "0 4px 15px rgba(34, 197, 94, 0.3)"
                : "0 4px 15px rgba(96, 165, 250, 0.4)",
              transition: "all 0.3s ease",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)"
            }}>
              {chapterCompleted && (
                <span style={{
                  position: "absolute",
                  top: "8px",
                  right: "12px",
                  fontSize: "18px",
                  fontWeight: "bold"
                }}>
                  ✓
                </span>
              )}
              
              <span style={{ 
                fontSize: "12px", 
                opacity: 0.8, 
                display: "block", 
                marginBottom: "2px" 
              }}>
                {chapterCompleted ? "COMPLETED CHAPTER" : "CHAPTER"}
              </span>
              
              {chapter.chapter_number ? `${chapter.chapter_number}. ` : ""}
              {chapter.chapter_title}
            </div>
            
            <div style={{ paddingLeft: 8 }}>
              {Array.isArray(chapter.subchapters) && chapter.subchapters.map((sub, idx) => {
                const subCompleted = computeNodeCompleted(sub);
                
                return (
                  <TreeNode 
                    key={`${chapter.chapter_title}-${idx}`} 
                    node={{ title: sub.title, children: sub.children || [] }} 
                    onSelect={handleLessonSelect}
                    level={0}
                    isCompleted={subCompleted}
                    computeCompleted={computeNodeCompleted}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LessonsTree;



