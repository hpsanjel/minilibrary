"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpen, Calendar, AlertCircle, CheckCircle, DollarSign, Clock, ArrowLeft } from "lucide-react";

export default function MyBooksPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("borrowed"); // borrowed, returned, all
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (session?.user?.id) {
            fetchMyBooks();
        }
    }, [session]);

    const fetchMyBooks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/transactions?userId=${session.user.id}`);
            const data = await res.json();
            setTransactions(data);
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter((tx) => {
        if (filter === "borrowed") return !tx.returned;
        if (filter === "returned") return tx.returned;
        return true;
    });

    const calculateDaysRemaining = (deadline) => {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const calculateFine = (deadline, returned) => {
        if (returned) return 0;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        if (now <= deadlineDate) return 0;
        const daysOverdue = Math.floor((now - deadlineDate) / (1000 * 60 * 60 * 24));
        return daysOverdue * 5; // 5 NOK per day
    };

    const totalActiveFines = filteredTransactions
        .filter((tx) => !tx.returned)
        .reduce((sum, tx) => sum + calculateFine(tx.deadline, tx.returned), 0);

    const activeBorrowCount = transactions.filter((tx) => !tx.returned).length;

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Please sign in to view your books</p>
                    <button onClick={() => router.push("/auth/signin")} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Books</h1>
                    <p className="text-gray-600">Manage your borrowed books and view your reading history</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Currently Borrowed</p>
                                <p className="text-3xl font-bold text-blue-600">{activeBorrowCount}</p>
                            </div>
                            <BookOpen className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Borrowed</p>
                                <p className="text-3xl font-bold text-gray-900">{transactions.length}</p>
                            </div>
                            <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Active Fines</p>
                                <p className="text-3xl font-bold text-red-600">{totalActiveFines} NOK</p>
                            </div>
                            <DollarSign className="w-12 h-12 text-red-500 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="flex border-b">
                        <button onClick={() => setFilter("borrowed")} className={`flex-1 px-6 py-4 text-sm font-medium transition ${filter === "borrowed" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                            Currently Borrowed ({activeBorrowCount})
                        </button>
                        <button onClick={() => setFilter("returned")} className={`flex-1 px-6 py-4 text-sm font-medium transition ${filter === "returned" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                            Returned ({transactions.filter((tx) => tx.returned).length})
                        </button>
                        <button onClick={() => setFilter("all")} className={`flex-1 px-6 py-4 text-sm font-medium transition ${filter === "all" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                            All ({transactions.length})
                        </button>
                    </div>
                </div>

                {/* Books List */}
                <div className="bg-white rounded-lg shadow">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                            <p className="mt-4 text-gray-500">Loading your books...</p>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
                            <p className="text-gray-500 mb-6">
                                {filter === "borrowed" ? "You don't have any borrowed books" : filter === "returned" ? "You haven't returned any books yet" : "You haven't borrowed any books yet"}
                            </p>
                            <button onClick={() => router.push("/books")} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                Browse Books
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredTransactions.map((tx) => {
                                const daysRemaining = calculateDaysRemaining(tx.deadline);
                                const fine = calculateFine(tx.deadline, tx.returned);
                                const isOverdue = daysRemaining < 0 && !tx.returned;
                                const isDueSoon = daysRemaining <= 2 && daysRemaining >= 0 && !tx.returned;

                                return (
                                    <div key={tx.id} className={`p-6 ${isOverdue ? "bg-red-50" : isDueSoon ? "bg-yellow-50" : ""}`}>
                                        <div className="flex items-start gap-6">
                                            {/* Book Cover */}
                                            <div className="flex-shrink-0">
                                                {tx.Book.coverUrl ? (
                                                    <img src={tx.Book.coverUrl} alt={tx.Book.title} className="w-24 h-32 object-cover rounded-lg border shadow" />
                                                ) : (
                                                    <div className="w-24 h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                                                        <BookOpen className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Book Details */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{tx.Book.title}</h3>
                                                <p className="text-sm text-gray-600 mb-3">by {tx.Book.author}</p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">Borrowed:</span>
                                                        <span className="font-medium">{new Date(tx.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">Due:</span>
                                                        <span className={`font-medium ${isOverdue ? "text-red-600" : isDueSoon ? "text-yellow-600" : ""}`}>{new Date(tx.deadline).toLocaleDateString()}</span>
                                                    </div>
                                                    {tx.returned && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                            <span className="text-gray-600">Returned:</span>
                                                            <span className="font-medium text-green-600">{new Date(tx.returnedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                    {fine > 0 && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <DollarSign className="w-4 h-4 text-red-500" />
                                                            <span className="text-gray-600">Fine:</span>
                                                            <span className="font-medium text-red-600">{fine} NOK</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Status Badge */}
                                                <div className="flex items-center gap-2">
                                                    {tx.returned ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Returned
                                                        </span>
                                                    ) : isOverdue ? (
                                                        <>
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Overdue ({Math.abs(daysRemaining)} days)
                                                            </span>
                                                            {fine > 0 && <span className="text-xs text-red-600 font-medium">Fine: {fine} NOK</span>}
                                                        </>
                                                    ) : isDueSoon ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Due in {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                            <BookOpen className="w-3 h-3" />
                                                            Borrowed ({daysRemaining} days remaining)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Help Text */}
                {activeBorrowCount > 0 && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Reminder</p>
                                <p>Please return your books on time to avoid fines. Overdue books are charged at 5 NOK per day.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
