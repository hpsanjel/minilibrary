"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, BookOpen, AlertCircle, CheckCircle, DollarSign, Trash2, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, unread, read
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        if (session) {
            fetchNotifications();
        }
    }, [session, filter]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const unreadOnly = filter === "unread";
            const res = await fetch(`/api/notifications?limit=100&unreadOnly=${unreadOnly}`);
            const data = await res.json();

            if (filter === "read") {
                setNotifications(data.filter((n) => n.read));
            } else {
                setNotifications(data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: [notificationId] }),
            });
            setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllAsRead: true }),
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await fetch("/api/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: [notificationId] }),
            });
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.actionUrl) {
            router.push(notification.actionUrl);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "BOOK_ISSUED":
                return <BookOpen className="w-6 h-6 text-blue-500" />;
            case "BOOK_RETURNED":
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case "BOOK_DUE_SOON":
                return <AlertCircle className="w-6 h-6 text-yellow-500" />;
            case "BOOK_OVERDUE":
                return <AlertCircle className="w-6 h-6 text-red-500" />;
            case "FINE_CLEARED":
                return <DollarSign className="w-6 h-6 text-green-500" />;
            default:
                return <Bell className="w-6 h-6 text-gray-500" />;
        }
    };

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

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Please sign in to view notifications</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
                    <p className="text-gray-600">Stay updated with your library activities</p>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="flex border-b">
                        <button onClick={() => setFilter("all")} className={`flex-1 px-6 py-4 text-sm font-medium transition ${filter === "all" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                            All
                        </button>
                        <button onClick={() => setFilter("unread")} className={`flex-1 px-6 py-4 text-sm font-medium transition ${filter === "unread" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                            Unread
                        </button>
                        <button onClick={() => setFilter("read")} className={`flex-1 px-6 py-4 text-sm font-medium transition ${filter === "read" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                            Read
                        </button>
                    </div>

                    {/* Actions Bar */}
                    {notifications.some((n) => !n.read) && (
                        <div className="px-6 py-3 bg-gray-50 border-b flex justify-end">
                            <button onClick={markAllAsRead} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                                <CheckCheck className="w-4 h-4" />
                                Mark all as read
                            </button>
                        </div>
                    )}
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-lg shadow">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                            <p className="mt-4 text-gray-500">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                            <p className="text-gray-500">
                                {filter === "unread" ? "You're all caught up!" : filter === "read" ? "No read notifications yet" : "You don't have any notifications yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div key={notification.id} className={`p-6 hover:bg-gray-50 transition ${!notification.read ? "bg-blue-50" : ""}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <button onClick={() => handleNotificationClick(notification)} className="text-left flex-1">
                                                    <h3 className={`text-base font-semibold mb-1 ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>{notification.title}</h3>
                                                    <p className="text-sm text-gray-600">{notification.message}</p>
                                                </button>
                                                {!notification.read && <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>}
                                            </div>
                                            <div className="flex items-center justify-between mt-3">
                                                <span className="text-xs text-gray-400">{timeAgo(notification.createdAt)}</span>
                                                <div className="flex items-center gap-2">
                                                    {!notification.read && (
                                                        <button onClick={() => markAsRead(notification.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded hover:bg-blue-50 transition">
                                                            Mark as read
                                                        </button>
                                                    )}
                                                    <button onClick={() => deleteNotification(notification.id)} className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded hover:bg-red-50 transition flex items-center gap-1">
                                                        <Trash2 className="w-3 h-3" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
