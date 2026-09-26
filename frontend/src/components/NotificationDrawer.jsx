import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Bell, CheckCheck, Ticket, Megaphone, UserPlus } from 'lucide-react';

export const NotificationDrawer = () => {
  const { notifications, isNotificationDrawerOpen, setIsNotificationDrawerOpen, markNotificationsAsRead } = useApp();

  if (!isNotificationDrawerOpen) return null;

  const notifIcons = {
    event: <Ticket className="w-4 h-4 text-cyan-600" />,
    announcement: <Megaphone className="w-4 h-4 text-amber-600" />,
    recruitment: <UserPlus className="w-4 h-4 text-rose-600" />
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white border-l border-slate-200 h-full shadow-2xl flex flex-col justify-between">
        
        {/* Drawer Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-cyan-600" />
            <h3 className="font-bold text-sm text-slate-900">Notifications & Alerts</h3>
          </div>
          <button
            onClick={() => setIsNotificationDrawerOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-100 pb-2">
            <span>Recent Updates</span>
            <button
              onClick={markNotificationsAsRead}
              className="text-cyan-700 font-semibold hover:underline flex items-center space-x-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          </div>

          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                n.read ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-cyan-50/60 border-cyan-200 text-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                {notifIcons[n.type] || <Bell className="w-4 h-4 text-cyan-600" />}
                <span className="font-bold text-slate-900 text-xs">{n.title}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
              <span className="text-[10px] text-slate-400 block pt-1">{n.timestamp}</span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <p className="text-[10px] text-slate-500">
            Real-time updates powered by Ruet Club Zone
          </p>
        </div>

      </div>
    </div>
  );
};
