import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - Get count of unread notifications
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new Response(JSON.stringify({ count: 0 }), { status: 200 });
        }

        const count = await prisma.notification.count({
            where: {
                userId: session.user.id,
                read: false,
            },
        });

        return new Response(JSON.stringify({ count }), { status: 200 });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        return new Response(JSON.stringify({ count: 0 }), { status: 200 });
    }
}
