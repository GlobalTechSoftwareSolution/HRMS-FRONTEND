"use client";
import React from "react";
import Image from "next/image";

const Chatbot: React.FC = () => {
  // Function to open chatbot in a popup window
  const openChatbot = () => {
    const botUrl =
      "https://cdn.botpress.cloud/webchat/v3.3/shareable.html?configUrl=https://files.bpcontent.cloud/2025/10/15/12/20251015120204-XK1X8YE6.json";

    // Open in a centered popup window
    const width = 400;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    window.open(
      botUrl,
      "AI Chatbot",
      `width=${width},height=${height},top=${top},left=${left},resizable,scrollbars`
    );
  };

  return (
    <>
      {/* Floating AI Chat Button */}
      <div
        onClick={openChatbot}
        className="fixed bottom-6 right-6 z-50 cursor-pointer flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition rounded-full shadow-lg w-16 h-16"
      >
        <Image
          src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png"
          alt="AI Chat"
          width={40}
          height={40}
          className="w-10 h-10"
        />
      </div>

      {/* Optional floating hint text */}
      <div className="fixed bottom-24 right-6 bg-white shadow-lg px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200">
        💬 Need help? Chat with AI
      </div>
    </>
  );
};

export default Chatbot;
