import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../Common/Badge';
import { Send, CheckCircle2, User, Building, Clock } from 'lucide-react';

export function TicketDetailModal({ isOpen, onClose, ticketId, onRefresh }) {
  const { user, isAdmin, isHr, isPrivileged } = useAuth();
  const { showToast } = useNotification();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadTicket = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const res = await api.getHelpdeskTicket(ticketId);
      if (res.success) {
        setTicket(res.ticket);
        setMessages(res.messages || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    try {
      const res = await api.sendHelpdeskMessage(ticketId, { message: replyText.trim() });
      if (res.success) {
        setMessages([...messages, res.newMessage]);
        setReplyText('');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.updateHelpdeskStatus(ticketId, { status: newStatus });
      if (res.success) {
        setTicket({ ...ticket, status: newStatus });
        showToast(`Ticket marked as ${newStatus}`, 'success');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ticket #${ticketId}: ${ticket?.subject || 'Loading...'}`}
      maxWidth="max-w-2xl"
    >
      {loading ? (
        <div className="p-8 text-center text-xs text-stone-400">Loading conversation...</div>
      ) : !ticket ? (
        <div className="p-6 text-center text-xs text-stone-400">Ticket not found</div>
      ) : (
        <div className="space-y-4">
          {/* Ticket Header & Status Controls */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900">{ticket.employee_name}</span>
                <span className="text-stone-400">• {ticket.employee_department}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-800">
                  {ticket.category}
                </span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  ticket.priority === 'URGENT' ? 'bg-rose-100 text-rose-900 font-black' : 'bg-amber-100 text-amber-900'
                }`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="text-stone-400 text-[11px]">
                Created: {new Date(ticket.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Status Control */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Status:</span>
              {isPrivileged ? (
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              ) : (
                <Badge status={ticket.status}>{ticket.status}</Badge>
              )}
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="bg-stone-50/50 rounded-2xl border border-stone-200 p-4 max-h-80 overflow-y-auto space-y-3">
            {messages.map((m) => {
              const isMe = m.sender_id === user?.id;
              const isSenderHr = m.sender_role === 'HR' || m.sender_role === 'ADMIN';

              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <img
                    src={m.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                    alt={m.sender_name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-stone-200"
                  />

                  <div className={`max-w-[78%] ${isMe ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-stone-400" style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <span className="font-bold text-stone-700">{m.sender_name}</span>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase ${
                        isSenderHr ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {m.sender_role}
                      </span>
                      <span>• {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed inline-block text-left shadow-xs ${
                        isMe
                          ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none'
                          : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Form */}
          {ticket.status !== 'CLOSED' ? (
            <form onSubmit={handleSendReply} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={isPrivileged ? "Write a response to the employee..." : "Type your reply to HR..."}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-stone-950" />
                <span>{sending ? 'Sending...' : 'Reply'}</span>
              </button>
            </form>
          ) : (
            <div className="p-3 bg-stone-100 rounded-xl text-center text-xs text-stone-500 font-semibold">
              This support ticket is closed.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default TicketDetailModal;
