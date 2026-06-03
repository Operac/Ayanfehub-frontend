import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Users, Package, Info, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
}

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace('/api', '') ?? 'http://localhost:5000';

let sharedSocket: Socket | null = null;
function getSocket(): Socket {
  if (!sharedSocket || !sharedSocket.connected) {
    // Auth is cookie-based (httpOnly); withCredentials sends the cookie automatically
    sharedSocket = io(SOCKET_URL, { withCredentials: true });
  }
  return sharedSocket;
}

function notifIcon(type: string) {
  if (type.startsWith('GROUP_BUY')) return <Users size={14} className="text-primary" />;
  if (type === 'ORDER_STATUS')       return <Package size={14} className="text-blue-500" />;
  if (type.startsWith('CLEANING'))   return <Sparkles size={14} className={type === 'CLEANING_INSPECTION_SCHEDULED' ? 'text-violet-500' : 'text-emerald-500'} />;
  return <Info size={14} className="text-gray-400" />;
}

function notifLink(n: Notification): string | null {
  if (n.data?.eventId)           return `/group-buy/${n.data.eventId}`;
  if (n.data?.orderId)           return `/orders`;
  if (n.data?.cleaningRequestId) return `/orders`;   // opens Orders → Cleaning tab
  return null;
}

async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await axios.get('/notifications');
  return data;
}

async function markAllRead(): Promise<void> {
  await axios.patch('/notifications/read-all');
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.isRead).length;

  // Load on open; mark all read when panel closes (after user has seen them)
  useEffect(() => {
    if (!user || !open) return;
    fetchNotifications().then(setNotifications).catch(() => {});
  }, [open, user]);

  useEffect(() => {
    // When panel transitions from open → closed, mark all as read
    if (!user || open) return;
    const hasUnread = notifications.some(n => !n.isRead);
    if (!hasUnread) return;
    markAllRead().then(() => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  // Socket.io — receive real-time notifications; disconnect on logout
  useEffect(() => {
    if (!user) {
      // User logged out — tear down shared socket so the next user gets a fresh connection
      if (sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
      setNotifications([]);
      return;
    }

    const socket = getSocket();

    const handleNotif = (n: Notification) => {
      setNotifications(prev => [n, ...prev.slice(0, 49)]);
    };

    socket.on('notification', handleNotif);

    // Fetch unread count on mount
    fetchNotifications().then(data => {
      setNotifications(data);
    }).catch(() => {});

    return () => { socket.off('notification', handleNotif); };
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={panelRef} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center size-10 rounded-xl hover:bg-surface transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-ink" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-black shadow-md shadow-primary/40"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/10 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-bold text-sm text-ink">Notifications</span>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-surface rounded-lg transition-colors">
                <X size={14} className="text-muted" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted">
                  <Bell size={24} className="mx-auto mb-2 text-gray-200" />
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 30).map(n => {
                  const link = notifLink(n);
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        setOpen(false);
                        if (link) navigate(link);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-3.5 hover:bg-surface transition-colors flex gap-3 items-start',
                        !n.isRead && 'bg-primary/5'
                      )}
                    >
                      <div className="mt-0.5 size-7 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                        {notifIcon(n.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-xs font-bold truncate', n.isRead ? 'text-ink' : 'text-primary')}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-muted/60 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                          {' · '}
                          {new Date(n.createdAt).toLocaleDateString('en-NG', { dateStyle: 'short' })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
