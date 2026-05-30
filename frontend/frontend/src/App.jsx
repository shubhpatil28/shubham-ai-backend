import { useState } from "react";

const API_URL = "https://shubham-ai-backend.onrender.com";

export default function App() {

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {

    if (!message.trim()) return;
    const lowerText = message.toLowerCase();

    const userMessage = {
      sender: "user",
      text: message,
    };

    setChat((prev) => [...prev, userMessage]);

    // Command Interception Layer
    const systemTriggers = [
      'open chrome', 'open vscode', 'open whatsapp', 
      'open downloads', 'open documents', 'create folder', 
      'shutdown', 'restart', 'shutdown pc', 'restart pc'
    ];
    const isSystemCommand = systemTriggers.some(t => lowerText.includes(t));

    try {
      if (isSystemCommand) {
        console.log("ROUTED_TO_SYSTEM_COMMAND");
        const response = await fetch(`${API_URL}/api/system-command`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            command: message,
          }),
        });
        const data = await response.json();
        const aiMessage = {
          sender: "ai",
          text: data.message || (data.status === 'pending' ? "Relaying to local machine..." : "Command executed"),
        };
        setChat((prev) => [...prev, aiMessage]);
        setMessage("");
        return;
      }

      console.log("ROUTED_TO_CHAT");
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      const data = await response.json();

      const aiMessage = {
        sender: "ai",
        text: data.response || "No response",
      };

      setChat((prev) => [...prev, aiMessage]);

    } catch (error) {

      setChat((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Backend connection failed ⚠️",
        },
      ]);

    }

    setMessage("");
  };

  return (
    <div
      style={{
        background: "#050816",
        color: "white",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
      }}
    >

      <h1
        style={{
          color: "cyan",
          textAlign: "center",
        }}
      >
        SHUBHAM AI OS 🚀
      </h1>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginTop: "20px",
        }}
      >

        {chat.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
              textAlign: msg.sender === "user" ? "right" : "left",
            }}
          >

            <span
              style={{
                background:
                  msg.sender === "user"
                    ? "cyan"
                    : "#1e293b",
                color:
                  msg.sender === "user"
                    ? "black"
                    : "white",
                padding: "10px 15px",
                borderRadius: "12px",
                display: "inline-block",
                maxWidth: "70%",
              }}
            >
              {msg.text}
            </span>

          </div>
        ))}

      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask anything..."
          style={{
            flex: 1,
            padding: "15px",
            borderRadius: "10px",
            border: "none",
            outline: "none",
            fontSize: "16px",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            background: "cyan",
            border: "none",
            padding: "15px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Send
        </button>

      </div>

    </div>
  );
}
