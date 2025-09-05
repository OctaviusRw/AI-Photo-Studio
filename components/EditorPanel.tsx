import React, { useState } from 'react';
import { QuickEdit } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { PaletteIcon } from './icons/PaletteIcon';
import { FaceSmileIcon } from './icons/FaceSmileIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { MagicEraseIcon } from './icons/MagicEraseIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { ArrowsOutIcon } from './icons/ArrowsOutIcon';
import { ArrowClockwiseIcon } from './icons/ArrowClockwiseIcon';
import { PaintBrushIcon } from './icons/PaintBrushIcon';

interface EditorPanelProps {
  onEdit: (prompt: string) => void;
  onReset: () => void;
  onBack: () => void;
  isLoading: boolean;
  hasEditedImage: boolean;
  isErasing: boolean;
  onStartErase: () => void;
  isInpainting: boolean;
  onStartInpaint: () => void;
  inpaintPrompt: string;
  onInpaintPromptChange: (prompt: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  isExtending: boolean;
  onStartExtend: () => void;
  onExtend: (aspectRatio: number, name: string) => void;
  suggestions: string[];
  isSuggesting: boolean;
  onRefreshSuggestions: () => void;
}

const quickEdits: QuickEdit[] = [
  { id: 'enhance', name: 'Enhance', prompt: 'Enhance the photo with better lighting, sharpness, and clarity. Make it look more professional.', icon: SparklesIcon },
  { id: 'vibrant', name: 'Vibrant', prompt: 'Make the colors in this image more vibrant and saturated. Boost the contrast.', icon: PaletteIcon },
  { id: 'portrait', name: 'Portrait', prompt: 'Turn this into a professional portrait. Soften the background to create a bokeh effect and enhance the facial features.', icon: FaceSmileIcon },
];

const aspectRatios = [
    { name: '16:9', value: 16 / 9 },
    { name: '4:3', value: 4 / 3 },
    { name: '1:1', value: 1 / 1 },
    { name: '3:4', value: 3 / 4 },
    { name: '9:16', value: 9 / 16 },
];

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  onEdit, 
  onReset, 
  onBack,
  isLoading,
  hasEditedImage,
  isErasing,
  onStartErase,
  isInpainting,
  onStartInpaint,
  inpaintPrompt,
  onInpaintPromptChange,
  brushSize,
  onBrushSizeChange,
  isExtending,
  onStartExtend,
  onExtend,
  suggestions,
  isSuggesting,
  onRefreshSuggestions
}) => {
  const [prompt, setPrompt] = useState('');

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onEdit(prompt);
    }
  };
  
  const handleSuggestionClick = (suggestionPrompt: string) => {
    setPrompt(suggestionPrompt);
    onEdit(suggestionPrompt);
  };

  const isToolActive = isErasing || isExtending || isInpainting;
  const isDrawingToolActive = isErasing || isInpainting;

  const renderToolUI = () => {
    if (isErasing) {
      return (
        <div>
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Eraser Size</h3>
           <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-gray-300 w-10 text-center">{brushSize}px</span>
            </div>
        </div>
      );
    }
    if (isInpainting) {
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Describe what to add</h3>
              <textarea
                value={inpaintPrompt}
                onChange={(e) => onInpaintPromptChange(e.target.value)}
                placeholder="e.g., 'a golden retriever' or 'a bouquet of roses'"
                className="w-full h-20 p-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 transition"
                disabled={isLoading}
                />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Brush Size</h3>
               <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-gray-300 w-10 text-center">{brushSize}px</span>
                </div>
            </div>
          </div>
        );
    }
    return null;
  }

  return (
    <div className="w-full bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 space-y-6 shadow-2xl border border-gray-700">
      
      {isDrawingToolActive ? renderToolUI() : (
      <>
        <div className={isExtending ? 'opacity-50 pointer-events-none' : ''}>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-100">AI Suggestions</h3>
                <button 
                    onClick={onRefreshSuggestions} 
                    disabled={isLoading || isSuggesting}
                    className="p-1.5 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Refresh suggestions"
                >
                    <ArrowClockwiseIcon className={`w-5 h-5 text-gray-300 ${isSuggesting ? 'animate-spin' : ''}`} />
                </button>
            </div>
             <div className="space-y-2">
                {isSuggesting ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="w-full h-10 bg-gray-700 rounded-lg animate-pulse"></div>
                    ))
                ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isLoading || isToolActive}
                            className="w-full text-left px-4 py-2 bg-gray-700 rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-200"
                        >
                            {suggestion}
                        </button>
                    ))
                ) : (
                     <div className="text-center py-4 text-sm text-gray-400">
                        No suggestions available. Try refreshing!
                    </div>
                )}
            </div>
        </div>
        
        <div className={`border-t border-gray-700 pt-6 ${isExtending ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Describe Your Edit</h3>
            <form onSubmit={handlePromptSubmit}>
                <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'add a cat wearing a party hat' or 'change the background to a beach at sunset'"
                className="w-full h-24 p-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 transition"
                disabled={isLoading || isToolActive}
                />
                <button 
                type="submit"
                disabled={isLoading || !prompt.trim() || isToolActive}
                className="w-full mt-3 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                {isLoading && !isToolActive ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <MagicWandIcon className="w-5 h-5" />
                    <span>Generate Edit</span>
                  </>
                )}
                </button>
            </form>
        </div>
        
        <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Tools</h3>
            <div className="space-y-3">
              <button
                  onClick={onStartErase}
                  disabled={isLoading || isToolActive}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <MagicEraseIcon className="w-5 h-5"/>
                  <span>Magic Erase</span>
              </button>
               <button
                  onClick={onStartInpaint}
                  disabled={isLoading || isToolActive}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <PaintBrushIcon className="w-5 h-5"/>
                  <span>Inpaint</span>
              </button>
               <button
                  onClick={onStartExtend}
                  disabled={isLoading || isDrawingToolActive}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isExtending ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                  <ArrowsOutIcon className="w-5 h-5"/>
                  <span>Extend Image</span>
              </button>
              {isExtending && (
                <div className="bg-gray-900/50 p-3 rounded-md">
                    <p className="text-sm text-center text-gray-300 mb-3">Choose an aspect ratio:</p>
                    <div className="grid grid-cols-5 gap-2">
                        {aspectRatios.map(ratio => (
                            <button
                                key={ratio.name}
                                onClick={() => onExtend(ratio.value, ratio.name)}
                                className="px-2 py-1.5 text-xs font-mono bg-gray-700 text-gray-200 rounded-md hover:bg-indigo-600 hover:text-white transition-colors"
                            >
                                {ratio.name}
                            </button>
                        ))}
                    </div>
                </div>
              )}
            </div>
        </div>
      </>
      )}

      <div className="flex gap-4 pt-6 border-t border-gray-700">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          <ArrowUturnLeftIcon className="w-5 h-5" />
          <span>Start Over</span>
        </button>
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !hasEditedImage}
        >
          <ArrowPathIcon className="w-5 h-5" />
          <span>Reset to Original</span>
        </button>
      </div>
    </div>
  );
};