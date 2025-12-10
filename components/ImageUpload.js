"use client";
import { useState, useRef } from "react";

export default function ImageUpload({ image, setImage, label = "Image", optional = true }) {
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
                setImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }, // Back camera for book covers
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
            setImage(dataURL);
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

    const removeImage = () => {
        setImage("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div>
            <label className="block mb-2 font-semibold text-gray-700">
                {label} {optional && "(Optional)"}
            </label>

            {!image && !showCamera && (
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload Image
                        </button>
                        <button type="button" onClick={startCamera} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Take Photo
                        </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>
            )}

            {showCamera && (
                <div className="space-y-3">
                    <div className="relative">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover rounded-lg border" />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={capturePhoto} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Capture Photo
                        </button>
                        <button type="button" onClick={stopCamera} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {image && !showCamera && (
                <div className="space-y-3">
                    <div className="relative">
                        <img src={image} alt="Preview" className="w-full h-64 object-cover rounded-lg border" />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={removeImage} className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                            Remove Image
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            Change Image
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
