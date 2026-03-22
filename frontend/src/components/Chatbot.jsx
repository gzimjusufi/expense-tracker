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
  useEffect(() => {
  localStorage.setItem("chatbot_messages", JSON.stringify(messages));
}, [messages]);

  const dark = theme === "dark";

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
          backgroundColor: "#6366f1",
          color: "#fff",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(99,102,241,0.5)",
          zIndex: 9999,
        }}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "85px",
          right: "20px",
          width: window.innerWidth < 600 ? "95vw" : "350px",
          height: "500px",
          backgroundColor: dark ? "#1e1e1e" : "#fff",
          borderRadius: "16px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          zIndex: 9998,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: "#6366f1",
            padding: "15px 20px",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            💰 Expense Assistant
            <button
              onClick={() => {
  const initial = [{ role: "assistant", content: "Hi! I'm your expense assistant 💰 Ask me anything about your spending!" }];
  setMessages(initial);
  localStorage.removeItem("chatbot_messages");
}}
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "12px", opacity: 0.8 }}
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "15px",
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
                  backgroundColor: msg.role === "user" ? "#6366f1" : dark ? "#2d2d2d" : "#f0f0f0",
                  color: msg.role === "user" ? "#fff" : dark ? "#fff" : "#000",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "18px 18px 18px 4px",
                  backgroundColor: dark ? "#2d2d2d" : "#f0f0f0",
                  color: dark ? "#fff" : "#000",
                  fontSize: "14px",
                }}>
                  Thinking... 🤔
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "12px",
            borderTop: `1px solid ${dark ? "#333" : "#eee"}`,
            display: "flex",
            gap: "8px",
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your expenses..."
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: `1px solid ${dark ? "#444" : "#ddd"}`,
                backgroundColor: dark ? "#2a2a2a" : "#fff",
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
                backgroundColor: loading ? "#999" : "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}