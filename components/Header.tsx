
import React from 'react';
import { CameraIcon } from './icons/CameraIcon';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/70 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16">
          <div className="flex items-center space-x-3">
            <CameraIcon className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              AI Photo Studio
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};
