import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                city: true,
                postalCode: true,
                address: true,
                photo: true,
                membershipNumber: true,
                role: true,
                verifiedUser: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { name, phone, city, postalCode, address, photo } = data;

        // Basic validation could go here

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                phone,
                city,
                postalCode,
                address,
                photo,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                city: true,
                postalCode: true,
                address: true,
                photo: true,
                membershipNumber: true,
                role: true,
                verifiedUser: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
