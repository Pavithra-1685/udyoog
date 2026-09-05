import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, Briefcase, Award, CheckCircle2, AlertCircle, Calendar, Sparkles, X, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { realtimeNotificationChannel } from '../../../lib/notificationService';
import { toast } from 'sonner';

interface NotificationItem {
  id: string;
  user_id?: string | null;
  type: string;
  title: string;
  message: string;
  related_job_id?: string | null;
  related_application_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell({ userEmail }: { userEmail?: string }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'faculty' | 'student'>('student');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Fetch current user & initial notifications
  useEffect(() => {
    let isSubscribed = true;

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isSubscribed) {
          setCurrentUserId(user.id);

          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          const role = (profile?.role || user.user_metadata?.role || 'student') as any;
          setUserRole(role);

          // Fetch notifications from database
          fetchNotifications(user.id, role);
        }
      } catch (err) {
        console.error('Notification bell init error:', err);
      }
    };

    init();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const fetchNotifications = async (userId: string, role: string) => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25);

      // Filter by user or broadcast/role
      const { data, error } = await query;
      if (!error && data && Array.isArray(data)) {
        // Client side filtering to guarantee RLS or role matches
        const filtered = data.filter((item: NotificationItem) => {
          if (!item) return false;
          if (!item.user_id) return true; // Broadcast
          if (item.user_id === userId) return true;
          if (role === 'admin' && typeof item.type === 'string' && item.type.includes('admin')) return true;
          if (role === 'faculty' && typeof item.type === 'string' && item.type.includes('faculty')) return true;
          return false;
        });
        setNotifications(filtered);
      }
    } catch (err) {
      console.warn('Notifications load fallback:', err);
    }
  };

  // 2. Setup Realtime Subscriptions (Dual: Postgres Changes + Channel Broadcast)
  useEffect(() => {
    if (!currentUserId) return;
    let channel: any = null;

    try {
      // Create channel and attach ALL listeners BEFORE calling .subscribe()
      channel = supabase
        .channel(`udyoog_notifs_${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            const newNotif = payload?.new as NotificationItem;
            if (!newNotif) return;
            if (
              !newNotif.user_id ||
              newNotif.user_id === currentUserId ||
              (userRole === 'admin' && typeof newNotif.type === 'string' && newNotif.type.includes('admin')) ||
              (userRole === 'faculty' && typeof newNotif.type === 'string' && newNotif.type.includes('faculty'))
            ) {
              handleIncomingNotification(newNotif);
            }
          }
        )
        .on(
          'broadcast',
          { event: 'new_notification' },
          (event) => {
            const newNotif = event?.payload as NotificationItem;
            if (!newNotif) return;
            if (
              !newNotif.user_id ||
              newNotif.user_id === currentUserId ||
              (userRole === 'admin' && typeof newNotif.type === 'string' && newNotif.type.includes('admin')) ||
              (userRole === 'faculty' && typeof newNotif.type === 'string' && newNotif.type.includes('faculty'))
            ) {
              handleIncomingNotification(newNotif);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription fallback error:', err);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [currentUserId, userRole]);

  const handleIncomingNotification = (newNotif: NotificationItem) => {
    setNotifications((prev) => {
      // Prevent duplicates
      if (prev.some((n) => n.id === newNotif.id)) return prev;
      return [newNotif, ...prev];
    });

    // Instant toast feedback for live active user
    toast(newNotif.title, {
      description: newNotif.message,
      icon: '🔔',
      duration: 5000
    });
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    try {
      if (!id.startsWith('temp-')) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      if (currentUserId) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .or(`user_id.eq.${currentUserId},user_id.is.null`);
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);

    // Route navigation based on user role and notification type
    if (userRole === 'student') {
      if (item.related_job_id) {
        navigate(`/jobs`);
      } else {
        navigate('/student-dashboard');
      }
    } else if (userRole === 'admin' || userRole === 'faculty') {
      if (item.type.includes('application') || item.type.includes('mapping')) {
        navigate('/mapped-candidates');
      } else if (item.related_job_id) {
        navigate('/dashboard');
      } else {
        navigate('/mapped-candidates');
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'admin_application':
      case 'faculty_application':
        return <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'recommendation':
        return <Award className="w-4 h-4 text-[var(--gold-medium)] shrink-0" />;
      case 'mapping':
        return <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'interview':
        return <Calendar className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'selection':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'rejection':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500 shrink-0" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-700 hover:text-black hover:bg-gray-100 transition-all focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm font-mono"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notifications Dropdown Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-200/90 z-50 overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[var(--gold-medium)]" />
                <h3 className="font-extrabold text-[#111111] text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-red-50 text-red-600 border border-red-200/80 rounded-full font-mono">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-[var(--gold-medium)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100/80 custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-4 transition-all cursor-pointer flex items-start gap-3 relative group ${
                      !item.is_read
                        ? 'bg-amber-50/60 border-l-4 border-l-[var(--gold-medium)] hover:bg-amber-50/90'
                        : 'bg-white hover:bg-gray-50/80'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white border border-gray-100 shadow-2xs shrink-0 mt-0.5">
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs ${!item.is_read ? 'font-black text-[#111111]' : 'font-bold text-gray-800'} truncate`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-snug break-words">
                        {item.message}
                      </p>
                    </div>

                    {!item.is_read && (
                      <button
                        onClick={(e) => markAsRead(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all absolute right-3 top-3 border border-transparent hover:border-gray-200"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-gray-400 text-xs font-medium space-y-2">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto stroke-1" />
                  <p>No notifications yet.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/40 text-center shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                UDYOOG Real-time Engine
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
