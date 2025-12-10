import prisma from "@/lib/prisma";

/**
 * Create a notification for a user
 * @param {number} userId - User ID to send notification to
 * @param {string} type - Notification type (BOOK_ISSUED, BOOK_RETURNED, etc.)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} actionUrl - Optional URL for action
 * @param {object} metadata - Optional metadata (bookId, transactionId, etc.)
 */
export async function createNotification(userId, type, title, message, actionUrl = null, metadata = null) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                actionUrl,
                metadata,
            },
        });
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        return null;
    }
}

/**
 * Notify user when a book is issued
 */
export async function notifyBookIssued(transaction) {
    const book = transaction.Book || transaction.book;
    const title = "Book Borrowed Successfully";
    const message = `You've borrowed "${book.title}". Please return it by ${new Date(transaction.deadline).toLocaleDateString()}.`;
    const actionUrl = "/my-books";
    const metadata = {
        bookId: transaction.bookId,
        transactionId: transaction.id,
        deadline: transaction.deadline,
    };

    return await createNotification(transaction.userId, "BOOK_ISSUED", title, message, actionUrl, metadata);
}

/**
 * Notify user when a book is returned
 */
export async function notifyBookReturned(transaction) {
    const book = transaction.Book || transaction.book;
    const title = "Book Returned Successfully";
    const message = `You've successfully returned "${book.title}". Thank you!`;
    const actionUrl = "/books";
    const metadata = {
        bookId: transaction.bookId,
        transactionId: transaction.id,
    };

    return await createNotification(transaction.userId, "BOOK_RETURNED", title, message, actionUrl, metadata);
}

/**
 * Notify user when a book is due soon (2 days before deadline)
 */
export async function notifyBookDueSoon(transaction) {
    const book = transaction.Book || transaction.book;
    const title = "Book Due Soon";
    const message = `Your book "${book.title}" is due in 2 days. Please return it by ${new Date(transaction.deadline).toLocaleDateString()}.`;
    const actionUrl = "/my-books";
    const metadata = {
        bookId: transaction.bookId,
        transactionId: transaction.id,
        deadline: transaction.deadline,
    };

    return await createNotification(transaction.userId, "BOOK_DUE_SOON", title, message, actionUrl, metadata);
}

/**
 * Notify user when a book is overdue
 */
export async function notifyBookOverdue(transaction) {
    const book = transaction.Book || transaction.book;
    const daysOverdue = Math.floor((new Date() - new Date(transaction.deadline)) / (1000 * 60 * 60 * 24));
    const title = "Book Overdue";
    const message = `Your book "${book.title}" is ${daysOverdue} day(s) overdue. Please return it as soon as possible to avoid additional fines.`;
    const actionUrl = "/my-books";
    const metadata = {
        bookId: transaction.bookId,
        transactionId: transaction.id,
        daysOverdue,
    };

    return await createNotification(transaction.userId, "BOOK_OVERDUE", title, message, actionUrl, metadata);
}

/**
 * Notify user when a fine is cleared
 */
export async function notifyFineCleared(userId, amount, bookTitle) {
    const title = "Fine Cleared";
    const message = `Your fine of ${amount} NOK for "${bookTitle}" has been cleared.`;
    const actionUrl = "/my-books";
    const metadata = {
        amount,
        bookTitle,
    };

    return await createNotification(userId, "FINE_CLEARED", title, message, actionUrl, metadata);
}
