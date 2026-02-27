import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const NOTIFICATION_ICONS = {
  data_used: "📊",
  hypothesis_cited: "💡",
  asset_licensed: "🔐",
  validation_update: "✓",
  credit_update: "⚡",
  system: "ℹ️"
};

export default function NotificationsWidget({ userEmail }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications_widget", userEmail],
    queryFn: () => base44.entities.Notification.filter(
      { user_email: userEmail, is_read: false },
      "-created_date",
      5
    ),
    enabled: !!userEmail
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <h2 className="text-[#525153] text-sm font-semibold uppercase tracking-wider">
            Notifications
          </h2>
          <span className="inline-block bg-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {notifications.length}
          </span>
        </div>
        <Link to={createPageUrl("Notifications")}>
          <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-900">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        {notifications.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No notifications yet</p>
        ) : (
          <div className="divide-y divide-gray-50 space-y-0">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="text-lg flex-shrink-0">
                  {NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{notification.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}