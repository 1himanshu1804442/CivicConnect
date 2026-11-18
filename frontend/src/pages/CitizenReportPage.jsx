import React, { useState } from 'react';
import { 
  Camera, 
  UploadCloud, 
  MapPin, 
  CheckCircle, 
  Send, 
  Layers
} from 'lucide-react';
import { LeafletPinMap } from '../components/LeafletPinMap';
import { PriorityBadge } from '../components/PriorityBadge';
import { TicketSuccessModal } from '../components/TicketSuccessModal';
import { useGeolocation } from '../hooks/useGeolocation';
import { classifyCivicImage, createComplaint } from '../services/api';

/**
 * Citizen Grievance Reporting Page
 * 
 * Apple / Linear-inspired minimalist design system:
 * - Direct clean typography without sci-fi hero badges
 * - Photo drag-and-drop evidence upload and realistic issue presets
 * - Automated issue assessment breakdown with clean pastel indicators
 * - Interactive OpenStreetMap location picker with native browser GPS
 * - Charcoal black primary action button
 */
export const CitizenReportPage = ({ onNavigateDashboard }) => {
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('POTHOLE');
  const [severity, setSeverity] = useState('HIGH');
  const [ward, setWard] = useState('Ward 4 (Central)');
  const [address, setAddress] = useState('Hospital Road, Alpha 1, Greater Noida');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  
  // Image handling
  const [imagePreview, setImagePreview] = useState('https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80');
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiClassification, setAiClassification] = useState({
    category: 'POTHOLE',
    severity: 'CRITICAL',
    confidence: 96,
    detectedFeatures: ['Asphalt depression', 'Sub-base erosion', 'Depth > 15cm'],
    recommendedSlaHours: 18
  });

  // Geolocation
  const { coordinates, setCoordinates, loading: isLocating, getCurrentLocation } = useGeolocation();

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Quick preset photos for instant testing
  const presetPhotos = [
    {
      label: 'Crater Pothole',
      category: 'POTHOLE',
      severity: 'CRITICAL',
      title: 'Large dangerous pothole causing vehicular damage',
      url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
      features: ['Severe road fissure', 'High vehicle impact risk', 'Rainwater accumulation']
    },
    {
      label: 'Garbage Dump',
      category: 'GARBAGE',
      severity: 'HIGH',
      title: 'Sanitation waste overflowing onto pedestrian sidewalk',
      url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
      features: ['Solid waste accumulation', 'Stray animal intrusion', 'Pedestrian blockage']
    },
    {
      label: 'Water Main Burst',
      category: 'WATER_LEAK',
      severity: 'CRITICAL',
      title: 'Main pipeline ruptured spilling potable water',
      url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
      features: ['Pressurized water burst', 'Road foundation scouring hazard', 'Drinking water wastage']
    },
    {
      label: 'Broken Streetlight',
      category: 'STREETLIGHT',
      severity: 'MEDIUM',
      title: 'Streetlights out across transit corridor',
      url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
      features: ['Luminaire power cutoff', 'Zero night visibility', 'Pedestrian safety threat']
    }
  ];

  // Dynamic priority score calculation formula:
  const calculateDynamicScore = () => {
    let base = severity === 'CRITICAL' ? 90 : severity === 'HIGH' ? 75 : severity === 'MEDIUM' ? 50 : 30;
    if (category === 'WATER_LEAK' || category === 'POTHOLE') base += 5;
    return Math.min(99, base);
  };

  const dynamicPriorityScore = calculateDynamicScore();

  // Handle file upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    setIsClassifying(true);
    try {
      const result = await classifyCivicImage(file, title);
      setAiClassification(result);
      setCategory(result.category);
      setSeverity(result.severity);
    } catch (err) {
      console.error('[CitizenReportPage] Classification error:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  // Handle Preset selection
  const handleSelectPreset = (preset) => {
    setImagePreview(preset.url);
    setTitle(preset.title);
    setCategory(preset.category);
    setSeverity(preset.severity);
    setAiClassification({
      category: preset.category,
      severity: preset.severity,
      confidence: 96,
      detectedFeatures: preset.features,
      recommendedSlaHours: preset.severity === 'CRITICAL' ? 12 : 24
    });
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a brief summary of the issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description: description || 'Grievance reported via CivicConnect citizen portal with verified photo and coordinates.',
        category,
        severity,
        priorityScore: dynamicPriorityScore,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        address,
        ward,
        reporterName: reporterName || 'Concerned Citizen',
        reporterPhone: reporterPhone || '+91 98000 11223',
        imageUrl: imagePreview,
        aiConfidence: aiClassification?.confidence || 95
      };

      const newTicket = await createComplaint(payload);
      setCreatedTicket(newTicket);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('[CitizenReportPage] Error submitting complaint:', err);
      alert('Failed to register complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      
      {/* Clean Page Title Header (Without Hero Badge) */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
          Report an Issue
        </h1>
        <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
          Upload photo evidence of damaged roads, waste overflow, water leaks, or lighting failures to notify municipal response teams.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Photo Upload & Issue Assessment (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Defect Photo Card */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-zinc-600" />
                <span>Photo Evidence</span>
              </h3>
              <span className="text-xs text-zinc-400">JPG, PNG, WebP</span>
            </div>

            {/* Image Preview & Upload Container */}
            <div className="relative group rounded-xl overflow-hidden border border-dashed border-zinc-300 bg-zinc-50/60 hover:border-zinc-400 transition-all">
              {imagePreview ? (
                <div className="relative h-56 w-full">
                  <img
                    src={imagePreview}
                    alt="Defect Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  
                  {/* Change photo button */}
                  <label className="absolute bottom-3 right-3 cursor-pointer px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-zinc-900 text-xs font-medium backdrop-blur-md border border-zinc-200 shadow-md transition-all flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Upload Custom</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-56 p-6 cursor-pointer text-center">
                  <UploadCloud className="w-10 h-10 text-zinc-400 mb-2 group-hover:text-zinc-600 transition-colors" />
                  <span className="text-xs font-medium text-zinc-700">Click to upload issue photo</span>
                  <span className="text-[11px] text-zinc-400 mt-1">or drag and drop here</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Quick Preset Selector Buttons */}
            <div>
              <span className="text-[11px] font-medium text-zinc-500 block mb-2">
                Or select a sample issue scenario:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {presetPhotos.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="px-3 py-2 rounded-xl text-left text-xs bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 text-zinc-800 transition-all"
                  >
                    <span className="font-medium block truncate text-zinc-900">{preset.label}</span>
                    <span className="text-[10px] text-zinc-500 block">{preset.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Automated Issue Assessment Card */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  Automated Issue Assessment
                </h4>
                <p className="text-[11px] text-zinc-500">Confidence: {aiClassification.confidence}%</p>
              </div>
              <PriorityBadge severity={severity} score={dynamicPriorityScore} />
            </div>

            {/* Detected attributes */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Detected Category:</span>
                <span className="font-medium text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-md">
                  {category}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Calculated Urgency:</span>
                <span className="font-medium text-zinc-900">
                  {severity}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Target SLA Response:</span>
                <span className="font-medium text-zinc-900">
                  Within {aiClassification.recommendedSlaHours} Hours
                </span>
              </div>
            </div>

            {/* Detected Details Tags */}
            <div>
              <span className="text-[11px] text-zinc-500 block mb-2">Detected Details:</span>
              <div className="flex flex-wrap gap-1.5">
                {aiClassification.detectedFeatures?.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 text-zinc-700 border border-zinc-200/60"
                  >
                    <CheckCircle className="w-3 h-3 text-zinc-500" />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Map Pinpoint & Grievance Details Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Location Section */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-600" />
                <span>Location</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Click on the map to set the exact coordinates or use your device GPS.
              </p>
            </div>

            <LeafletPinMap
              coordinates={coordinates}
              onLocationSelect={setCoordinates}
              onUseCurrentLocation={getCurrentLocation}
              isLocating={isLocating}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Street / Landmark Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Metro Gate 2, Ring Road"
                  className="w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Municipal Ward Jurisdiction
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                >
                  <option value="Ward 4 (Central)">Ward 4 (Central)</option>
                  <option value="Ward 7 (North)">Ward 7 (North)</option>
                  <option value="Ward 12 (South)">Ward 12 (South)</option>
                  <option value="Ward 9 (West)">Ward 9 (West)</option>
                  <option value="Ward 3 (East)">Ward 3 (East)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grievance Details Form */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2 pb-2 border-b border-zinc-100">
              <Layers className="w-4 h-4 text-zinc-600" />
              <span>Report Details</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Issue Summary / Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hazardous deep pothole on MG Road causing traffic bottlenecks"
                className="w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                >
                  <option value="POTHOLE">Pothole / Road Defect</option>
                  <option value="GARBAGE">Garbage &amp; Sanitation Overflow</option>
                  <option value="WATER_LEAK">Water Leakage / Pipe Burst</option>
                  <option value="STREETLIGHT">Streetlight / Lighting Failure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Severity Override (Recommended)
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                >
                  <option value="CRITICAL">Critical (Immediate Danger / 12h SLA)</option>
                  <option value="HIGH">High (Disruptive / 24h SLA)</option>
                  <option value="MEDIUM">Medium (Moderate Hazard / 48h SLA)</option>
                  <option value="LOW">Low (Cosmetic / 72h SLA)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Additional Notes / Context
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention specific nearby landmarks, hazard intensity, or time defect was noticed..."
                className="w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Citizen Name (Optional)
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex items-center justify-between border-t border-zinc-100">
              <div className="text-xs text-zinc-500">
                Priority Score:{' '}
                <strong className="text-zinc-900 font-mono text-sm font-semibold">
                  {dynamicPriorityScore}/100
                </strong>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Ticket Success Confirmation Modal */}
      <TicketSuccessModal
        ticket={createdTicket}
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onNavigateDashboard={() => {
          setShowSuccessModal(false);
          onNavigateDashboard();
        }}
      />
    </div>
  );
};
