import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ImageData } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

interface ImageViewerProps {
  originalImage: ImageData;
  editedImage: ImageData | null;
  isLoading: boolean;
  prompt: string;
  isDrawing: boolean;
  onApplyMask: (mask: ImageData) => void;
  onCancelDrawing: () => void;
  brushSize: number;
  drawingInstruction: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  originalImage, 
  editedImage, 
  isLoading, 
  prompt,
  isDrawing: isDrawingMode,
  onApplyMask,
  onCancelDrawing,
  brushSize,
  drawingInstruction
}) => {
  const activeImage = editedImage || originalImage;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number, y: number } | null>(null);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [getCanvasContext]);

  // Resize and position canvas to match the image's rendered dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const imgElement = imageRef.current;

    if (isDrawingMode && canvas && container && imgElement) {
      const setupCanvas = () => {
        const imgRect = imgElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        canvas.width = imgRect.width;
        canvas.height = imgRect.height;
        canvas.style.left = `${imgRect.left - containerRect.left}px`;
        canvas.style.top = `${imgRect.top - containerRect.top}px`;
        
        clearCanvas();
      };

      const resizeObserver = new ResizeObserver(setupCanvas);
      
      if (imgElement.complete) {
        setupCanvas();
      } else {
        imgElement.onload = setupCanvas;
      }

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
        imgElement.onload = null;
      };
    }
  }, [isDrawingMode, activeImage.base64, clearCanvas]);

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };
  
  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = getCanvasContext();
    const pos = getPointerPos(e);
    if (ctx && pos && lastPos.current) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)'; // red-500 with transparency
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPos.current = pos;
    }
  }, [isDrawing, getCanvasContext, brushSize]);

  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const pos = getPointerPos(e);
    if(pos) {
      setIsDrawing(true);
      lastPos.current = pos;
      // Also draw a single point for clicks without dragging
      const ctx = getCanvasContext();
      if (ctx) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
        ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [getCanvasContext, brushSize]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawingMode) return;
    
    const options = { passive: false };

    canvas.addEventListener('mousedown', startDrawing, options);
    canvas.addEventListener('mousemove', draw, options);
    document.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    canvas.addEventListener('touchstart', startDrawing, options);
    canvas.addEventListener('touchmove', draw, options);
    document.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      document.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      document.removeEventListener('touchend', stopDrawing);
    };
  }, [isDrawingMode, startDrawing, draw, stopDrawing]);

  const handleApplyMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if the canvas is blank before proceeding
    const isCanvasBlank = !canvas.getContext('2d')
      ?.getImageData(0, 0, canvas.width, canvas.height).data
      .some(channel => channel !== 0);

    if (isCanvasBlank) {
      console.log("Canvas is blank, not applying mask.");
      return; // Do nothing if nothing was drawn
    }

    const originalSizedCanvas = document.createElement('canvas');
    const img = new Image();
    img.onload = () => {
        originalSizedCanvas.width = img.naturalWidth;
        originalSizedCanvas.height = img.naturalHeight;
        const ctx = originalSizedCanvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(canvas, 0, 0, originalSizedCanvas.width, originalSizedCanvas.height);
            const dataUrl = originalSizedCanvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1];
            onApplyMask({ base64, mimeType: 'image/png' });
            clearCanvas();
        }
    }
    img.src = `data:${activeImage.mimeType};base64,${activeImage.base64}`;
  };

  const downloadImage = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = `data:${editedImage.mimeType};base64,${editedImage.base64}`;
    link.download = 'edited-photo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div ref={containerRef} className="relative w-full aspect-square bg-gray-800/50 rounded-lg overflow-hidden flex items-center justify-center shadow-2xl border border-gray-700">
      <img
        ref={imageRef}
        src={`data:${activeImage.mimeType};base64,${activeImage.base64}`}
        alt={editedImage ? 'Edited result' : 'Original upload'}
        className="max-w-full max-h-full object-contain"
        crossOrigin="anonymous"
      />
      {isDrawingMode && (
        <>
            <canvas ref={canvasRef} className="absolute z-20 cursor-crosshair" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-4 bg-black/60 backdrop-blur-sm p-3 rounded-lg shadow-xl">
                <button onClick={handleApplyMask} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Apply</button>
                <button onClick={clearCanvas} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">Clear</button>
                <button onClick={onCancelDrawing} className="px-4 py-2 bg-red-800/80 text-white rounded-md hover:bg-red-700/80 transition">Cancel</button>
            </div>
            <div className="absolute top-4 text-center w-full z-20 pointer-events-none">
                <p className="bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm inline-block">{drawingInstruction}</p>
            </div>
        </>
      )}
      {isLoading && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-40">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-400"></div>
          <p className="mt-4 text-lg font-semibold">AI is thinking...</p>
          <p className="text-gray-300 text-sm mt-1">{prompt}</p>
        </div>
      )}
      {!isDrawingMode && <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
        {editedImage ? 'Edited Image' : 'Original Image'}
      </div>}
      {editedImage && !isDrawingMode && (
        <button 
          onClick={downloadImage}
          className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 z-20"
          aria-label="Download edited image"
          >
          <DownloadIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};