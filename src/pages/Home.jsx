import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import LessonsTree from "../components/LessonsTree.jsx";
import lessonsData from "../data/frontend_lessons.json";

const Home = () => {
  const navigate = useNavigate();
  const { user, getProgressStats, logout } = useUser();
  const [query, setQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState(null); // null, 'lessons', or 'ask'
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);

  const data = useMemo(() => lessonsData, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectLesson = (title) => {
    const encoded = encodeURIComponent(title);
    navigate(`/bot?topic=${encoded}`);
  };

  const handleSubmitQuery = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const encoded = encodeURIComponent(query.trim());
    navigate(`/bot?query=${encoded}`);
  };

  const handleSignOut = async () => {
    try {
      setShowProfileDropdown(false);
      await logout();
      navigate("/login", { 
        state: { 
          message: "You have been successfully signed out." 
        } 
      });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleBackToWelcome = () => {
    navigate("/");
  };

  const optionBoxStyle = {
    cursor: "pointer",
    padding: "24px",
    borderRadius: "16px",
    border: "2px solid #e5e7eb",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    textAlign: "center",
    transition: "all 0.3s ease",
    transform: "scale(1)",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    minHeight: "200px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px"
  };

  const hoverStyle = {
    transform: "scale(1.05)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
    borderColor: "#3b82f6"
  };

  const selectedStyle = {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    borderColor: "#10b981",
    transform: "scale(1.02)"
  };

  const contentStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    animation: "fadeIn 0.5s ease-in"
  };

  if (selectedMode === null) {
    return (
      <div style={contentStyle}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ 
            fontSize: "36px", 
            fontWeight: "800", 
            marginBottom: "12px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Welcome to AIRA
          </h1>
          <p style={{ fontSize: "18px", color: "#6b7280", marginBottom: "20px" }}>
            Choose how you'd like to learn today
          </p>
          
          {/* User Status and Progress Tracking Indicator */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 20px",
            background: user && !user.isGuest 
              ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)"
              : "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)",
            borderRadius: "25px",
            border: `1px solid ${user && !user.isGuest ? "rgba(34, 197, 94, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
            marginBottom: "40px"
          }}>
            <div style={{
              fontSize: "20px"
            }}>
              {user && !user.isGuest ? "✅" : "⚠️"}
            </div>
            <div>
              <div style={{
                fontSize: "14px",
                fontWeight: "600",
                color: user && !user.isGuest ? "#16a34a" : "#f59e0b"
              }}>
                {user && !user.isGuest ? "Progress Tracking Active" : "Progress Tracking Disabled"}
              </div>
              <div style={{
                fontSize: "12px",
                color: "#6b7280"
              }}>
                {user ? `${user.name} (${user.isGuest ? "Guest Mode" : "Authenticated"})` : "Not logged in"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
          padding: "16px 24px",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)",
          borderRadius: "16px",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <button
            onClick={handleBackToWelcome}
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              background: "white",
              color: "#374151",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#f9fafb";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "white";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
            }}
          >
            🏠 Back to Welcome
          </button>

          {/* Profile Section */}
          {user && (
            <div style={{ position: "relative" }} ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  background: "white",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f9fafb";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "white";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                }}
              >
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: user.isGuest 
                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {user.isGuest ? "Guest User" : "Authenticated"}
                  </div>
                </div>
                <div style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  transform: showProfileDropdown ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease"
                }}>
                  ▼
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: "0",
                  marginTop: "8px",
                  background: "white",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                  overflow: "hidden",
                  zIndex: 1000,
                  minWidth: "200px"
                }}>
                  <div style={{
                    padding: "16px",
                    borderBottom: "1px solid #f3f4f6"
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {user.email}
                    </div>
                  </div>
                  
                  {user && !user.isGuest && (
                    <button
                      onClick={handleSignOut}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        background: "none",
                        color: "#dc2626",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "background 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "none";
                      }}
                    >
                      🚪 Sign Out
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "24px",
          maxWidth: "800px",
          margin: "0 auto"
        }}>
          <div
            style={optionBoxStyle}
            onClick={() => setSelectedMode('lessons')}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, { ...optionBoxStyle, ...hoverStyle });
            }}
            onMouseLeave={(e) => {
              Object.assign(e.target.style, optionBoxStyle);
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📚</div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", margin: "0" }}>
              Lesson Index
            </h2>
            <p style={{ fontSize: "16px", margin: "0", opacity: "0.9" }}>
              Browse through organized lessons and topics
            </p>
            <div style={{ 
              marginTop: "16px",
              fontSize: "14px",
              opacity: "0.8",
              fontStyle: "italic"
            }}>
              Click to explore →
            </div>
          </div>

          <div
            style={optionBoxStyle}
            onClick={() => setSelectedMode('ask')}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, { ...optionBoxStyle, ...hoverStyle });
            }}
            onMouseLeave={(e) => {
              Object.assign(e.target.style, optionBoxStyle);
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🤖</div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", margin: "0" }}>
              Ask AIRA
            </h2>
            <p style={{ fontSize: "16px", margin: "0", opacity: "0.9" }}>
              Ask any question and get personalized help
            </p>
            <div style={{ 
              marginTop: "16px",
              fontSize: "14px",
              opacity: "0.8",
              fontStyle: "italic"
            }}>
              Click to start chatting →
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedMode === 'lessons') {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        padding: "20px"
      }}>
        <div style={contentStyle}>
          <div style={{ 
            marginBottom: "32px", 
            display: "flex", 
            alignItems: "center", 
            gap: "16px",
            padding: "20px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "16px",
            color: "white",
            boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)"
          }}>
            <button 
              onClick={() => setSelectedMode(null)}
              style={{ 
                padding: "10px 20px", 
                borderRadius: "12px", 
                border: "2px solid rgba(255,255,255,0.3)", 
                cursor: "pointer",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,255,255,0.3)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.2)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              ← Back to Options
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "32px", fontWeight: "800", margin: "0" }}>📚 Lesson Index</h1>
              <p style={{ fontSize: "16px", margin: "4px 0 0 0", opacity: "0.9" }}>
                Browse through organized lessons and track your progress
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={handleBackToWelcome}
                style={{ 
                  padding: "8px 16px", 
                  borderRadius: "10px", 
                  border: "2px solid rgba(255,255,255,0.3)", 
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "600",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.15)";
                }}
              >
                🏠 Welcome
              </button>
              {user && !user.isGuest && (
                <button 
                  onClick={handleSignOut}
                  style={{ 
                    padding: "8px 16px", 
                    borderRadius: "10px", 
                    border: "2px solid rgba(255,255,255,0.3)", 
                    cursor: "pointer",
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(239, 68, 68, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(239, 68, 68, 0.2)";
                  }}
                >
                  🚪 Sign Out
                </button>
              )}
            </div>
          </div>
          
          <div style={{ 
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px", 
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}>
            <LessonsTree data={data} onSelect={handleSelectLesson} />
          </div>
        </div>
      </div>
    );
  }

  if (selectedMode === 'ask') {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        padding: "20px"
      }}>
        <div style={contentStyle}>
          <div style={{ 
            marginBottom: "32px", 
            display: "flex", 
            alignItems: "center", 
            gap: "16px",
            padding: "20px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: "16px",
            color: "white",
            boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)"
          }}>
            <button 
              onClick={() => setSelectedMode(null)}
              style={{ 
                padding: "10px 20px", 
                borderRadius: "12px", 
                border: "2px solid rgba(255,255,255,0.3)", 
                cursor: "pointer",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,255,255,0.3)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.2)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              ← Back to Options
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "32px", fontWeight: "800", margin: "0" }}>🤖 Ask AIRA</h1>
              <p style={{ fontSize: "16px", margin: "4px 0 0 0", opacity: "0.9" }}>
                Get personalized AI assistance for your studies
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={handleBackToWelcome}
                style={{ 
                  padding: "8px 16px", 
                  borderRadius: "10px", 
                  border: "2px solid rgba(255,255,255,0.3)", 
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "600",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.15)";
                }}
              >
                🏠 Welcome
              </button>
              {user && !user.isGuest && (
                <button 
                  onClick={handleSignOut}
                  style={{ 
                    padding: "8px 16px", 
                    borderRadius: "10px", 
                    border: "2px solid rgba(255,255,255,0.3)", 
                    cursor: "pointer",
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(239, 68, 68, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(239, 68, 68, 0.2)";
                  }}
                >
                  🚪 Sign Out
                </button>
              )}
            </div>
          </div>
          
          <div style={{ 
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px", 
            padding: "32px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ 
                fontSize: "80px", 
                marginBottom: "20px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>🤖</div>
              <h2 style={{ 
                fontSize: "28px", 
                fontWeight: "700", 
                marginBottom: "12px",
                color: "#1f2937"
              }}>
                How can I help you today?
              </h2>
              <p style={{ 
                color: "#6b7280", 
                fontSize: "18px",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: "1.6"
              }}>
                Ask me anything about your studies! I can explain concepts, solve problems, 
                and provide personalized learning assistance.
              </p>
            </div>
            
            <form onSubmit={handleSubmitQuery} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ position: "relative" }}>
                <textarea
                  rows={10}
                  placeholder="Type your question here... 

Examples:
• 'Explain photosynthesis in simple terms'
• 'Help me understand quadratic equations'
• 'What is the difference between mitosis and meiosis?'
• 'How do I solve this math problem: 2x + 5 = 13'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ 
                    width: "100%",
                    padding: "20px", 
                    borderRadius: "16px", 
                    border: "2px solid #e5e7eb", 
                    resize: "vertical",
                    fontSize: "16px",
                    fontFamily: "inherit",
                    transition: "all 0.3s ease",
                    outline: "none",
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    minHeight: "200px"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#10b981";
                    e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
                    e.target.style.transform = "translateY(-2px)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                    e.target.style.transform = "translateY(0)";
                  }}
                />
              </div>
              
              <div style={{ textAlign: "center" }}>
                <button 
                  type="submit" 
                  disabled={!query.trim()}
                  style={{ 
                    padding: "16px 40px", 
                    borderRadius: "16px", 
                    border: "none",
                    background: query.trim() 
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
                    color: "white",
                    cursor: query.trim() ? "pointer" : "not-allowed",
                    fontSize: "18px",
                    fontWeight: "700",
                    transition: "all 0.3s ease",
                    boxShadow: query.trim() 
                      ? "0 8px 25px rgba(16, 185, 129, 0.4)"
                      : "0 4px 15px rgba(156, 163, 175, 0.3)",
                    minWidth: "200px"
                  }}
                  onMouseEnter={(e) => {
                    if (query.trim()) {
                      e.target.style.transform = "translateY(-3px)";
                      e.target.style.boxShadow = "0 12px 35px rgba(16, 185, 129, 0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (query.trim()) {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 8px 25px rgba(16, 185, 129, 0.4)";
                    }
                  }}
                >
                  {query.trim() ? "Ask AIRA 🚀" : "Enter a question to continue"}
                </button>
              </div>
            </form>
            
            <div style={{
              marginTop: "32px",
              padding: "20px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
              borderRadius: "16px",
              border: "1px solid rgba(16, 185, 129, 0.2)"
            }}>
              <h3 style={{ 
                fontSize: "18px", 
                fontWeight: "600", 
                marginBottom: "12px",
                color: "#065f46"
              }}>
                💡 Pro Tips:
              </h3>
              <ul style={{ 
                color: "#047857", 
                fontSize: "14px", 
                lineHeight: "1.6",
                margin: "0",
                paddingLeft: "20px"
              }}>
                <li>Be specific with your questions for better answers</li>
                <li>Ask for step-by-step explanations when learning new concepts</li>
                <li>Request examples to better understand abstract topics</li>
                <li>Ask follow-up questions to dive deeper into subjects</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Home;



