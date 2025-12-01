
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Icons } from './Icons';
import { ChatMessage, AIInsight } from '../types';
import { AI_SYSTEM_INSTRUCTION } from '../constants';

export const AIPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('insights');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'Hola, soy el asistente IA de COAR Puno. ¿En qué puedo ayudarte hoy? Pregúntame sobre el menú, horarios o normativas.', timestamp: new Date() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini Chat
  useEffect(() => {
    if (!process.env.API_KEY) return;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatSession.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
      },
    });
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await chatSession.current.sendMessage({ message: userMsg.text });
      const responseText = result.text; 

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Lo siento, tuve un problema al conectar con el servidor. Por favor intenta de nuevo.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Mock Insights Data
  const insights: AIInsight[] = [
    {
      title: 'Bienestar Digital',
      value: 'Normal',
      trend: 'stable',
      description: 'El uso de dispositivos móviles en horario académico está dentro de los límites permitidos.',
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      title: 'Predicción de Salida',
      value: '15:35 PM',
      trend: 'up',
      description: 'La IA estima una salida fluida hoy. El tráfico en la carretera es ligero.',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: 'Actividad Reportada',
      value: 'Alta',
      trend: 'up',
      description: 'Los reportes de asistencia indican participación completa en talleres.',
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    }
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm h-[600px] flex flex-col overflow-hidden">
      {/* Header with Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center transition-colors ${activeTab === 'insights' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Icons.Dashboard className="w-4 h-4 mr-2" />
          Insights IA
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center transition-colors ${activeTab === 'chat' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <div className="relative">
            <Icons.Shield className="w-4 h-4 mr-2" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
          Asistente COAR
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-gray-50 relative">
        
        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <div className="h-full overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resumen Inteligente</h3>
               <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold flex items-center">
                 <Icons.Refresh className="w-3 h-3 mr-1 animate-spin-slow" /> AI Live
               </span>
            </div>
            
            {insights.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${item.color} shadow-sm transition-transform hover:scale-[1.02]`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm">{item.title}</h4>
                  <Icons.Dashboard className="w-4 h-4 opacity-50" />
                </div>
                <div className="text-2xl font-bold mb-1">{item.value}</div>
                <p className="text-xs opacity-80 leading-relaxed">{item.description}</p>
              </div>
            ))}

            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-4 rounded-2xl text-white shadow-lg mt-6">
               <div className="flex items-center gap-2 mb-2">
                 <Icons.Shield className="w-5 h-5" />
                 <span className="font-bold text-sm">Consejo del día</span>
               </div>
               <p className="text-xs text-indigo-100 leading-relaxed">
                 "Fomentar el descanso temprano hoy ayudará al rendimiento en la Feria de Ciencias de mañana. La IA sugiere una cena ligera."
               </p>
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-700 border border-gray-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                    <div className={`text-[9px] mt-1 text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta sobre horarios, menú..."
                  className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isTyping}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors shadow-sm"
                >
                  <Icons.Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
