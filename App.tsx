import React from 'react';
import { useState, useCallback } from 'react';
import { ImageData } from './types';
import { editImageWithPrompt, eraseImageWithMask, getEditingSuggestions } from './services/geminiService';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ImageViewer } from './components/ImageViewer';
import { EditorPanel } from './components/EditorPanel';

function App() {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [editedImage, setEditedImage] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  
  // Tool states
  const [isErasing, setIsErasing] = useState(false);
  const [isInpainting, setIsInpainting] = useState(false);
  const [inpaintPrompt, setInpaintPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(40);
  const [isExtending, setIsExtending] = useState(false);
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const resetAllToolStates = () => {
    setIsErasing(false);
    setIsInpainting(false);
    setIsExtending(false);
    setInpaintPrompt('');
  };

  const fetchSuggestions = useCallback(async (image: ImageData) => {
    setIsSuggesting(true);
    setError(null);
    try {
        const result = await getEditingSuggestions(image);
        setSuggestions(result);
    } catch (e) {
        setError("Could not load AI suggestions. Please try again.");
        setSuggestions([]);
    } finally {
        setIsSuggesting(false);
    }
  }, []);

  const handleImageUpload = useCallback((imageData: ImageData) => {
    setOriginalImage(imageData);
    setEditedImage(null);
    setError(null);
    setPrompt('');
    resetAllToolStates();
    setSuggestions([]);
    fetchSuggestions(imageData);
  }, [fetchSuggestions]);
  
  const handleRefreshSuggestions = useCallback(() => {
    if (originalImage) {
        fetchSuggestions(originalImage);
    }
  }, [originalImage, fetchSuggestions]);

  const handleEdit = async (editPrompt: string) => {
    const imageToEdit = editedImage || originalImage;
    if (!imageToEdit) return;

    setIsLoading(true);
    setError(null);
    setPrompt(editPrompt);
    resetAllToolStates();

    try {
      const result = await editImageWithPrompt(imageToEdit, editPrompt);
      setEditedImage(result);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleErase = async (mask: ImageData) => {
    const imageToEdit = editedImage || originalImage;
    if (!imageToEdit) return;

    setIsLoading(true);
    setError(null);
    setPrompt('Applying Magic Erase...');
    
    try {
        const result = await eraseImageWithMask(imageToEdit, mask);
        setEditedImage(result);
    } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unexpected error occurred during the erase operation.');
        }
    } finally {
        setIsLoading(false);
        resetAllToolStates();
        setPrompt('');
    }
  };

  const handleInpaint = async (mask: ImageData) => {
    const imageToEdit = editedImage || originalImage;
    if (!imageToEdit || !inpaintPrompt.trim()) {
        setError("Please describe what you want to add to the selected area.");
        return;
    };

    setIsLoading(true);
    setError(null);
    setPrompt(`Inpainting: ${inpaintPrompt}`);
    
    try {
        const img = new Image();
        const maskImg = new Image();

        // Use promises to wait for both images to load
        await Promise.all([
            new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = `data:${imageToEdit.mimeType};base64,${imageToEdit.base64}`;
            }),
            new Promise<void>((resolve, reject) => {
                maskImg.onload = () => resolve();
                maskImg.onerror = reject;
                maskImg.src = `data:${mask.mimeType};base64,${mask.base64}`;
            }),
        ]);

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not create canvas context.");

        // 1. Draw original image
        ctx.drawImage(img, 0, 0);

        // 2. Create a green version of the mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = img.naturalWidth;
        maskCanvas.height = img.naturalHeight;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) throw new Error("Could not create mask canvas context.");
        
        maskCtx.drawImage(maskImg, 0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.globalCompositeOperation = 'source-in';
        maskCtx.fillStyle = '#00FF00'; // Vibrant green
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        // 3. Draw the green mask over the original image
        ctx.drawImage(maskCanvas, 0, 0);

        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        const greenMaskedImage: ImageData = { base64, mimeType: 'image/png' };

        const finalPrompt = `In the following image, replace the solid green area with: "${inpaintPrompt}". Make sure to blend it seamlessly and realistically with the rest of the image.`;

        const result = await editImageWithPrompt(greenMaskedImage, finalPrompt);
        setEditedImage(result);

    } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unexpected error occurred during the inpaint operation.');
        }
    } finally {
        setIsLoading(false);
        resetAllToolStates();
        setPrompt('');
    }
  };
  
  const handleExtend = async (aspectRatio: number, name: string) => {
    const imageToExtend = editedImage || originalImage;
    if (!imageToExtend) return;

    setIsLoading(true);
    setError(null);
    setPrompt(`Extending image to a ${name} ratio...`);
    setIsExtending(false); // Hide buttons after selection

    try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = `data:${imageToExtend.mimeType};base64,${imageToExtend.base64}`;
        });
        
        const { naturalWidth: w, naturalHeight: h } = img;
        let newWidth: number, newHeight: number;

        if (w / h > aspectRatio) {
            newWidth = w;
            newHeight = Math.round(w / aspectRatio);
        } else {
            newHeight = h;
            newWidth = Math.round(h * aspectRatio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not create canvas context to extend image.");

        ctx.fillStyle = '#00FF00'; // Vibrant green
        ctx.fillRect(0, 0, newWidth, newHeight);
        const offsetX = (newWidth - w) / 2;
        const offsetY = (newHeight - h) / 2;
        ctx.drawImage(img, offsetX, offsetY);

        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        const paddedImage: ImageData = { base64, mimeType: 'image/png' };

        const extendPrompt = "Remove the solid green background and extend the central image to fill the entire canvas seamlessly and realistically.";

        const result = await editImageWithPrompt(paddedImage, extendPrompt);
        setEditedImage(result);
    } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unexpected error occurred during image extension.');
        }
    } finally {
        setIsLoading(false);
        setPrompt('');
    }
  };

  const handleReset = () => {
    setEditedImage(null);
    setError(null);
    setPrompt('');
    resetAllToolStates();
  };
  
  const handleBack = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setError(null);
    setPrompt('');
    resetAllToolStates();
    setSuggestions([]);
  };
  
  const handleStartErase = () => {
    resetAllToolStates();
    setIsErasing(true);
    setError(null);
  };

  const handleStartInpaint = () => {
    resetAllToolStates();
    setIsInpainting(true);
    setError(null);
  };
  
  const handleCancelDrawing = () => {
    setIsErasing(false);
    setIsInpainting(false);
  };

  const handleStartExtend = () => {
    resetAllToolStates();
    setIsExtending(prev => !prev);
  };
  
  const isDrawing = isErasing || isInpainting;
  const drawingInstruction = isErasing ? 'Draw on the area you want to remove' : 'Draw on the area you want to change';
  const onApplyMask = isErasing ? handleErase : handleInpaint;

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Header />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {!originalImage ? (
          <div className="mt-12">
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
            <div className="lg:col-span-3">
              <ImageViewer 
                originalImage={originalImage} 
                editedImage={editedImage} 
                isLoading={isLoading}
                prompt={prompt}
                isDrawing={isDrawing}
                onApplyMask={onApplyMask}
                onCancelDrawing={handleCancelDrawing}
                brushSize={brushSize}
                drawingInstruction={drawingInstruction}
              />
            </div>
            <div className="lg:col-span-2">
              <EditorPanel
                onEdit={handleEdit}
                onReset={handleReset}
                onBack={handleBack}
                isLoading={isLoading}
                hasEditedImage={!!editedImage}
                isErasing={isErasing}
                onStartErase={handleStartErase}
                isInpainting={isInpainting}
                onStartInpaint={handleStartInpaint}
                inpaintPrompt={inpaintPrompt}
                onInpaintPromptChange={setInpaintPrompt}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                isExtending={isExtending}
                onStartExtend={handleStartExtend}
                onExtend={handleExtend}
                suggestions={suggestions}
                isSuggesting={isSuggesting}
                onRefreshSuggestions={handleRefreshSuggestions}
              />
            </div>
          </div>
        )}
        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50">
            <p><span className="font-bold">Notice:</span> {error}</p>
            <button onClick={() => setError(null)} className="absolute top-1 right-2 text-red-100 hover:text-white">&times;</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;