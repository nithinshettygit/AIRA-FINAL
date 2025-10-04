import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const Bot = () => {
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic");
  const query = searchParams.get("query");
  const { user, markLessonCompleted, isLessonCompleted } = useUser();

  useEffect(() => {
    // Mark lesson as completed when user interacts with it
    if (topic) {
      markLessonCompleted(topic);
    }
  }, [topic, markLessonCompleted]);

  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    padding: "20px"
  };

  const contentStyle = {
    maxWidth: "1000px",
    margin: "0 auto",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)"
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: "32px",
    padding: "24px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "16px",
    color: "white",
    boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)"
  };

  const infoCardStyle = {
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    padding: "24px",
    borderRadius: "16px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)"
  };

  const placeholderStyle = {
    background: "linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)",
    padding: "32px",
    borderRadius: "16px",
    border: "2px solid #81d4fa",
    textAlign: "center",
    marginBottom: "24px"
  };

  const buttonStyle = {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)"
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
          <h1 style={{ fontSize: "36px", fontWeight: "800", margin: "0" }}>
            AIRA Bot Interface
          </h1>
          <p style={{ fontSize: "18px", margin: "8px 0 0 0", opacity: "0.9" }}>
            Your AI Teaching Assistant
          </p>
        </div>

        <div style={infoCardStyle}>
          <h3 style={{ 
            fontSize: "20px", 
            fontWeight: "700", 
            marginBottom: "16px",
            color: "#1e293b"
          }}>
            📋 Session Information
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <strong style={{ color: "#64748b" }}>User:</strong>
              <div style={{ fontSize: "16px", color: "#1e293b" }}>
                {user?.name || "Guest User"}
                {user?.isGuest && <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>(Guest)</span>}
              </div>
            </div>
            <div>
              <strong style={{ color: "#64748b" }}>Progress Tracking:</strong>
              <div style={{ fontSize: "16px", color: "#1e293b" }}>
                {user && !user.isGuest ? (
                  <span style={{ color: "#16a34a", fontWeight: "600" }}>✅ Active</span>
                ) : (
                  <span style={{ color: "#f59e0b", fontWeight: "600" }}>⚠️ Disabled (Guest Mode)</span>
                )}
              </div>
            </div>
            <div>
              <strong style={{ color: "#64748b" }}>Topic:</strong>
              <div style={{ fontSize: "16px", color: "#1e293b" }}>
                {topic ? decodeURIComponent(topic) : "None"}
                {topic && isLessonCompleted(decodeURIComponent(topic)) && (
                  <span style={{ fontSize: "12px", color: "#16a34a", marginLeft: "8px" }}>✓ Completed</span>
                )}
              </div>
            </div>
            <div>
              <strong style={{ color: "#64748b" }}>Custom Query:</strong>
              <div style={{ fontSize: "16px", color: "#1e293b" }}>
                {query ? decodeURIComponent(query) : "None"}
              </div>
            </div>
          </div>
        </div>

        <div style={placeholderStyle}>
          <div style={{ fontSize: "64px", marginBottom: "24px" }}>🚀</div>
          <h3 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "16px", color: "#0c4a6e" }}>
            Bot Interface Ready
          </h3>
          <p style={{ fontSize: "16px", color: "#0c4a6e", marginBottom: "20px", lineHeight: "1.6" }}>
            Your existing bot interface should be integrated here. The component now receives:
          </p>
          <ul style={{ textAlign: "left", maxWidth: "600px", margin: "0 auto 24px auto", color: "#0c4a6e" }}>
            <li><strong>Topic Parameter:</strong> When navigating from lesson selection</li>
            <li><strong>Query Parameter:</strong> When navigating from custom query input</li>
            <li><strong>Progress Tracking:</strong> Automatically marks lessons as completed</li>
            <li><strong>User Context:</strong> Access to user information and progress</li>
          </ul>
          <div style={{
            background: "rgba(255, 255, 255, 0.8)",
            padding: "16px",
            borderRadius: "12px",
            fontSize: "14px",
            color: "#0c4a6e",
            border: "1px solid rgba(255, 255, 255, 0.5)"
          }}>
            <strong>Integration Notes:</strong> Replace this placeholder with your existing bot component and ensure it reads the URL parameters to initialize the conversation context.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          <button 
            onClick={() => window.history.back()}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.3)";
            }}
          >
            ← Back to Home
          </button>
          
          <button 
            onClick={() => window.location.href = "/home"}
            style={{
              ...buttonStyle,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 25px rgba(16, 185, 129, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(16, 185, 129, 0.3)";
            }}
          >
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Bot;
