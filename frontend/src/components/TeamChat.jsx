import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Send, MessageSquare, RefreshCw, Reply, Edit3, Trash2, X, Check, CornerUpLeft, Info, Eye, Clock, CheckCircle2
} from 'lucide-react';

export default function TeamChat({ teamId, teamName, fullScreen = false }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Reply & Edit states
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  
  // Action Modal / Context Menu for Long Press
  const [actionMenuMsg, setActionMenuMsg] = useState(null);
  const [infoModalMsg, setInfoModalMsg] = useState(null);

  // Touch gesture refs
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const messagesEndRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/teams/${teamId}/chat/`);
      if (Array.isArray(res.data)) {
        setMessages(res.data);
      } else if (res.data) {
        setMessages(res.data.messages || []);
        setTypingUsers(res.data.typing_users || []);
      }
    } catch (err) {
      console.error("Failed to load chat messages", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchMessages(false);

      const interval = setInterval(() => {
        fetchMessages(true);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [teamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, replyingTo, editingMessage]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      api.post(`/teams/${teamId}/typing/`).catch(() => {});
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);

      if (editingMessage) {
        // Edit message
        const res = await api.patch(`/teams/${teamId}/chat/`, {
          message_id: editingMessage.id,
          message: newMessage.trim()
        });
        setMessages((prev) => prev.map((m) => (m.id === editingMessage.id ? res.data : m)));
        setEditingMessage(null);
        setNewMessage('');
        showToast("Message updated", "success");
      } else {
        // Send new message (with optional reply_to)
        const payload = {
          message: newMessage.trim(),
          reply_to: replyingTo ? replyingTo.id : null
        };
        const res = await api.post(`/teams/${teamId}/chat/`, payload);
        setMessages((prev) => [...prev, res.data]);
        setNewMessage('');
        setReplyingTo(null);
      }
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to process message", "error");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await api.delete(`/teams/${teamId}/chat/`, {
        data: { message_id: msgId }
      });
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      setActionMenuMsg(null);
      showToast("Message deleted", "success");
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to delete message", "error");
    }
  };

  const startEditMessage = (msg) => {
    setEditingMessage(msg);
    setNewMessage(msg.message);
    setReplyingTo(null);
    setActionMenuMsg(null);
  };

  const cancelEditOrReply = () => {
    setEditingMessage(null);
    setReplyingTo(null);
    setNewMessage('');
  };

  // Touch & Swipe handlers
  const handleTouchStart = (msg, e) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      setActionMenuMsg(msg);
    }, 500);
  };

  const handleTouchMove = (msg, e) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartPosRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);

    if (Math.abs(deltaX) > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (deltaX > 75 && deltaY < 30) {
      setReplyingTo(msg);
      setEditingMessage(null);
      touchStartPosRef.current = { x: 0, y: 0 };
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div className={`bg-white overflow-hidden flex flex-col relative ${
      fullScreen ? 'w-full h-full border-0 rounded-none shadow-none' : 'border border-gray-100 rounded-2xl shadow-xs h-[500px]'
    }`}>
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
      <div className="flex-1 min-h-0 p-3 md:p-4 overflow-y-auto space-y-2 bg-slate-50/50 relative">
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
              Start the discussion with your teammates. Swipe right to reply, or hold a message for options.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender === user?.id || msg.sender_username === user?.username;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isSameSender = prevMsg && (prevMsg.sender === msg.sender || (prevMsg.sender_username && prevMsg.sender_username === msg.sender_username)) && !msg.reply_to_details;

            return (
              <div
                key={msg.id}
                onTouchStart={(e) => handleTouchStart(msg, e)}
                onTouchMove={(e) => handleTouchMove(msg, e)}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setActionMenuMsg(msg);
                }}
                className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSameSender ? 'mt-1' : 'mt-3'} animate-fade-in relative select-none`}
              >
                {/* Render sender header ONLY for new sender or after a gap */}
                {!isSameSender && (
                  <div className="flex items-center space-x-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-gray-700">
                      {isMe ? 'You' : msg.sender_name}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.is_edited && <span className="ml-1 text-slate-400 italic">(edited)</span>}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-1.5 max-w-[85%] relative group">
                  {/* Desktop Quick Action Hover Toolbar */}
                  <div className={`hidden group-hover:flex items-center space-x-1 px-1.5 py-0.5 bg-white/90 shadow-md border border-gray-100 rounded-lg absolute -top-3.5 z-20 transition ${isMe ? 'right-2' : 'left-2'}`}>
                    <button
                      type="button"
                      onClick={() => { setReplyingTo(msg); setEditingMessage(null); }}
                      className="p-1 hover:text-blue-600 text-gray-500 rounded hover:bg-gray-100 transition"
                      title="Reply (or Swipe Right)"
                    >
                      <Reply size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setInfoModalMsg(msg); setActionMenuMsg(null); }}
                      className="p-1 hover:text-emerald-600 text-gray-500 rounded hover:bg-gray-100 transition"
                      title="Message Info & Read Status"
                    >
                      <Info size={11} />
                    </button>
                    {isMe && (
                      <button
                        type="button"
                        onClick={() => startEditMessage(msg)}
                        className="p-1 hover:text-indigo-600 text-gray-500 rounded hover:bg-gray-100 transition"
                        title="Edit Message"
                      >
                        <Edit3 size={11} />
                      </button>
                    )}
                    {isMe && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 hover:text-red-600 text-gray-500 rounded hover:bg-red-50 transition"
                        title="Delete Message"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>

                  {/* Message Bubble Container */}
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed font-medium shadow-2xs break-words relative transition-transform active:scale-[0.98] ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-gray-100 rounded-bl-xs'
                    }`}
                  >
                    {/* Quoted Reply Header */}
                    {msg.reply_to_details && (
                      <div className={`mb-1.5 px-2.5 py-1 rounded-xl text-[10px] border-l-2 font-medium truncate ${
                        isMe 
                          ? 'bg-blue-700/60 border-blue-200 text-blue-50' 
                          : 'bg-slate-100 border-blue-500 text-slate-700'
                      }`}>
                        <div className="font-bold flex items-center space-x-1">
                          <CornerUpLeft size={10} />
                          <span>{msg.reply_to_details.sender_name}</span>
                        </div>
                        <p className="truncate opacity-90 mt-0.5">{msg.reply_to_details.message}</p>
                      </div>
                    )}

                    <span>{msg.message}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Live Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-100/80 animate-fade-in w-fit shrink-0 mt-2">
            <div className="flex space-x-1 items-center">
              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <span>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is typing...' : 'are typing...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Long Press / Options Action Sheet Modal */}
      {actionMenuMsg && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-30 flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-4 w-full max-w-xs shadow-xl space-y-3 animate-scale-up border border-gray-100">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-900">Message Options</span>
              <button onClick={() => setActionMenuMsg(null)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>

            <div className="p-2 bg-gray-50 rounded-xl text-xs text-gray-700 truncate italic">
              "{actionMenuMsg.message}"
            </div>

            <div className="space-y-1">
              <button
                onClick={() => { setReplyingTo(actionMenuMsg); setEditingMessage(null); setActionMenuMsg(null); }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition flex items-center space-x-2"
              >
                <Reply size={14} />
                <span>Reply to Message</span>
              </button>

              <button
                onClick={() => { setInfoModalMsg(actionMenuMsg); setActionMenuMsg(null); }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition flex items-center space-x-2"
              >
                <Info size={14} />
                <span>Message Info & Read Status</span>
              </button>

              {(actionMenuMsg.sender === user?.id || actionMenuMsg.sender_username === user?.username) && (
                <button
                  onClick={() => startEditMessage(actionMenuMsg)}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition flex items-center space-x-2"
                >
                  <Edit3 size={14} />
                  <span>Edit Message</span>
                </button>
              )}

              {(actionMenuMsg.sender === user?.id || actionMenuMsg.sender_username === user?.username) && (
                <button
                  onClick={() => handleDeleteMessage(actionMenuMsg.id)}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center space-x-2"
                >
                  <Trash2 size={14} />
                  <span>Delete Message</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Detailed Info Modal */}
      {infoModalMsg && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-40 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-xl space-y-4 animate-scale-up border border-gray-100">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-1.5">
                <Info size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-gray-900">Message Info</span>
              </div>
              <button onClick={() => setInfoModalMsg(null)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-800 break-words font-medium border border-gray-100">
              "{infoModalMsg.message}"
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-2">
                <Clock size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Sent At</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(infoModalMsg.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Eye size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="w-full">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Read Receipts / Seen By ({infoModalMsg.seen_by_list ? infoModalMsg.seen_by_list.length : 0})
                  </span>
                  
                  {infoModalMsg.seen_by_list && infoModalMsg.seen_by_list.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {infoModalMsg.seen_by_list.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-1.5 bg-emerald-50/60 border border-emerald-100 rounded-lg text-emerald-900 font-semibold text-[11px]">
                          <span>{u.name}</span>
                          <CheckCircle2 size={12} className="text-emerald-600" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">Not seen by any teammates yet</p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setInfoModalMsg(null)}
              className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl text-xs transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Replying To / Editing Active Banner */}
      {(replyingTo || editingMessage) && (
        <div className="px-3 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between text-xs shrink-0 animate-fade-in">
          <div className="flex items-center space-x-2 truncate">
            {editingMessage ? (
              <>
                <Edit3 size={14} className="text-indigo-600 shrink-0" />
                <span className="font-bold text-indigo-900">Editing Message</span>
              </>
            ) : (
              <>
                <CornerUpLeft size={14} className="text-blue-600 shrink-0" />
                <span className="font-bold text-blue-900 truncate">
                  Replying to <span className="underline">{replyingTo.sender_name}</span>: "{replyingTo.message}"
                </span>
              </>
            )}
          </div>
          <button
            onClick={cancelEditOrReply}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-blue-100 transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2 shrink-0">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder={editingMessage ? "Update message..." : replyingTo ? "Type your reply..." : "Type a message to your team..."}
          className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50/50 focus:bg-white transition text-gray-800 font-medium"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-40 flex items-center justify-center space-x-1 shadow-xs"
        >
          {sending ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : editingMessage ? (
            <Check size={14} />
          ) : (
            <Send size={14} />
          )}
        </button>
      </form>
    </div>
  );
}
