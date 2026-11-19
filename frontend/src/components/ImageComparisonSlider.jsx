import React, { useState, useRef, useCallback } from 'react';
import { Sliders } from 'lucide-react';

/**
 * Interactive Before / After Image Comparison Slider
 * 
 * Clean Apple-inspired visual verification control:
 * - Smooth drag handle across desktop and mobile
 * - High-contrast labels without sci-fi glow
 * - Soft border and elevation
 */
export const ImageComparisonSlider = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Reported Problem',
  afterLabel = 'Remediated Site'
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleStopDrag = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-medium text-zinc-500 px-1">
        <span className="flex items-center gap-1.5 text-zinc-700">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>{beforeLabel}</span>
        </span>
        <span className="flex items-center gap-1.5 text-zinc-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{afterLabel}</span>
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-64 sm:h-80 select-none overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-100 cursor-ew-resize shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] touch-none"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={handleStopDrag}
        onMouseLeave={handleStopDrag}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={handleStopDrag}
        onTouchMove={handleTouchMove}
      >
        {/* After Image (Background layer) */}
        <img
          src={afterImage}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Before Image (Clipped layer) */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="absolute top-0 left-0 h-full max-w-none object-cover"
            style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
          />
        </div>

        {/* Vertical divider line and handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.2)] pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-md text-zinc-700">
            <Sliders className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-zinc-800 pointer-events-none border border-zinc-200/80 shadow-sm">
          BEFORE
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-zinc-800 pointer-events-none border border-zinc-200/80 shadow-sm">
          AFTER
        </div>
      </div>

      <div className="text-center text-[11px] text-zinc-400">
        Drag slider sideways to inspect remediation quality
      </div>
    </div>
  );
};
