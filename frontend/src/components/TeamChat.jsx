import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Send, MessageSquare, RefreshCw, Users, ShieldCheck, User } from 'lucide-react';

export default function TeamChat({ teamId, teamName }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/teams/${teamId}/chat/`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to load chat messages", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchMessages(false);

      // Auto poll every 3 seconds for real-time messages
      const interval = setInterval(() => {
        fetchMessages(true);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [teamId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const res = await api.post(`/teams/${teamId}/chat/`, {
        message: newMessage.trim()
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[480px]">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold truncate">Team Chat</h3>
            <p className="text-[11px] text-slate-300 font-medium">
              {teamName ? `${teamName} Channel` : 'Live Teammate Discussion'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping mr-1"></span>
          <span>Live Sync</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2 text-gray-400">
            <RefreshCw size={20} className="animate-spin text-blue-600" />
            <span className="text-xs font-semibold">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-gray-400 p-6">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <MessageSquare size={24} />
            </div>
            <p className="text-xs font-bold text-gray-700">No messages yet!</p>
            <p className="text-[11px] text-gray-400 max-w-xs">
              Start the discussion with your teammates. Share project ideas, links, or task updates.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === user?.id || msg.sender_username === user?.username;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div className="flex items-center space-x-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold text-gray-700">
                    {isMe ? 'You' : msg.sender_name}
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed font-medium shadow-2xs break-words ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-gray-100 rounded-bl-xs'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2 shrink-0">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message to your team..."
          className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50/50 focus:bg-white transition text-gray-800 font-medium"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-40 flex items-center justify-center space-x-1 shadow-xs"
        >
          {sending ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </form>
    </div>
  );
}
