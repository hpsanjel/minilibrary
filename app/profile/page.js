"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, CreditCard, Shield, CheckCircle, AlertCircle, Camera, Save, Loader2 } from "lucide-react";

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        photo: "",
    });

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetchProfile();
        }
    }, [session]);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setFormData({
                    name: data.name || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    city: data.city || "",
                    postalCode: data.postalCode || "",
                    photo: data.photo || "",
                });
            } else {
                console.error("Failed to fetch profile");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setFormData((prev) => ({ ...prev, photo: data.url }));
                setMessage({ type: "success", text: "Photo uploaded! Don't forget to save changes." });
            } else {
                setMessage({ type: "error", text: "Failed to upload photo." });
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            setMessage({ type: "error", text: "An error occurred while uploading." });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                setMessage({ type: "success", text: "Profile updated successfully!" });
                // Update session to reflect changes immediately if needed
                await update({
                    ...session,
                    user: {
                        ...session.user,
                        name: updatedUser.name,
                        // Add other fields if they are in the session user object
                    },
                });
            } else {
                setMessage({ type: "error", text: "Failed to update profile." });
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: "error", text: "An error occurred while saving." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Please sign in to view your profile</p>
                    <button onClick={() => router.push("/auth/signin")} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header / Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32 sm:h-48 relative">
                        <div className="absolute -bottom-16 left-8 sm:left-12">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center relative">
                                    {formData.photo ? (
                                        <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-gray-300" />
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-black bg-opacity-40">
                                    <Camera className="w-8 h-8 text-white" />
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 px-8 sm:px-12 pb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{user?.name || "User"}</h1>
                                <p className="text-gray-500 flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4" /> {user?.email}
                                </p>
                            </div>
                            <div className="mt-4 sm:mt-0 flex gap-3">
                                <div className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${user?.verifiedUser === "Yes" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                    {user?.verifiedUser === "Yes" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {user?.verifiedUser === "Yes" ? "Verified" : "Unverified"}
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    {user?.role}
                                </div>
                            </div>
                        </div>

                        {message.text && (
                            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="md:col-span-2">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Personal Information</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Your Name" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Phone Number" />
                                </div>
                            </div>


                            <div className="md:col-span-2 mt-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Address Details</h2>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-gray-700">Street Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="123 Library St" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">City</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="City" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Postal Code</label>
                                <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Postal Code" />
                            </div>

                            <div className="md:col-span-2 mt-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Account Information</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="email" value={user?.email || ""} disabled className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Membership Number</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" value={user?.membershipNumber || "Not Assigned"} disabled className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-6 flex justify-end">
                                <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
