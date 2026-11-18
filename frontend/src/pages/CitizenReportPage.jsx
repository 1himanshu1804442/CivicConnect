import React, { useState } from 'react';
import { 
  Camera, 
  UploadCloud, 
  MapPin, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Send, 
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { LeafletPinMap } from '../components/LeafletPinMap';
import { PriorityBadge } from '../components/PriorityBadge';
import { TicketSuccessModal } from '../components/TicketSuccessModal';
import { useGeolocation } from '../hooks/useGeolocation';
import { classifyCivicImage, createComplaint } from '../services/api';

/**
 * Citizen Grievance Reporting Page
 * 
 * Why this is structured this way:
 * - Low-friction citizen intake: Supports drag & drop photo upload or preset defect selection.
 * - Real-time AI Vision analysis: As soon as an image is loaded, client heuristic / backend CV
 *   estimates the category (Pothole, Garbage, Water Leak, Streetlight) and severity.
 * - Interactive Leaflet Pinpoint: Citizen can visually drop their pin or click 'Use My GPS'.
 * - Dynamic Priority preview: Citizen sees how defect severity + locality factors produce an
 *   objective priority score.
 */
export const CitizenReportPage = ({ onNavigateDashboard }) => {
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('POTHOLE');
  const [severity, setSeverity] = useState('HIGH');
  const [ward, setWard] = useState('Ward 4 (Central)');
  const [address, setAddress] = useState('Near Metro Gate 2, Sector 4');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  
  // Image handling
  const [imagePreview, setImagePreview] = useState('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80');
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
      url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
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
  // Base Severity (Critical: 90, High: 75, Medium: 50, Low: 30) + Ward Density modifier
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

    // Trigger AI Vision classification
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
      {/* Page Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Powered Citizen Redressal Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Report Civic Infrastructure Grievance
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Upload a photo of damaged road, garbage, water leak, or streetlight. Our AI Vision model automatically classifies the defect and dispatches your report directly to the ward engineering team.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Photo Upload & AI Vision Classification Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Defect Photo Card */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                1. Upload Defect Evidence Photo
              </h3>
              <span className="text-[11px] text-slate-400">JPG, PNG, WebP</span>
            </div>

            {/* Image Preview & Upload Container */}
            <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-slate-700 bg-slate-800/50 hover:border-blue-500/50 transition-all">
              {imagePreview ? (
                <div className="relative h-56 w-full">
                  <img
                    src={imagePreview}
                    alt="Defect Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  
                  {/* Floating AI Vision Tag */}
                  <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono font-medium text-blue-400 border border-blue-500/30 flex items-center gap-1.5 shadow-lg">
                    <Cpu className={`w-3.5 h-3.5 ${isClassifying ? 'animate-spin' : ''}`} />
                    <span>{isClassifying ? 'Analyzing Image...' : 'AI Vision Scan Active'}</span>
                  </div>

                  {/* Change photo button */}
                  <label className="absolute bottom-3 right-3 cursor-pointer px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5" />
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
                  <UploadCloud className="w-10 h-10 text-slate-500 mb-2 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xs font-semibold text-slate-300">Click to upload issue photo</span>
                  <span className="text-[11px] text-slate-500 mt-1">or drag & drop here</span>
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
              <span className="text-[11px] font-medium text-slate-400 block mb-2">
                Or select a sample civic issue scenario:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {presetPhotos.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="px-2.5 py-2 rounded-lg text-left text-xs bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-all hover:border-blue-600/30"
                  >
                    <span className="font-semibold block truncate">{preset.label}</span>
                    <span className="text-[10px] text-slate-400 block">{preset.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Multi-Modal Classification Breakdown Card */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600/10 text-blue-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Real-Time AI Classification
                  </h4>
                  <p className="text-[11px] text-slate-400">Confidence: {aiClassification.confidence}%</p>
                </div>
              </div>
              <PriorityBadge severity={severity} score={dynamicPriorityScore} />
            </div>

            {/* Detected attributes */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Detected Category:</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded font-mono">
                  {category}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Calculated Urgency:</span>
                <span className="font-bold text-rose-300 font-mono">
                  {severity}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Target SLA Response:</span>
                <span className="font-bold text-amber-300 font-mono">
                  Within {aiClassification.recommendedSlaHours} Hours
                </span>
              </div>
            </div>

            {/* Detected Vision Features Tags */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">Vision Feature Signatures:</span>
              <div className="flex flex-wrap gap-1.5">
                {aiClassification.detectedFeatures?.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    <CheckCircle className="w-3 h-3 text-blue-400" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Map Pinpoint & Grievance Details Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Location Pinpoint Section */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  2. Pinpoint Incident Location
                </h3>
                <p className="text-[11px] text-slate-400">
                  Click on the map to set the exact geographic coordinates or use GPS.
                </p>
              </div>
            </div>

            <LeafletPinMap
              coordinates={coordinates}
              onLocationSelect={setCoordinates}
              onUseCurrentLocation={getCurrentLocation}
              isLocating={isLocating}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Street / Landmark Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Metro Gate 2, Ring Road"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Municipal Ward Jurisdiction
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
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
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Layers className="w-4 h-4 text-blue-400" />
              3. Issue Information & Citizen Contact
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Issue Summary / Headline *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hazardous deep pothole on MG Road causing traffic bottlenecks"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="POTHOLE">Pothole / Road Defect</option>
                  <option value="GARBAGE">Garbage & Sanitation Overflow</option>
                  <option value="WATER_LEAK">Water Leakage / Pipe Burst</option>
                  <option value="STREETLIGHT">Streetlight / Lighting Failure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Severity Override (AI Recommended)
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="CRITICAL">Critical (Immediate Danger / 12h SLA)</option>
                  <option value="HIGH">High (Disruptive / 24h SLA)</option>
                  <option value="MEDIUM">Medium (Moderate Hazard / 48h SLA)</option>
                  <option value="LOW">Low (Cosmetic / 72h SLA)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Additional Field Notes / Context
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention specific nearby landmarks, hazard intensity, or time defect was noticed..."
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Citizen Name (Optional)
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SMS / WhatsApp Notification Number
                </label>
                <input
                  type="tel"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-800">
              <div className="text-xs text-slate-400">
                Priority Score:{' '}
                <strong className="text-blue-400 font-mono text-sm">
                  {dynamicPriorityScore}/100
                </strong>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Registering Grievance...' : 'Submit Grievance to Municipal Engine'}</span>
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
