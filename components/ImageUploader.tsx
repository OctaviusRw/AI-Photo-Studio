
import React, { useRef, useState, useCallback } from 'react';
import { ImageData } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { CameraIcon } from './icons/CameraIcon';

interface ImageUploaderProps {
  onImageUpload: (imageData: ImageData) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      onImageUpload({ base64, mimeType: file.type });
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-indigo-400');
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-indigo-400');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-indigo-400');
  };
  
  const openCamera = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        setIsCameraOpen(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Could not access the camera. Please check permissions.");
      }
    } else {
      setError("Camera access is not supported by your browser.");
    }
  }, []);

  const takePicture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64 = dataUrl.split(',')[1];
        onImageUpload({ base64, mimeType: 'image/jpeg' });
        closeCamera();
      }
    }
  };

  const closeCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsCameraOpen(false);
  };
  

  if (isCameraOpen) {
      return (
        <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-lg p-6 text-center shadow-lg">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-md mb-4"></video>
            <div className="flex justify-center gap-4">
                <button onClick={takePicture} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Take Picture</button>
                <button onClick={closeCamera} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">Cancel</button>
            </div>
        </div>
      )
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 text-center border-2 border-dashed border-gray-600 transition-colors duration-300">
      <div 
        className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <UploadIcon className="w-16 h-16 text-gray-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-200">Drag & Drop or Click to Upload</h2>
        <p className="text-gray-400 mt-2">Choose a photo from your device to start editing.</p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
      <div className="flex items-center my-4">
          <hr className="flex-grow border-t border-gray-700"/>
          <span className="px-4 text-gray-500">OR</span>
          <hr className="flex-grow border-t border-gray-700"/>
      </div>
      <button 
        onClick={openCamera}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-indigo-600 transition-colors duration-300"
      >
        <CameraIcon className="w-6 h-6" />
        Use Camera
      </button>

      {error && <p className="mt-4 text-red-400">{error}</p>}
    </div>
  );
};
