import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

export default function RouteIndicator({ message }) {
  const [routeData, setRouteData] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!message || message.trim() === '') {
      setRouteData(null);
      return;
    }

    setIsTyping(true);
    const timeoutId = setTimeout(async () => {
      try {
        console.log("ACTIVE_CHAT_HANDLER: component_route_indicator");
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: message })
        });
        
        if (response.ok) {
          const data = await response.json();
          setRouteData(data);
        }
      } catch (err) {
        console.error("Failed to fetch route classification", err);
      } finally {
        setIsTyping(false);
      }
    }, 500); // Debounce typing by 500ms

    return () => clearTimeout(timeoutId);
  }, [message]);

  if (!routeData) {
    return (
      <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1 h-5 transition-opacity opacity-50">
        <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></span>
        <span>Awaiting input...</span>
      </div>
    );
  }

  // Determine colors based on mode
  let colorClass = "text-gray-300 border-gray-600";
  let bgClass = "bg-gray-800";
  
  switch(routeData.mode) {
    case 'chat':
      colorClass = "text-blue-400 border-blue-500/30";
      bgClass = "bg-blue-900/20";
      break;
    case 'execute':
      colorClass = "text-yellow-400 border-yellow-500/30";
      bgClass = "bg-yellow-900/20";
      break;
    case 'code_help':
      colorClass = "text-purple-400 border-purple-500/30";
      bgClass = "bg-purple-900/20";
      break;
    case 'site_build':
      colorClass = "text-green-400 border-green-500/30";
      bgClass = "bg-green-900/20";
      break;
    case 'memory':
      colorClass = "text-pink-400 border-pink-500/30";
      bgClass = "bg-pink-900/20";
      break;
    case 'whatsapp':
      colorClass = "text-emerald-400 border-emerald-500/30";
      bgClass = "bg-emerald-900/20";
      break;
    default:
      break;
  }

  return (
    <div className={`flex items-center space-x-2 text-xs mt-1 h-5 transition-all duration-300 ${isTyping ? 'opacity-70' : 'opacity-100'}`}>
      <span className={`px-2 py-0.5 rounded-full border ${colorClass} ${bgClass} flex items-center shadow-sm`}>
        <span className="mr-1">{routeData.emoji || '🧭'}</span>
        <span className="font-medium">{routeData.label || routeData.mode}</span>
      </span>
      {routeData.confidence && (
        <span className="text-gray-500 font-mono text-[10px]">
          ({(routeData.confidence * 100).toFixed(0)}%)
        </span>
      )}
      {isTyping && (
        <span className="flex space-x-1">
          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></span>
          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
        </span>
      )}
    </div>
  );
}
