import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const Welcome = () => {
  const navigate = useNavigate();
  const { useWithoutSignin } = useUser();
  const [showAuthOptions, setShowAuthOptions] = useState(false);

  const handleUseWithoutSignin = () => {
    useWithoutSignin();
    navigate("/home");
  };

  const welcomeStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    position: "relative",
    overflow: "hidden"
  };

  const floatingElements = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      style={{
        position: "absolute",
        width: Math.random() * 100 + 20,
        height: Math.random() * 100 + 20,
        background: `rgba(255, 255, 255, ${Math.random() * 0.1 + 0.05})`,
        borderRadius: "50%",
        top: Math.random() * 100 + "%",
        left: Math.random() * 100 + "%",
        animation: `float ${Math.random() * 10 + 10}s infinite linear`,
        animationDelay: `${Math.random() * 5}s`
      }}
    />
  ));

  const contentStyle = {
    textAlign: "center",
    background: "rgba(255, 255, 255, 0.95)",
    padding: "60px 40px",
    borderRadius: "24px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    maxWidth: "500px",
    width: "100%",
    position: "relative",
    zIndex: 1
  };

  const titleStyle = {
    fontSize: "48px",
    fontWeight: "900",
    marginBottom: "16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
  };

  const subtitleStyle = {
    color: "#4a5568",
    marginBottom: "40px",
    fontSize: "18px",
    lineHeight: "1.6"
  };

  const buttonStyle = {
    padding: "16px 32px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    margin: "8px",
    minWidth: "160px",
    position: "relative",
    overflow: "hidden"
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)"
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: "white",
    color: "#667eea",
    border: "2px solid #667eea",
    boxShadow: "0 8px 25px rgba(102, 126, 234, 0.1)"
  };

  const optionGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "20px"
  };

  if (showAuthOptions) {
    return (
      <div style={welcomeStyle}>
        {floatingElements}
        <div style={contentStyle}>
          <h1 style={titleStyle}>Choose Your Path</h1>
          <p style={subtitleStyle}>How would you like to get started?</p>
          
          <div style={optionGridStyle}>
            <button
              onClick={() => navigate("/login")}
              style={primaryButtonStyle}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 12px 35px rgba(102, 126, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.3)";
              }}
            >
              Sign In
            </button>
            
            <button
              onClick={() => navigate("/signup")}
              style={secondaryButtonStyle}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 12px 35px rgba(102, 126, 234, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.1)";
              }}
            >
              Sign Up
            </button>
          </div>
          
          <button
            onClick={() => setShowAuthOptions(false)}
            style={{
              ...buttonStyle,
              background: "transparent",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
              marginTop: "20px"
            }}
          >
            ← Back
          </button>
        </div>
        
        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            100% { transform: translateY(-100vh) rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={welcomeStyle}>
      {floatingElements}
      <div style={contentStyle}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🤖</div>
        <h1 style={titleStyle}>AIRA</h1>
        <h2 style={{ 
          fontSize: "24px", 
          fontWeight: "600", 
          marginBottom: "16px",
          color: "#4a5568"
        }}>
          AI Teaching Agent
        </h2>
        <p style={subtitleStyle}>
          Learn with an AI tutor. Engage with interactive lessons or ask anything you want to know.
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={handleUseWithoutSignin}
            style={primaryButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-3px)";
              e.target.style.boxShadow = "0 12px 35px rgba(102, 126, 234, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.3)";
            }}
          >
            🚀 Use Without Sign In
          </button>
          
          <button
            onClick={() => setShowAuthOptions(true)}
            style={secondaryButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-3px)";
              e.target.style.boxShadow = "0 12px 35px rgba(102, 126, 234, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.1)";
            }}
          >
            Sign In / Sign Up
          </button>
        </div>
        
        <div style={{
          marginTop: "30px",
          padding: "16px",
          background: "rgba(102, 126, 234, 0.1)",
          borderRadius: "12px",
          fontSize: "14px",
          color: "#4a5568"
        }}>
          <strong>✨ Features:</strong> Progress tracking, personalized learning, and AI-powered assistance
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-100vh) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Welcome;



