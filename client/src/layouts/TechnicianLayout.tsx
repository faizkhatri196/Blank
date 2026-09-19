import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import { Wrench, CheckCircle2, UserCheck, LogOut, Bell, X, ExternalLink } from 'lucide-react';
import { PortalSwitcher } from '../components/common/PortalSwitcher';

interface InAppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  relatedTicketId?: string;
  metadata?: {
    serviceType?: string;
    location?: string;
    problemCategory?: string;
  };
  read: boolean;
  createdAt: string;
}

export const TechnicianLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifs(true);
      const res = await apiClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'TECHNICIAN') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s poll
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await apiClient.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleOpenJob = (notif: InAppNotification) => {
    if (!notif.read) {
      handleMarkAsRead(notif._id);
    }
    setIsNotifOpen(false);
    if (notif.relatedTicketId) {
      navigate(`/technician/jobs/${notif.relatedTicketId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm font-bold">
        Loading Field Ops...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'CUSTOMER') {
    return <Navigate to="/customer" replace />;
  }

  if (user.role !== 'TECHNICIAN') {
    return <Navigate to="/manager/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900/5 sm:bg-slate-200/50 pb-20 items-center">
      <div className="w-full max-w-lg flex flex-col min-h-screen bg-slate-100 sm:shadow-xl sm:border-x sm:border-slate-300 relative">
        {/* High-contrast mobile top bar */}
        <header className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div>
            <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>SERVORA</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                Field Pro
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {user.name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) fetchNotifications();
                }}
                title="Assignment Notifications"
                className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fadeIn">
                  <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold">Assignment Notifications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-emerald-400 hover:underline font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsNotifOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {isLoadingNotifs ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Checking notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                        <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto" />
                        <p>No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-3 text-xs space-y-1.5 transition-colors ${
                            notif.read ? 'bg-white opacity-85' : 'bg-emerald-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                              )}
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-snug">
                            {notif.message}
                          </p>

                          {notif.metadata && (
                            <div className="flex flex-wrap gap-1 text-[10px]">
                              {notif.metadata.serviceType && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700">
                                  {notif.metadata.serviceType}
                                </span>
                              )}
                              {notif.metadata.location && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                  📍 {notif.metadata.location}
                                </span>
                              )}
                              {notif.metadata.problemCategory && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                  {notif.metadata.problemCategory}
                                </span>
                              )}
                            </div>
                          )}

                          {notif.relatedTicketId && (
                            <div className="pt-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleOpenJob(notif)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                <span>View Job</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <PortalSwitcher variant="dark" />
            <button
              onClick={logout}
              title="Sign out"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main mobile workspace */}
        <main className="flex-1 p-3.5 sm:p-4 w-full">
          <Outlet />
        </main>

        {/* Fixed bottom navigation with large touch targets */}
        <nav className="fixed bottom-0 inset-x-0 sm:max-w-lg sm:mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-around py-2 px-2 shadow-lg sm:border-x">
          <NavLink
            to="/technician/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl font-bold text-[11px] transition-all ${
                isActive ? 'text-emerald-700 bg-emerald-50 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Wrench className="w-5 h-5" />
            <span>Active Jobs</span>
          </NavLink>

          <NavLink
            to="/technician/jobs?status=COMPLETED"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl font-bold text-[11px] transition-all ${
                isActive ? 'text-emerald-700 bg-emerald-50 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Completed</span>
          </NavLink>

          <NavLink
            to="/technician/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl font-bold text-[11px] transition-all ${
                isActive ? 'text-emerald-700 bg-emerald-50 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <UserCheck className="w-5 h-5" />
            <span>My Profile</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

