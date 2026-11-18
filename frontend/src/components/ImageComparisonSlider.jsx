import React, { useState, useRef, useCallback } from 'react';
import { Sliders, Sparkles } from 'lucide-react';

/**
 * Interactive Before / After Image Comparison Slider
 * 
 * Why this is structured this way:
 * - Transparency & Accountability: Citizens and city supervisors require visual proof
 *   that municipal repair work was carried out thoroughly.
 * - Supports drag tracking across desktop (mouse) and mobile (touch).
 * - Smooth split-screen clip-path rendering with interactive handle.
 */
export const ImageComparisonSlider = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Reported Defect',
  afterLabel = 'Rectified Work'
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
      <div className="flex items-center justify-between text-xs font-medium text-slate-400 px-1">
        <span className="flex items-center gap-1 text-rose-400">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          {beforeLabel}
        </span>
        <span className="flex items-center gap-1 text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          {afterLabel}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-64 sm:h-80 select-none overflow-hidden rounded-xl border border-slate-700 bg-slate-900 cursor-ew-resize shadow-2xl"
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
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)] pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center shadow-lg text-emerald-400">
            <Sliders className="w-4 h-4" />
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-300 pointer-events-none border border-rose-500/30">
          BEFORE
        </div>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-300 pointer-events-none border border-emerald-500/30">
          AFTER
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-500">
        Drag slider sideways to compare municipal remediation quality
      </div>
    </div>
  );
};
