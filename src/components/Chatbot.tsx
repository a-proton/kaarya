"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faTimes,
  faPaperPlane,
  faRobot,
  faUser,
  faSpinner,
  faExternalLinkAlt,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  recommendations?: any[];
}

interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  permissionDenied: boolean;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation>({
    latitude: null,
    longitude: null,
    city: null,
    permissionDenied: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const locationFetched = useRef(false);

  // Get user location when chatbot opens (only once)
  useEffect(() => {
    if (isOpen && !locationFetched.current) {
      locationFetched.current = true;
      getUserLocation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
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

  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      setUserLocation((prev) => ({ ...prev, permissionDenied: true }));
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        },
      );

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get city name
      const city = await reverseGeocode(latitude, longitude);

      setUserLocation({
        latitude,
        longitude,
        city,
        permissionDenied: false,
      });

      console.log("User location:", { latitude, longitude, city });
    } catch (error) {
      console.log("Location permission denied:", error);
      setUserLocation({
        latitude: null,
        longitude: null,
        city: null,
        permissionDenied: true,
      });
    }
  };

  const reverseGeocode = async (
    lat: number,
    lon: number,
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
      );
      const data = await response.json();

      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.state ||
        null;

      return city;
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      const requestBody: any = {
        message: userInput,
        ...(sessionId && { session_id: sessionId }),
      };

      // Add user location
      if (userLocation.latitude && userLocation.longitude) {
        requestBody.user_latitude = userLocation.latitude;
        requestBody.user_longitude = userLocation.longitude;
        if (userLocation.city) {
          requestBody.user_city = userLocation.city;
        }
      } else if (userLocation.permissionDenied) {
        requestBody.search_whole_nepal = true;
      }

      const response = await fetch(
        `${API_URL}/api/v1/recommend/chatbot/message/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      const botMessageText =
        data.bot_message || data.message || "I'm here to help!";
      const recommendations = data.recommendations || [];

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botMessageText,
        isUser: false,
        timestamp: new Date(),
        recommendations: recommendations,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I'm having trouble connecting. Please try again.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
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
          aria-label="Open chat"
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
                <p className="text-xs text-white/80">
                  {userLocation.city
                    ? `📍 ${userLocation.city}`
                    : userLocation.permissionDenied
                      ? "🇳🇵 Nepal-wide"
                      : "Online"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close chat"
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
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-primary-600">
                            ✨ Recommended Providers:
                          </p>
                          <button
                            onClick={() => setShowScoreInfo(!showScoreInfo)}
                            className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1"
                          >
                            <FontAwesomeIcon
                              icon={faInfoCircle}
                              className="w-3 h-3"
                            />
                            {showScoreInfo ? "Hide" : "Info"}
                          </button>
                        </div>

                        {/* Score Info Tooltip */}
                        {showScoreInfo && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2 text-xs">
                            <p className="font-semibold text-blue-800 mb-1">
                              How we rank providers:
                            </p>
                            <ul className="text-blue-700 space-y-0.5 text-xs">
                              <li>
                                • <strong>Match:</strong> How well they fit your
                                request
                              </li>
                              <li>
                                • <strong>Score:</strong> Overall ranking
                                (location + ratings + trust)
                              </li>
                            </ul>
                          </div>
                        )}

                        {msg.recommendations.map((rec, idx) => {
                          const slug =
                            rec.slug || `provider-${rec.provider_id || rec.id}`;
                          const providerUrl = `/services/${slug}`;

                          return (
                            <Link
                              key={idx}
                              href={providerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block bg-primary-50 p-3 rounded-lg text-xs border border-primary-200 hover:border-primary-400 hover:bg-primary-100 transition-all hover:shadow-md"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1.5">
                                    {rec.name ||
                                      rec.full_name ||
                                      rec.business_name ||
                                      "Provider"}
                                    <FontAwesomeIcon
                                      icon={faExternalLinkAlt}
                                      className="w-3 h-3"
                                    />
                                  </p>
                                  {rec.business_name &&
                                    rec.business_name !==
                                      (rec.name || rec.full_name) && (
                                      <p className="text-neutral-700 font-medium mt-1">
                                        {rec.business_name}
                                      </p>
                                    )}
                                  {rec.city && (
                                    <p className="text-neutral-500 text-xs mt-1">
                                      📍 {rec.city}
                                      {rec.distance_km &&
                                        ` • ${rec.distance_km.toFixed(1)} km`}
                                    </p>
                                  )}
                                  {rec.reason && (
                                    <p className="text-neutral-600 mt-2 leading-relaxed">
                                      {rec.reason}
                                    </p>
                                  )}
                                  <p className="text-xs text-primary-600 font-medium mt-2">
                                    Click to view full profile →
                                  </p>
                                </div>

                                {/* ✅ UPDATED: Show Both Scores */}
                                <div className="ml-2 flex flex-col gap-2">
                                  {/* Match Score */}
                                  {rec.semantic_score && (
                                    <div className="flex flex-col items-end bg-blue-50 px-2 py-1 rounded">
                                      <span className="text-xs font-bold text-blue-600">
                                        {(rec.semantic_score * 100).toFixed(0)}%
                                      </span>
                                      <span className="text-xs text-blue-400">
                                        match
                                      </span>
                                    </div>
                                  )}

                                  {/* Final Score */}
                                  {rec.final_score && (
                                    <div className="flex flex-col items-end bg-green-50 px-2 py-1 rounded">
                                      <span className="text-xs font-bold text-green-600">
                                        {(rec.final_score * 100).toFixed(0)}%
                                      </span>
                                      <span className="text-xs text-green-400">
                                        score
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* ✅ UPDATED: Two Progress Bars */}
                              <div className="mt-2 space-y-1">
                                {/* Match Bar */}
                                {rec.semantic_score && (
                                  <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                                      style={{
                                        width: `${rec.semantic_score * 100}%`,
                                      }}
                                    />
                                  </div>
                                )}
                                {/* Score Bar */}
                                {rec.final_score && (
                                  <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                                      style={{
                                        width: `${rec.final_score * 100}%`,
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </Link>
                          );
                        })}
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.isUser
                      ? "order-1 ml-2 bg-primary-100"
                      : "order-2 mr-2 bg-neutral-200"
                  }`}
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
                <div className="bg-white p-3 rounded-2xl shadow-sm flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-primary-500"
                  />
                  <span className="text-sm text-neutral-600">Thinking...</span>
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
                onKeyPress={(e) =>
                  e.key === "Enter" && !loading && handleSend()
                }
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-full focus:outline-none focus:border-primary-500 text-sm disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                aria-label="Send message"
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
