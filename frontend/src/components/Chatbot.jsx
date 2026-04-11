import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_URL = "https://expense-tracker-3dmz.onrender.com";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export default function Chatbot({ theme, currency }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatbot_messages");
    return saved ? JSON.parse(saved) : [
      { role: "assistant", content: "Hi! I'm your expense assistant 💰 Ask me anything about your spending!" }
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const messagesEndRef = useRef(null);

  const dark = theme === "dark";

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/expenses`, authHeader());
        setExpenses(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchExpenses();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("chatbot_messages", JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const allMessages = [...messages, userMessage].filter(m => m.role === "user" || m.role === "assistant");
      const response = await axios.post(
        `${API_URL}/api/chat`,
        { messages: allMessages, expenses, currency },
        authHeader()
      );
      setMessages(prev => [...prev, { role: "assistant", content: response.data.message }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry I couldn't process that. Please try again!" }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    const initial = [{ role: "assistant", content: "Hi! I'm your expense assistant 💰 Ask me anything about your spending!" }];
    setMessages(initial);
    localStorage.removeItem("chatbot_messages");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "55px",
          height: "55px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff",
          border: "none",
          fontSize: "22px",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(99,102,241,0.5)",
          zIndex: 9999,
          transition: "transform 0.2s, opacity 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "85px",
          right: "20px",
          width: window.innerWidth < 600 ? "95vw" : "360px",
          height: "520px",
          background: dark ? "rgba(15,15,26,0.95)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "20px",
          border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
          boxShadow: dark ? "0 24px 60px rgba(0,0,0,0.6)" : "0 24px 60px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          zIndex: 9998,
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            padding: "16px 20px",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px",
              }}>
                💰
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "14px" }}>Expense Assistant</div>
                <div style={{ fontSize: "11px", opacity: 0.7 }}>AI-powered insights</div>
              </div>
            </div>
            <button
              onClick={clearChat}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff", cursor: "pointer",
                fontSize: "11px", fontWeight: "600",
                padding: "4px 10px", borderRadius: "6px",
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  border: msg.role === "user"
                    ? "none"
                    : dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
                  color: msg.role === "user" ? "#fff" : dark ? "#fff" : "#000",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  boxShadow: msg.role === "user" ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 16px",
                  borderRadius: "18px 18px 18px 4px",
                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
                  color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
                  fontSize: "14px",
                }}>
                  <span style={{ animation: "pulse 1.5s infinite" }}>Thinking... 🤔</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "12px",
            borderTop: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            gap: "8px",
            background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your expenses..."
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                color: dark ? "#fff" : "#000",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                padding: "10px 16px",
                background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "14px",
                boxShadow: loading ? "none" : "0 4px 12px rgba(99,102,241,0.4)",
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.opacity = "0.85")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}