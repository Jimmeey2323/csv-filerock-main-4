import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, File, FilePlus, FileArchive, Check, Sparkles, TrendingUp, UploadCloud, Trash2, Loader, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Utility function for combining class names
const cnUtil = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface TextShimmerProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const [shimmerPosition, setShimmerPosition] = useState('100% center');

  useEffect(() => {
    const interval = setInterval(() => {
      setShimmerPosition(prev => prev === '100% center' ? '0% center' : '100% center');
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [duration]);

  const dynamicSpread = React.useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <Component
      className={cnUtil(
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text',
        'text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]',
        '[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]',
        'dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]',
        className
      )}
      style={
        {
          '--spread': `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
          backgroundPosition: shimmerPosition,
          transition: `background-position ${duration}s linear`,
        } as React.CSSProperties
      }
    >
      {children}
    </Component>
  );
}

interface MousePosition {
  x: number;
  y: number;
}

function useMousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return mousePosition;
}

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): number[] {
  hex = hex.replace('#', '');

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const hexInt = parseInt(hex, 16);
  const red = (hexInt >> 16) & 255;
  const green = (hexInt >> 8) & 255;
  const blue = hexInt & 255;
  return [red, green, blue];
}

const Particles: React.FC<ParticlesProps> = ({
  className = '',
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = '#ffffff',
  vx = 0,
  vy = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Circle[]>([]);
  const mousePosition = useMousePosition();
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext('2d');
    }
    initCanvas();
    animate();
    window.addEventListener('resize', initCanvas);

    return () => {
      window.removeEventListener('resize', initCanvas);
    };
  }, [color]);

  useEffect(() => {
    onMouseMove();
  }, [mousePosition.x, mousePosition.y]);

  useEffect(() => {
    initCanvas();
  }, [refresh]);

  const initCanvas = () => {
    resizeCanvas();
    drawParticles();
  };

  const onMouseMove = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const { w, h } = canvasSize.current;
      const x = mousePosition.x - rect.left - w / 2;
      const y = mousePosition.y - rect.top - h / 2;
      const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
      if (inside) {
        mouse.current.x = x;
        mouse.current.y = y;
      }
    }
  };

  type Circle = {
    x: number;
    y: number;
    translateX: number;
    translateY: number;
    size: number;
    alpha: number;
    targetAlpha: number;
    dx: number;
    dy: number;
    magnetism: number;
  };

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current.length = 0;
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
    }
  };

  const circleParams = (): Circle => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const translateX = 0;
    const translateY = 0;
    const pSize = Math.floor(Math.random() * 2) + size;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.1;
    const dy = (Math.random() - 0.5) * 0.1;
    const magnetism = 0.1 + Math.random() * 4;
    return {
      x,
      y,
      translateX,
      translateY,
      size: pSize,
      alpha,
      targetAlpha,
      dx,
      dy,
      magnetism,
    };
  };

  const rgb = hexToRgb(color);

  const drawCircle = (circle: Circle, update = false) => {
    if (context.current) {
      const { x, y, translateX, translateY, size, alpha } = circle;
      context.current.translate(translateX, translateY);
      context.current.beginPath();
      context.current.arc(x, y, size, 0, 2 * Math.PI);
      context.current.fillStyle = `rgba(${rgb.join(', ')}, ${alpha})`;
      context.current.fill();
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!update) {
        circles.current.push(circle);
      }
    }
  };

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h,
      );
    }
  };

  const drawParticles = () => {
    clearContext();
    const particleCount = quantity;
    for (let i = 0; i < particleCount; i++) {
      const circle = circleParams();
      drawCircle(circle);
    }
  };

  const remapValue = (
    value: number,
    start1: number,
    end1: number,
    start2: number,
    end2: number,
  ): number => {
    const remapped =
      ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  };

  const animate = () => {
    clearContext();
    circles.current.forEach((circle: Circle, i: number) => {
      const edge = [
        circle.x + circle.translateX - circle.size,
        canvasSize.current.w - circle.x - circle.translateX - circle.size,
        circle.y + circle.translateY - circle.size, 
        canvasSize.current.h - circle.y - circle.translateY - circle.size,
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = parseFloat(
        remapValue(closestEdge, 0, 20, 0, 1).toFixed(2),
      );
      if (remapClosestEdge > 1) {
        circle.alpha += 0.02;
        if (circle.alpha > circle.targetAlpha) {
          circle.alpha = circle.targetAlpha;
        }
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge;
      }
      circle.x += circle.dx + vx;
      circle.y += circle.dy + vy;
      circle.translateX +=
        (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) /
        ease;
      circle.translateY +=
        (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) /
        ease;

      drawCircle(circle, true);

      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        circles.current.splice(i, 1);
        const newCircle = circleParams();
        drawCircle(newCircle);
      }
    });
    window.requestAnimationFrame(animate);
  };

  return (
    <div
      className={cnUtil('pointer-events-none', className)}
      ref={canvasContainerRef}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
};

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
  onProcessFiles: () => void;
  files: File[];
  onRemoveFile: (index: number) => void;
  accept?: string;
  maxFiles?: number;
}

interface FileWithPreview {
  id: string;
  preview: string;
  progress: number;
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  file?: File;
}

const COLORS_TOP = ['#13FFAA', '#1E67C6', '#CE84CF', '#DD335C'];

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesAdded,
  onProcessFiles,
  files,
  onRemoveFile,
  accept = '.csv',
  maxFiles = 10,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [internalFiles, setInternalFiles] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex(prev => (prev + 1) % COLORS_TOP.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync internal files with external files prop
  useEffect(() => {
    const newInternalFiles = files.map((f, index) => ({
      id: `${f.name}-${index}-${Date.now()}`,
      preview: URL.createObjectURL(f),
      progress: 100, // Files are already uploaded
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
      file: f,
    }));
    setInternalFiles(newInternalFiles);
  }, [files]);

  const currentColor = COLORS_TOP[colorIndex];

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (fileList: File[]) => {
    const csvFiles = fileList.filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      toast.error('Please upload CSV files only');
      return;
    }
    
    if (csvFiles.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files at once`);
      return;
    }

    onFilesAdded(csvFiles);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (index: number) => {
    onRemoveFile(index);
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full relative overflow-hidden">
      {/* Animated Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(125% 125% at 50% 0%, #020617 50%, ${currentColor})`,
          transition: 'background 3s ease-in-out'
        }}
      />

      <Particles
        className="absolute inset-0"
        quantity={150}
        ease={80}
        color="#ffffff"
        refresh
      />

      {/* Hero and Upload Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-12 text-gray-200 z-10">
        <div className="relative z-10 flex flex-col items-center text-center w-full px-4 max-w-6xl">
          {/* Hero Content */}
          <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 px-6 py-3 text-sm font-medium shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              Real-time Processing • Advanced Analytics • Interactive Dashboards
            </div>
          </div>

          <div className="mb-8">
            <TextShimmer
              as="h1"
              className="max-w-4xl bg-gradient-to-br from-white via-blue-100 to-purple-200 bg-clip-text text-center text-4xl font-bold leading-tight text-transparent sm:text-6xl sm:leading-tight md:text-7xl md:leading-tight"
              duration={3}
            >
              Studio Performance Analytics
            </TextShimmer>
          </div>

          <p className="mb-12 max-w-3xl text-center text-lg leading-relaxed text-gray-300 md:text-xl md:leading-relaxed">
            Transform your studio data into actionable insights with our powerful analytics engine. 
            Upload your CSV files and unlock comprehensive performance metrics, teacher comparisons, and growth opportunities.
          </p>

          {/* File Upload Section */}
          <div className="w-full max-w-4xl space-y-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={cnUtil(
                'relative rounded-3xl p-12 text-center cursor-pointer transition-all duration-300',
                'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl',
                'hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]',
                isDragging && 'ring-4 ring-blue-400/30 border-blue-500 bg-blue-500/10 scale-[1.02]',
              )}
              style={{
                boxShadow: isDragging ? `0px 4px 24px ${currentColor}` : undefined,
              }}
            >
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  <div 
                    className="absolute -inset-6 rounded-full blur-xl opacity-50"
                    style={{
                      background: `radial-gradient(circle, ${currentColor}40, transparent)`,
                      animation: isDragging ? 'pulse 1.5s infinite' : undefined,
                    }}
                  />
                  <div className="relative p-6 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
                    <UploadCloud
                      className={cnUtil(
                        'w-16 h-16 transition-all duration-300',
                        isDragging ? 'text-blue-400 scale-110' : 'text-gray-300 group-hover:text-blue-400',
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-white">
                    {isDragging
                      ? 'Drop CSV files here'
                      : internalFiles.length
                      ? 'Add more CSV files'
                      : 'Upload your CSV files'}
                  </h3>
                  <p className="text-gray-300 text-lg max-w-md mx-auto">
                    {isDragging ? (
                      <span className="font-medium text-blue-400 flex items-center justify-center gap-2">
                        <ArrowRight className="h-5 w-5" />
                        Release to upload
                      </span>
                    ) : (
                      <>
                        Drag & drop CSV files here, or{' '}
                        <span className="text-blue-400 font-medium hover:text-blue-300 transition-colors">browse</span>
                      </>
                    )}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-400">
                    <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">New Clients</span>
                    <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">Bookings</span>
                    <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">Payments</span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={accept}
                  multiple
                  onChange={handleFileInput}
                />
              </div>
            </div>

            {/* File List */}
            {internalFiles.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="font-bold text-2xl text-white flex items-center gap-2">
                    <File className="h-6 w-6 text-blue-400" />
                    Uploaded files ({internalFiles.length})
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        // Clear all files
                        for (let i = internalFiles.length - 1; i >= 0; i--) {
                          removeFile(i);
                        }
                      }}
                      className="text-sm font-medium px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 hover:text-red-200 transition-all duration-200 border border-red-500/30"
                    >
                      <Trash2 className="h-4 w-4 mr-2 inline" />
                      Clear all
                    </button>
                    
                    {/* Process Files Button */}
                    <Button
                      onClick={onProcessFiles}
                      disabled={internalFiles.length === 0}
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <TrendingUp className="h-5 w-5" />
                      Process Files ({internalFiles.length})
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 max-h-96 overflow-y-auto pr-2">
                  {internalFiles.map((file, index) => (
                    <div
                      key={file.id}
                      className="px-6 py-4 flex items-center gap-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/10"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.5s ease-out forwards'
                      }}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
                          <File className="w-8 h-8 text-blue-400" />
                        </div>
                        {file.progress === 100 && (
                          <div className="absolute -right-1 -bottom-1 bg-green-500 rounded-full p-1 shadow-lg">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-lg text-white truncate" title={file.name}>
                            {file.name}
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">
                              {formatFileSize(file.size)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="p-1 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors duration-200"
                              aria-label="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-green-500 to-emerald-400"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 w-full">
        <div className="text-center">
          <p className="text-gray-400 text-lg font-light tracking-wide">
            Crafted with precision by{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold">
              Jimmeey
            </span>
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FileUploader;