// components/Chatbot.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faTimes,
  faPaperPlane,
  faRobot,
  faUser,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { sendChatMessage, ChatbotResponse } from "../lib/chatbotService";
import { getStoredLocation } from "../lib/locationService";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  recommendations?: any[];
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      setMessages([
        {
          id: "welcome",
          text: "Hi! I'm your Karya assistant. I can help you find the perfect service provider. What service are you looking for?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const location = getStoredLocation();
      const locationText = location?.city || "Kathmandu";

      const response: ChatbotResponse = await sendChatMessage(
        input,
        sessionId,
        locationText,
      );

      if (!sessionId && response.session_id) {
        setSessionId(response.session_id);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
        recommendations: response.recommendations,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary-500 text-white rounded-full shadow-2xl hover:bg-primary-600 transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faComments} className="text-2xl" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-neutral-200">
          {/* Header */}
          <div className="bg-primary-500 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faRobot} className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold">Karya Assistant</h3>
                <p className="text-xs text-white/80">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] ${msg.isUser ? "order-2" : "order-1"}`}
                >
                  <div
                    className={`p-3 rounded-2xl ${
                      msg.isUser
                        ? "bg-primary-500 text-white rounded-br-none"
                        : "bg-white text-neutral-800 rounded-bl-none shadow-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

                    {/* Recommendations */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.recommendations.map((rec) => (
                          <div
                            key={rec.provider_id}
                            className="bg-neutral-50 p-2 rounded-lg text-xs"
                          >
                            <p className="font-semibold text-primary-600">
                              {rec.name}
                            </p>
                            <p className="text-neutral-600">
                              {rec.business_name}
                            </p>
                            <p className="text-neutral-500 mt-1">
                              {rec.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 px-2">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.isUser ? "order-1 ml-2 bg-primary-100" : "order-2 mr-2 bg-neutral-200"}`}
                >
                  <FontAwesomeIcon
                    icon={msg.isUser ? faUser : faRobot}
                    className="text-sm text-neutral-600"
                  />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-primary-500"
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-neutral-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-full focus:outline-none focus:border-primary-500 text-sm disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
