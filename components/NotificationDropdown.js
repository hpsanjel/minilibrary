"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, BookOpen, AlertCircle, CheckCircle, DollarSign, X } from "lucide-react";

export default function NotificationDropdown({ session }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const res = await fetch("/api/notifications/unread-count");
            const data = await res.json();
            setUnreadCount(data.count || 0);
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications?limit=10");
            const data = await res.json();
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: [notificationId] }),
            });
            // Update local state
            setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllAsRead: true }),
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.actionUrl) {
            router.push(notification.actionUrl);
        }
        setIsOpen(false);
    };

    // Get icon for notification type
    const getNotificationIcon = (type) => {
        switch (type) {
            case "BOOK_ISSUED":
                return <BookOpen className="w-5 h-5 text-blue-500" />;
            case "BOOK_RETURNED":
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "BOOK_DUE_SOON":
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case "BOOK_OVERDUE":
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case "FINE_CLEARED":
                return <DollarSign className="w-5 h-5 text-green-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    // Format time ago
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Fetch unread count on mount and periodically
    useEffect(() => {
        if (session) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
            return () => clearInterval(interval);
        }
    }, [session]);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen && session) {
            fetchNotifications();
        }
    }, [isOpen, session]);

    if (!session) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-gray-700 rounded-full transition relative" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white text-gray-900 rounded-lg shadow-2xl z-50 border animate-fade-in max-h-[32rem] flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 rounded transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                <p className="mt-2 text-sm text-gray-500">Loading...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button key={notification.id} onClick={() => handleNotificationClick(notification)} className={`w-full p-4 hover:bg-gray-50 flex items-start gap-3 border-b transition text-left ${!notification.read ? "bg-blue-50" : ""}`}>
                                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>{notification.title}</h4>
                                            {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notification.createdAt)}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t bg-gray-50 rounded-b-lg text-center">
                            <button
                                onClick={() => {
                                    router.push("/notifications");
                                    setIsOpen(false);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
