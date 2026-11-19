import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, AlertCircle, UploadCloud } from 'lucide-react';
import { ImageComparisonSlider } from './ImageComparisonSlider';

// Sample curated after-images mapped to complaint categories for realistic inspection
const SAMPLE_AFTER_IMAGES = [
  {
    label: 'Clean Asphalt Road',
    category: 'POTHOLE',
    url: 'https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Cleared Sanitary Bin',
    category: 'GARBAGE',
    url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Repaired Water Pipeline',
    category: 'WATER_LEAK',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Restored LED Streetlight',
    category: 'STREETLIGHT',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80'
  }
];

/**
 * Resolution Audit Modal
 * 
 * Clean, Apple-inspired resolution sign-off dialog:
 * - Before / After visual remediation inspection
 * - Input fields for official division signoff and engineering notes
 * - High-contrast charcoal action buttons
 */
export const ResolutionModal = ({
  complaint,
  isOpen,
  onClose,
  onConfirmResolve,
  isSubmitting = false
}) => {
  const [notes, setNotes] = useState('');
  const [resolvedBy, setResolvedBy] = useState('Ward Quick Response Team (QRT)');
  const [afterImage, setAfterImage] = useState(SAMPLE_AFTER_IMAGES[0].url);
  const [error, setError] = useState('');

  /**
   * Pre-select matching after-photo preset based on complaint category:
   * Why: Ensures the default remediation evidence corresponds directly
   * to the issue being resolved (e.g. clean road for pothole, cleared bin for garbage).
   */
  useEffect(() => {
    if (complaint?.category) {
      const match = SAMPLE_AFTER_IMAGES.find((item) => item.category === complaint.category);
      if (match) {
        setAfterImage(match.url);
      }
    }
  }, [complaint]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please provide detailed engineering resolution notes.');
      return;
    }
    setError('');
    onConfirmResolve(complaint.id, {
      resolvedBy,
      notes,
      afterImageUrl: afterImage
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/40 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-zinc-200/80 rounded-2xl shadow-2xl p-6 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-900">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
                Resolve Ticket <span className="font-mono text-zinc-700">#{complaint.id}</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Municipal Work Verification &amp; Citizen Sign-Off
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Issue Summary Pill */}
          <div className="p-3.5 rounded-xl bg-zinc-50/80 border border-zinc-200/70 text-xs text-zinc-700">
            <span className="font-semibold text-zinc-900 block">{complaint.title}</span>
            <div className="mt-1 flex items-center gap-2 text-zinc-500">
              <span>Category: <strong className="text-zinc-700 font-medium">{complaint.category}</strong></span>
              <span>•</span>
              <span>Ward: <strong className="text-zinc-700 font-medium">{complaint.ward}</strong></span>
            </div>
          </div>

          {/* Interactive Before/After Visual Audit */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">
              Visual Remediation Audit (Before vs. After)
            </label>
            <ImageComparisonSlider
              beforeImage={complaint.imageUrl}
              afterImage={afterImage}
              beforeLabel="Reported Problem"
              afterLabel="Remediated Site"
            />
          </div>

          {/* Quick Select Preset After Images & Custom Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-zinc-500">
                Select verification photo preset:
              </span>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium border border-zinc-200/80 transition-colors">
                <UploadCloud className="w-3.5 h-3.5 text-zinc-600" />
                <span>Upload After Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAfterImage(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_AFTER_IMAGES.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAfterImage(item.url)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left truncate transition-all ${
                    afterImage === item.url
                      ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                      : 'border-zinc-200/80 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resolving Division */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Resolving Division / Officer Name
            </label>
            <input
              type="text"
              value={resolvedBy}
              onChange={(e) => setResolvedBy(e.target.value)}
              className="w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
              placeholder="e.g. Ward 4 PWD Division / Quick Action Unit"
              required
            />
          </div>

          {/* Resolution Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Resolution Audit Notes &amp; Action Taken
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
              placeholder="Detail the materials used, team dispatched, inspection confirmation, and date of completion..."
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors border border-zinc-200/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Signing Off...' : 'Confirm Resolution & Close SLA'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
