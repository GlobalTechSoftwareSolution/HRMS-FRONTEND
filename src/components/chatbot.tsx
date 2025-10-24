"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

const Chatbot: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const toggleChatbot = () => {
    if (isChatOpen) {
      setIsVisible(false);
      setTimeout(() => setIsChatOpen(false), 300);
    } else {
      setIsChatOpen(true);
      setTimeout(() => setIsVisible(true), 10);
    }
  };

  const closeChatbot = () => {
    setIsVisible(false);
    setTimeout(() => setIsChatOpen(false), 300);
  };

  // Close chatbot when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const chatbot = document.getElementById('chatbot-container');
      const button = document.getElementById('chatbot-button');
      
      if (isChatOpen && chatbot && button && 
          !chatbot.contains(event.target as Node) && 
          !button.contains(event.target as Node)) {
        closeChatbot();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isChatOpen]);

  return (
    <>
      {/* Floating AI Chat Button */}
      <div
        id="chatbot-button"
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 z-50 cursor-pointer flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 rounded-full shadow-2xl w-16 h-16 hover:scale-110 hover:rotate-12 group"
      >
        <Image
          src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png"
          alt="AI Chat"
          width={40}
          height={40}
          className="w-8 h-8 group-hover:scale-110 transition-transform"
        />
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
      </div>

      {/* Optional floating hint text */}
      <div className="fixed bottom-24 right-6 bg-white shadow-lg px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200 backdrop-blur-sm">
        💬 Need help? Chat with AI
      </div>

      {/* Chatbot Container */}
      {isChatOpen && (
        <div
          id="chatbot-container"
          className={`fixed bottom-24 right-6 z-50 w-96 h-120 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transform transition-all duration-300 ${
            isVisible 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-blue-100">Online • Ready to help</p>
              </div>
            </div>
            <button
              onClick={closeChatbot}
              className="text-white hover:text-gray-200 transition text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20"
            >
              ×
            </button>
          </div>

          {/* Chat Iframe */}
          <div className="flex-1 rounded-b-2xl overflow-hidden">
            <iframe
              src="https://cdn.botpress.cloud/webchat/v3.3/shareable.html?configUrl=https://files.bpcontent.cloud/2025/10/15/12/20251015120204-XK1X8YE6.json"
              width="100%"
              height="100%"
              frameBorder="0"
              className="rounded-b-2xl"
              title="AI Chatbot"
              allow="microphone"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;