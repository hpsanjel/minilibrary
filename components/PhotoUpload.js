"use client";
import { useRef, useState } from "react";

export default function PhotoUpload({ photo, setPhoto, disabled = false }) {
	const fileInputRef = useRef(null);
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const [showCamera, setShowCamera] = useState(false);
	const [stream, setStream] = useState(null);

	const handleFileUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith("image/")) {
				alert("Please select an image file");
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				alert("Please select an image smaller than 5MB");
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				setPhoto(e.target.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const startCamera = async () => {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "user" }, // Front-facing camera for selfies
			});
			setStream(mediaStream);
			setShowCamera(true);
			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream;
			}
		} catch (error) {
			console.error("Error accessing camera:", error);
			alert("Could not access camera. Please check permissions or use file upload instead.");
		}
	};

	const capturePhoto = () => {
		if (videoRef.current && canvasRef.current) {
			const video = videoRef.current;
			const canvas = canvasRef.current;
			const context = canvas.getContext("2d");

			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			context.drawImage(video, 0, 0);

			const dataURL = canvas.toDataURL("image/jpeg", 0.8);
			setPhoto(dataURL);
			stopCamera();
		}
	};

	const stopCamera = () => {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			setStream(null);
		}
		setShowCamera(false);
	};

	const removePhoto = () => {
		setPhoto("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	if (disabled) {
		return (
			<div>
				<label className="block mb-2 text-gray-700">Profile Photo</label>
				{photo ? (
					<div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300">
						<img src={photo} alt="Profile" className="w-full h-full object-cover" />
					</div>
				) : (
					<div className="w-24 h-24 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center">
						<span className="text-gray-500 text-sm">No photo</span>
					</div>
				)}
			</div>
		);
	}

	return (
		<div>
			<label className="block mb-2 text-gray-700">Profile Photo (Optional)</label>

			{!photo && !showCamera && (
				<div className="space-y-3">
					<div className="flex gap-2">
						<button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
							</svg>
							Upload
						</button>
						<button type="button" onClick={startCamera} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							Camera
						</button>
					</div>
					<input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
				</div>
			)}

			{showCamera && (
				<div className="space-y-3">
					<div className="relative">
						<video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover rounded border" />
						<canvas ref={canvasRef} className="hidden" />
					</div>
					<div className="flex gap-2">
						<button type="button" onClick={capturePhoto} className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
							Capture
						</button>
						<button type="button" onClick={stopCamera} className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
							Cancel
						</button>
					</div>
				</div>
			)}

			{photo && !showCamera && (
				<div className="space-y-3">
					<div className="relative">
						<img src={photo} alt="Profile preview" className="w-full h-48 object-cover rounded border" />
					</div>
					<div className="flex gap-2">
						<button type="button" onClick={removePhoto} className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors">
							Remove
						</button>
						<button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
							Change
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
