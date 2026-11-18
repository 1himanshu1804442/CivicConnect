import React, { useState } from 'react';
import { X, CheckCircle, Upload, ShieldCheck, AlertCircle } from 'lucide-react';
import { ImageComparisonSlider } from './ImageComparisonSlider';

/**
 * Resolution Audit Modal
 * 
 * Why this is structured this way:
 * - Municipal governance requires verifiable accountability before a citizen complaint is marked resolved.
 * - Authorities must provide resolution notes and visual proof (after-remediation photo).
 * - Incorporates the Before/After comparison slider so officers inspect the change prior to final sign-off.
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
  const [afterImage, setAfterImage] = useState(
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
  );
  const [error, setError] = useState('');

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

  // Sample curated after-images for quick testing
  const sampleAfterImages = [
    { label: 'Clean Asphalt Road', url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80' },
    { label: 'Cleared Sanitary Bin', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80' },
    { label: 'Repaired Water Pipeline', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80' },
    { label: 'Restored LED Streetlight', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Resolve Complaint #{complaint.id}
              </h3>
              <p className="text-xs text-slate-400">
                Official Municipal Work Verification & Citizen Sign-Off
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Issue Summary */}
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-white">{complaint.title}</span>
            <div className="mt-1 flex items-center gap-3 text-slate-400">
              <span>Category: <strong className="text-slate-200">{complaint.category}</strong></span>
              <span>•</span>
              <span>Ward: <strong className="text-slate-200">{complaint.ward}</strong></span>
            </div>
          </div>

          {/* Interactive Before/After Visual Audit */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Visual Remediation Audit (Before vs. After)
            </label>
            <ImageComparisonSlider
              beforeImage={complaint.imageUrl}
              afterImage={afterImage}
              beforeLabel="Reported Problem"
              afterLabel="Remediated Site"
            />
          </div>

          {/* Quick Select Preset After Images */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">
              Select verification photo preset or provide image URL:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sampleAfterImages.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAfterImage(item.url)}
                  className={`px-2 py-1.5 rounded text-[11px] font-medium border text-left truncate transition-all ${
                    afterImage === item.url
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resolving Division */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Resolving Division / Officer Name
            </label>
            <input
              type="text"
              value={resolvedBy}
              onChange={(e) => setResolvedBy(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
              placeholder="e.g. Ward 4 PWD Division / Quick Action Unit"
              required
            />
          </div>

          {/* Resolution Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Resolution Audit Notes & Action Taken
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
              placeholder="Detail the materials used, team dispatched, inspection confirmation, and date of completion..."
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Signing Off...' : 'Confirm Resolution & Close SLA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
