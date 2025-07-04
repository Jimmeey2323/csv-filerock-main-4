
import React from 'react';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingLoaderProps {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
}

const ProcessingLoader: React.FC<ProcessingLoaderProps> = ({
  isProcessing,
  progress,
  currentStep,
}) => {
  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <Loader className="h-10 w-10 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold mb-1">Processing Files</h3>
          <p className="text-muted-foreground mb-4">{currentStep}</p>

          <div className="w-full mb-2">
            <div className="progress-bar h-2">
              <div 
                className="progress-value" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{progress.toFixed(0)}% Complete</p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingLoader;
