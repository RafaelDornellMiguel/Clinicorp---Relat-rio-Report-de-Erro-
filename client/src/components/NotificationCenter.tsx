import { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const { data: notifications, refetch } = trpc.notifications.list.useQuery({
    unreadOnly: false,
  });

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDelete = (notificationId: number) => {
    // Implement delete if needed
    console.log("Delete notification:", notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "critical_report":
        return "🔴";
      case "sla_warning":
        return "⏰";
      case "status_changed":
        return "🔄";
      case "assigned_to_you":
        return "👤";
      case "system":
        return "⚙️";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "critical_report":
        return "bg-red-50 border-red-200";
      case "sla_warning":
        return "bg-orange-50 border-orange-200";
      case "status_changed":
        return "bg-blue-50 border-blue-200";
      case "assigned_to_you":
        return "bg-purple-50 border-purple-200";
      case "system":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:w-[500px]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Centro de Notificações</SheetTitle>
                <SheetDescription>
                  {unreadCount} notificação{unreadCount !== 1 ? "ões" : ""} não lida
                  {unreadCount !== 1 ? "s" : ""}
                </SheetDescription>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    notifications?.forEach((n: any) => {
                      if (!n.isRead) {
                        handleMarkAsRead(n.id);
                      }
                    });
                  }}
                  disabled={markAsReadMutation.isPending}
                >
                  Marcar tudo como lido
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition ${getNotificationColor(notification.type)} ${
                    !notification.isRead ? "border-l-4" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-1">{getNotificationIcon(notification.type)}</span>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 hover:bg-gray-200 rounded transition"
                          title="Marcar como lido"
                        >
                          <Check className="h-4 w-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {notification.actionUrl && (
                    <a
                      href={notification.actionUrl}
                      className="text-xs text-blue-600 hover:underline mt-2 block"
                      onClick={() => setOpen(false)}
                    >
                      Ver detalhes →
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma notificação</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
