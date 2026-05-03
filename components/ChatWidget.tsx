"use client";

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, sendMessage, status } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue });
    setInputValue('');
  };

  // Extract text content from a UIMessage's parts array
  const getMessageText = (message: (typeof messages)[number]) => {
    if (!message.parts || message.parts.length === 0) return '';
    return message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map(part => part.text)
      .join('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[350px] h-[500px] flex flex-col mb-4 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-sm">
            <div>
              <h3 className="font-semibold text-lg">MidCare Assistant</h3>
              <p className="text-blue-100 text-xs">Medical Guidance & Support</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-blue-100 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                <MessageCircle className="mx-auto mb-3 opacity-20" size={48} />
                <p className="font-medium text-gray-700">Hello! I&apos;m your MidCare Assistant.</p>
                <p className="mt-1 text-gray-500 text-xs px-4">I can help with medical questions or guide you through booking an appointment.</p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                    {getMessageText(m)}
                  </div>
                </div>
              ))
            )}
            {status === 'submitted' && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm flex items-center space-x-1.5 h-10">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={onSubmit} className="flex gap-2 relative">
              <input
                className="flex-1 border border-gray-300 rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                value={inputValue}
                placeholder="Type your message..."
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white rounded-full w-[34px] flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} className="-ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 hover:scale-105 transition-all flex items-center justify-center group"
          aria-label="Open chat"
        >
          <MessageCircle size={28} className="group-hover:animate-pulse" />
        </button>
      )}
    </div>
  );
}
