import { Bell, Heart, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleNotificationClick = (notification: { id: string; is_read: boolean }) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifikationer</h4>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={() => markAllAsRead.mutate()}
            >
              <Check className="h-3 w-3 mr-1" />
              Markera alla
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Laddar...
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-full flex-shrink-0",
                      notification.type === "upvote"
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-secondary/10 text-secondary"
                    )}
                  >
                    {notification.type === "upvote" ? (
                      <Heart className="h-4 w-4" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: sv,
                      })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Inga notifikationer ännu
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
