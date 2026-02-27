import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const NOTIFICATION_ICONS = {
  data_used: "📊",
  hypothesis_cited: "💡",
  asset_licensed: "🔐",
  validation_update: "✓",
  credit_update: "⚡",
  system: "ℹ️"
};

const NOTIFICATION_COLORS = {
  data_used: "bg-blue-50 border-blue-100",
  hypothesis_cited: "bg-amber-50 border-amber-100",
  asset_licensed: "bg-purple-50 border-purple-100",
  validation_update: "bg-emerald-50 border-emerald-100",
  credit_update: "bg-violet-50 border-violet-100",
  system: "bg-gray-50 border-gray-100"
};

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () =>
      base44.entities.Notification.filter(
        { user_email: user?.email },
        "-created_date",
        100
      ),
    enabled: !!user?.email
  });

  const filteredNotifications = filter === "all"
    ? notifications
    : filter === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === filter);

  const handleMarkAsRead = async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.is_read) {
      await base44.entities.Notification.update(notificationId, { is_read: true });
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] });
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    for (const notification of unreadNotifications) {
      await base44.entities.Notification.update(notification.id, { is_read: true });
    }
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <Link
        to={createPageUrl("Home")}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-6"
      >
        <ChevronLeft className="w-3 h-3" />
        Back
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 && `${unreadCount} unread · `}
            {notifications.length} total
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "all"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "unread"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
        {["data_used", "validation_update", "credit_update"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              filter === type
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {type.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400">
            {filter === "all"
              ? "No notifications yet"
              : `No ${filter} notifications`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                notification.is_read ? "opacity-60" : "opacity-100"
              } ${NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.system}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">
                  {NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system}
                </span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {notification.created_date
                      ? new Date(notification.created_date).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                        )
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}