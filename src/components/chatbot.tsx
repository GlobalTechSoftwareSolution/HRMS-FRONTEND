"use client";

import React, { useState, useEffect, useRef } from "react";

const Chatbot: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; user: boolean }[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const escapeHtml = (text: string) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  const sendMessage = async (msg: string) => {
    if (!msg.trim()) return;

    setMessages((prev) => [...prev, { text: msg, user: true }]);
    setInput("");

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { text: data.reply, user: false }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, connection failed. Try again.", user: false },
      ]);
    }
  };

  const handleQuickButton = (query: string, text: string) => {
    setMessages((prev) => [...prev, { text, user: true }]);
    sendMessage(query);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 text-black">
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-xl flex items-center justify-center text-white text-xl hover:scale-110 transition-transform duration-300 focus:outline-none"
      >
        💬
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100%-2rem)] sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transform transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex justify-between items-center">
            <div className="font-bold">🤖 Global Tech HRMS Chat</div>
            <button
              onClick={toggleChat}
              className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg whitespace-pre-wrap max-w-[75%] ${
                  msg.user
                    ? "ml-auto bg-blue-600 text-white text-right"
                    : "mr-auto bg-white border text-gray-800"
                }`}
              >
                <strong>{msg.user ? "You:" : "Bot:"}</strong>
                <br />
                {escapeHtml(msg.text)}
              </div>
            ))}

            {/* Quick Buttons after bot reply */}
            {messages.length > 0 && !messages[messages.length - 1].user && (
              <div className="flex flex-wrap gap-2 mr-auto mt-2">
                {[
                  { text: "HRMS", query: "hrms", emoji: "📊" },
                  { text: "Support", query: "support", emoji: "📞" },
                  { text: "About", query: "about", emoji: "🏢" },
                  { text: "Blogs", query: "blogs", emoji: "📰" },
                ].map((btn) => (
                  <button
                    key={btn.text}
                    onClick={() => handleQuickButton(btn.query, btn.text)}
                    className="px-3 py-1 bg-gradient-to-r from-pink-300 to-orange-200 rounded-full text-xs font-semibold shadow-sm"
                  >
                    {btn.emoji} {btn.text}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              className="flex-1 border rounded-lg p-2 text-sm focus:border-blue-500 outline-none"
              placeholder="Ask about our HRMS..."
            />
            <button
              onClick={() => sendMessage(input)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white text-sm font-semibold"
            >
              Send ➤
            </button>
          </div>
        </div>
      )}

      {/* Background overlay when chat is open on mobile */}
      {isChatOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleChat}
        ></div>
      )}
    </div>
  );
};

export default Chatbot;