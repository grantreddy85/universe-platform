import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const TYPE_COLORS = {
  data_used: "bg-blue-100 text-blue-600",
  hypothesis_cited: "bg-violet-100 text-violet-600",
  asset_licensed: "bg-emerald-100 text-emerald-600",
  validation_update: "bg-amber-100 text-amber-600",
  credit_update: "bg-orange-100 text-orange-600",
  system: "bg-gray-100 text-gray-500",
};

const TYPE_LABELS = {
  data_used: "Data Used",
  hypothesis_cited: "Cited",
  asset_licensed: "Licensed",
  validation_update: "Validation",
  credit_update: "Credits",
  system: "System",
};

export default function NotificationBell({ userEmail }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }, "-created_date", 20),
    enabled: !!userEmail,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userEmail] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userEmail] }),
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4" strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-xl border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="text-[10px] text-blue-500 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
          {notifications.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? "bg-blue-50/40" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${TYPE_COLORS[n.type] || TYPE_COLORS.system}`}>
                    {TYPE_LABELS[n.type] || "System"}
                  </span>
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5 ml-auto" />}
                </div>
                <p className="text-xs font-medium text-gray-800 mt-1.5">{n.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-gray-300 mt-1.5">
                  {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}