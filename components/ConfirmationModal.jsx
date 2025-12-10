"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel", confirmClass = "bg-red-600 text-white hover:bg-red-700", hideCancel = false, isLoading = false }) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
			<div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
				<button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" disabled={isLoading}>
					<X className="w-5 h-5" />
				</button>
				<h2 className="text-xl font-bold mb-2">{title}</h2>
				<div className="text-gray-600 mb-6">{message}</div>
				<div className="flex justify-end space-x-3">
					{!hideCancel && (
						<button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100" disabled={isLoading}>
							{cancelText}
						</button>
					)}
					<button
						onClick={onConfirm}
						className={`px-4 py-2 rounded-lg flex items-center gap-2 ${confirmClass} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
						disabled={isLoading}
					>
						{isLoading && (
							<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						)}
						{isLoading ? 'Processing...' : confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}
