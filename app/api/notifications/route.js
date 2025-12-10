import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - Fetch notifications for current user
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get("unreadOnly") === "true";
        const limit = parseInt(searchParams.get("limit") || "50");

        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
                ...(unreadOnly && { read: false }),
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });

        return new Response(JSON.stringify(notifications), { status: 200 });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch notifications" }), { status: 500 });
    }
}

// PATCH - Mark notification(s) as read
export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { notificationIds, markAllAsRead } = await req.json();

        if (markAllAsRead) {
            // Mark all notifications as read for this user
            await prisma.notification.updateMany({
                where: {
                    userId: session.user.id,
                    read: false,
                },
                data: {
                    read: true,
                },
            });
        } else if (notificationIds && Array.isArray(notificationIds)) {
            // Mark specific notifications as read
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: session.user.id, // Ensure user owns these notifications
                },
                data: {
                    read: true,
                },
            });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error("Error updating notifications:", error);
        return new Response(JSON.stringify({ error: "Failed to update notifications" }), { status: 500 });
    }
}

// DELETE - Delete notification(s)
export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { notificationIds } = await req.json();

        if (notificationIds && Array.isArray(notificationIds)) {
            await prisma.notification.deleteMany({
                where: {
                    id: { in: notificationIds },
                    userId: session.user.id, // Ensure user owns these notifications
                },
            });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error("Error deleting notifications:", error);
        return new Response(JSON.stringify({ error: "Failed to delete notifications" }), { status: 500 });
    }
}
