"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const Chatbot: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; user: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isChatOpen]);

  const escapeHtml = (text: string) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  const sendMessage = async (msg: string) => {
    if (!msg.trim()) return;

    // Add user message to chat immediately
    const userMessage = { text: msg, user: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setConversationStarted(true);

    // Store the index of the user message for scrolling later
    const userMessageIndex = messages.length;

    // Scroll to bottom to show user message
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    // Check if user wants to contact support
    if (msg.toLowerCase().includes("contact") || msg.toLowerCase().includes("support")) {
      // Simulate bot response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { 
            text: "I'd be happy to help you get in touch with our support team! 🤝\n\nYou can either:\n1. Fill out our contact form right here in the chat\n2. Call us directly\n\nWhat would you prefer?", 
            user: false 
          }
        ]);
        setIsTyping(false);
        // Scroll to the user's message after bot response
        setTimeout(() => {
          scrollToUserMessage(userMessageIndex);
        }, 100);
      }, 800);
      return;
    }

    // Handle greeting messages
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { 
            text: "Hello there! 👋\n\nI'm your HRMS Assistant, here to help you with:\n• HRMS features and functionalities\n• Employee management tools\n• Payroll and attendance systems\n• Support and troubleshooting\n\nHow can I assist you today?", 
            user: false 
          }
        ]);
        setIsTyping(false);
        // Scroll to the user's message after bot response
        setTimeout(() => {
          scrollToUserMessage(userMessageIndex);
        }, 100);
      }, 800);
      return;
    }

    // Handle thank you messages
    if (lowerMsg.includes("thank") || lowerMsg.includes("thanks")) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { 
            text: "You're very welcome! 😊\n\nI'm glad I could help. Is there anything else I can assist you with today?\n\nRemember, I'm here 24/7 to help with any HRMS related questions!", 
            user: false 
          }
        ]);
        setIsTyping(false);
        // Scroll to the user's message after bot response
        setTimeout(() => {
          scrollToUserMessage(userMessageIndex);
        }, 100);
      }, 800);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CHATBOT_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();
    
    // Show bot response
    setTimeout(() => {
      // Make the response more engaging
      let responseText = data.reply;
      
      // Add emojis for common topics
      if (responseText.toLowerCase().includes("hrms")) {
        responseText = responseText.replace(/hrms/gi, "HRMS 📊");
      }
      
      if (responseText.toLowerCase().includes("employee")) {
        responseText = responseText.replace(/employee/gi, "employee 👥");
      }
      
      if (responseText.toLowerCase().includes("payroll")) {
        responseText = responseText.replace(/payroll/gi, "payroll 💰");
      }
      
      if (responseText.toLowerCase().includes("attendance")) {
        responseText = responseText.replace(/attendance/gi, "attendance 📅");
      }
      
      setMessages((prev) => [...prev, { text: responseText, user: false }]);
      setIsTyping(false);
      // Scroll to the user's message after bot response
      setTimeout(() => {
        scrollToUserMessage(userMessageIndex);
      }, 100);
    }, 800);
    
  } catch {
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "Oops! I'm having trouble connecting right now. 😅\n\nPlease try again in a moment.", user: false },
      ]);
      setIsTyping(false);
      // Scroll to the user's message after bot response
      setTimeout(() => {
        scrollToUserMessage(userMessageIndex);
      }, 100);
    }, 800);
  }
};

// New function to scroll to the user's message
const scrollToUserMessage = (index: number) => {
  if (messagesEndRef.current && index >= 0) {
    const chatContainer = messagesEndRef.current.parentElement;
    if (chatContainer) {
      const messageElements = chatContainer.querySelectorAll('.animate-message-in');
      if (messageElements[index]) {
        messageElements[index].scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        // Fallback to scrolling to top if specific message not found
        chatContainer.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }
};

  const handleQuickButton = (query: string) => {
    if (query === "contact") {
      // Show contact form when user clicks on "Contact Us"
      setShowContactForm(true);
      setConversationStarted(true);
      // Add a message to the chat to inform the user
      setMessages((prev) => [
        ...prev,
        { 
          text: "Sure, I can help you with that. Please fill out the form below and I'll get your message to our team.", 
          user: false 
        }
      ]);
      // Scroll to bottom to show the message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } else {
      // Handle other quick buttons normally
      sendMessage(query);
    }
  };

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitContactForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Redirect to contact page with form data as query parameters
    const queryParams = new URLSearchParams({
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone,
      message: contactForm.message
    }).toString();
    
    router.push(`/contact?${queryParams}`);
  };

  const toggleChat = () => {
    if (isChatOpen) {
      // Clear messages when closing the chat
      setMessages([]);
      setConversationStarted(false);
    }
    setIsChatOpen(!isChatOpen);
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationStarted(false);
  };

  const openContactPage = () => {
    setIsChatOpen(false);
  };

  const [suggestedQuestions, setSuggestedQuestions] = useState([
    { text: "HRMS Features", query: "hrms features", emoji: "🚀", color: "bg-blue-600" },
    { text: "Get Support", query: "support", emoji: "🛟", color: "bg-blue-600" },
    { text: "Contact Us", query: "contact", emoji: "📧", color: "bg-blue-600" },
    { text: "Latest Updates", query: "blogs", emoji: "📰", color: "bg-blue-600" },
  ]);

  return (
    <div className="fixed bottom-6 right-6 z-50 text-black">
      {/* Enhanced Floating Button with Bot Icon */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-blue-600 shadow-2xl flex items-center justify-center text-white transition-all duration-500 ${isChatOpen ? 'scale-0 rotate-90' : 'scale-100 hover:scale-110'} group backdrop-blur-sm border-2 border-white/30`}
      >
        {/* Pulsing ring effect */}
        <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></div>
        
        {/* Main button content with Bot Icon */}
        <div className="relative z-10 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="white" 
            className="w-10 h-10 transition-transform duration-500 group-hover:rotate-12"
          >
            {/* Professional Bot Icon */}
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V7H1V9H3V15C3 16.1 3.9 17 5 17H7V21H9V17H11V21H13V17H15V21H17V17H19C20.1 17 21 16.1 21 15V9H21ZM5 15V7H11V9H13V7H19V15H5Z" />
          </svg>
        </div>
      </button>

      {/* Advanced Chat Window with Glassmorphism */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100%-2rem)] sm:w-80 h-[500px] bg-white backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transform transition-all duration-500 animate-slide-up">
          {/* Header with Glass Effect */}
          <div className="bg-blue-600 backdrop-blur-md text-white p-4 flex justify-between items-center border-b border-gray-200 shadow-lg">
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="font-bold text-lg">HRMS Assistant</h2>
                <p className="text-sm opacity-90 flex items-center">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                  Online • Global Tech
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Clear Conversation Button */}
              {conversationStarted && (
                <button 
                  onClick={clearConversation}
                  className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  title="Clear Conversation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              
              {/* Close Button */}
              <button
                onClick={toggleChat}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors text-xl font-semibold"
                title="Close Chat"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages Container with Gradient Background */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {/* Welcome Message with Animation */}
            {messages.length === 0 && (
              <div className="animate-fade-in">
                <div className="text-center py-6">
                  <div className="inline-flex flex-col items-center p-5 bg-white rounded-2xl shadow-xl border border-gray-200 mb-5 backdrop-blur-sm">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        {/* Bot Icon */}
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V7H1V9H3V15C3 16.1 3.9 17 5 17H7V21H9V17H11V21H13V17H15V21H17V17H19C20.1 17 21 16.1 21 15V9H21ZM5 15V7H11V9H13V7H19V15H5Z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">HRMS Assistant</h3>
                    <p className="text-gray-600 mb-5 text-sm">Ask me about HRMS features or support</p>
                    
                    {/* Quick Action Grid */}
                    <div className="grid grid-cols-2 gap-2 w-full max-w-[250px]">
                      {suggestedQuestions.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickButton(item.query)}
                          className={`${item.color} text-white px-4 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-all transform hover:scale-105 shadow-md flex items-center space-x-2`}
                        >
                          <span>{item.emoji}</span>
                          <span>{item.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.user ? 'justify-end' : 'justify-start'} animate-message-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-lg backdrop-blur-sm ${
                    msg.user
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${msg.user ? 'bg-blue-300' : 'bg-blue-400'}`}></div>
                    <div className="font-semibold text-xs opacity-90">
                      {msg.user ? "You" : "HR Assistant"}
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed break-words text-sm">
                    {escapeHtml(msg.text)}
                  </div>
                  <div className="text-xs opacity-70 mt-1 text-right">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Contact Form */}
            {showContactForm && (
              <div className="animate-fade-in">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
                  <h3 className="font-bold text-base text-gray-800 mb-3">Contact Form</h3>
                  <form onSubmit={submitContactForm} className="space-y-3">
                    <div>
                      <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={contactForm.name}
                        onChange={handleContactFormChange}
                        required
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={contactForm.email}
                        onChange={handleContactFormChange}
                        required
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Your email"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={contactForm.phone}
                        onChange={handleContactFormChange}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Your phone"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-xs font-medium text-gray-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={contactForm.message}
                        onChange={handleContactFormChange}
                        required
                        rows={3}
                        className="w-full px-3 py-1.5 text-sm border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Your message..."
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white font-medium py-1.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Send
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowContactForm(false)}
                        className="flex-1 bg-gray-500 text-white font-medium py-1.5 px-3 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-lg p-4 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                    <span className="text-sm text-gray-600 ml-2">Assistant is typing...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Suggestions after bot response */}
            {messages.length > 0 && !messages[messages.length - 1].user && !isTyping && (
              <div className="animate-fade-in">
                <div className="text-xs font-semibold text-gray-500 mb-3 px-2">QUICK SUGGESTIONS</div>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((btn) => (
                    <button
                      key={btn.text}
                      onClick={() => handleQuickButton(btn.query)}
                      className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm flex items-center space-x-2 group hover:border-gray-300"
                    >
                      <span className="text-lg transform group-hover:scale-110 transition-transform">{btn.emoji}</span>
                      <span>{btn.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>

          {/* Enhanced Input Area */}
          <div className="p-3 border-t border-gray-200 bg-white backdrop-blur-xl">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 pr-8 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                  placeholder="Type your message..."
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <button
                onClick={() => sendMessage(input)}
                className={`w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 ${!input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:bg-blue-700'}`}
                disabled={!input.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
            
            {/* Input Hint */}
            <div className="text-xs text-gray-500 text-center mt-2">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 text-xs">Enter</kbd> to send
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Background Overlay */}
      {isChatOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
          onClick={toggleChat}
        ></div>
      )}

      {/* Add CSS for custom animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes message-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-message-in {
          animation: message-in 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;