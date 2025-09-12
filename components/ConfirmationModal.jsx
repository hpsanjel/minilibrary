"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", confirmClass = "bg-red-600 text-white hover:bg-red-700" }) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
			<div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
				<button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
					<X className="w-5 h-5" />
				</button>
				<h2 className="text-xl font-bold mb-2">{title}</h2>
				<div className="text-gray-600 mb-6">{message}</div>
				<div className="flex justify-end space-x-3">
					<button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100">
						Cancel
					</button>
					<button onClick={onConfirm} className={`px-4 py-2 rounded-lg ${confirmClass}`}>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}
