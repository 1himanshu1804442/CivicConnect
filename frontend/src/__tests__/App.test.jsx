import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { PriorityBadge } from '../components/PriorityBadge';
import { SlaCountdown } from '../components/SlaCountdown';
import { LeafletPinMap } from '../components/LeafletPinMap';
import { CitizenReportPage } from '../pages/CitizenReportPage';
import { fetchComplaints, createComplaint } from '../services/api';
import { extractExifGps } from '../services/exifService';
import { isValidCoordinate, getSafeCoordinates, DEFAULT_MUNICIPAL_COORDS } from '../services/mapUtils';

// Mock Leaflet react-leaflet to prevent JSDOM WebGL/Canvas rendering exceptions
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, center }) => (
    <div data-testid="mock-map-container" data-center={JSON.stringify(center)}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: ({ children, position }) => (
    <div data-testid="mock-marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="mock-popup">{children}</div>,
  useMap: () => ({ flyTo: vi.fn(), getZoom: () => 14 }),
  useMapEvents: () => null
}));

describe('CivicConnect Frontend Component & E2E Pipeline', () => {

  it('renders application brand, header and navigation tabs', () => {
    render(<App />);
    expect(screen.getByText('CivicConnect')).toBeInTheDocument();
    expect(screen.getByText(/Municipal Operations & Grievance AI/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Report Grievance/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Municipal Dashboard/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Hotspot Heatmap/i })[0]).toBeInTheDocument();
  });

  it('allows switching to Municipal Dashboard and renders KPI cards', async () => {
    render(<App />);
    const dashboardTabs = screen.getAllByRole('button', { name: /Municipal Dashboard/i });
    fireEvent.click(dashboardTabs[0]);

    await waitFor(() => {
      expect(screen.getByText(/Municipal Grievance Operations & SLA Oversight/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Total Logged/i)).toBeInTheDocument();
    expect(screen.getByText(/Remediated/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Escalated/i)[0]).toBeInTheDocument();
  });

  it('allows switching to Hotspot Heatmap view', async () => {
    render(<App />);
    const heatmapTabs = screen.getAllByRole('button', { name: /Hotspot Heatmap/i });
    fireEvent.click(heatmapTabs[0]);

    await waitFor(() => {
      expect(screen.getByText(/Municipal Defect Hotspot Density/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Ward Hotspot Inspector/i)).toBeInTheDocument();
  });

  it('renders PriorityBadge correctly with score for CRITICAL and HIGH severities', () => {
    const { container: critContainer } = render(<PriorityBadge severity="CRITICAL" score={92} />);
    expect(critContainer.textContent).toContain('Critical');
    expect(critContainer.textContent).toContain('92');

    const { container: highContainer } = render(<PriorityBadge severity="HIGH" score={78} />);
    expect(highContainer.textContent).toContain('High');
    expect(highContainer.textContent).toContain('78');
  });

  it('renders SlaCountdown with remaining time or resolved indicator', () => {
    // Future deadline
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();
    render(<SlaCountdown deadline={futureDate} status="PENDING" />);
    expect(screen.getByText(/remaining/i)).toBeInTheDocument();

    // Resolved status
    render(<SlaCountdown deadline={futureDate} status="RESOLVED" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  // Edge Case Audit 1: SLA Timer rendering for past due tickets & missing deadlines
  it('renders SlaCountdown with OVERDUE for past due tickets and handles null deadlines safely', () => {
    // Past due ticket (deadline 4 hours in the past)
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString();
    const { rerender } = render(<SlaCountdown deadline={pastDate} status="PENDING" />);
    expect(screen.getByText(/OVERDUE/i)).toBeInTheDocument();

    // Missing / null deadline does NOT calculate from 1970
    rerender(<SlaCountdown deadline={null} status="PENDING" />);
    expect(screen.getByText(/SLA pending/i)).toBeInTheDocument();
    expect(screen.queryByText(/4900/)).not.toBeInTheDocument();
  });

  // Edge Case Audit 2: Geographic coordinate validation & (0,0) / null safety
  it('validates geographic coordinates and rejects null, NaN, and (0,0) Null Island', () => {
    expect(isValidCoordinate(28.4744, 77.5040)).toBe(true);
    expect(isValidCoordinate(0, 0)).toBe(false);
    expect(isValidCoordinate(null, null)).toBe(false);
    expect(isValidCoordinate(undefined, undefined)).toBe(false);
    expect(isValidCoordinate(NaN, NaN)).toBe(false);
    expect(isValidCoordinate(100, 200)).toBe(false); // Out of Earth bounds

    const safeCoords = getSafeCoordinates({ lat: 0, lng: 0 });
    expect(safeCoords).toEqual([DEFAULT_MUNICIPAL_COORDS.lat, DEFAULT_MUNICIPAL_COORDS.lng]);
  });

  // Edge Case Audit 3: LeafletPinMap renders safely with null or (0,0) coordinates
  it('renders LeafletPinMap centered on municipal coordinates when passed null or (0,0)', () => {
    render(
      <LeafletPinMap
        coordinates={{ lat: 0, lng: 0 }}
        onLocationSelect={vi.fn()}
        onUseCurrentLocation={vi.fn()}
      />
    );
    expect(screen.getByTestId('mock-map-container')).toBeInTheDocument();
    expect(screen.getByText(/Default/i)).toBeInTheDocument();
  });

  // Edge Case Audit 4: EXIF GPS extraction fallback for images without metadata
  it('gracefully handles image uploads without EXIF GPS metadata', async () => {
    // Non-JPEG image blob
    const pngBlob = new Blob(['fake png bytes'], { type: 'image/png' });
    const resultPng = await extractExifGps(pngBlob);
    expect(resultPng.hasGps).toBe(false);
    expect(resultPng.lat).toBeNull();
    expect(resultPng.lng).toBeNull();

    // Plain JPEG without APP1 EXIF segment
    const emptyJpegBlob = new Blob([new Uint8Array([0xFF, 0xD8, 0xFF, 0xD9])], { type: 'image/jpeg' });
    const resultJpeg = await extractExifGps(emptyJpegBlob);
    expect(resultJpeg.hasGps).toBe(false);
    expect(resultJpeg.lat).toBeNull();
    expect(resultJpeg.lng).toBeNull();
  });

  // Edge Case Audit 5: Filter selections ('ALL', 'PENDING', custom categories)
  it('verifies fetchComplaints handles ALL, PENDING, and custom categories without throwing', async () => {
    // ALL filter
    const allComplaints = await fetchComplaints({ status: 'ALL', category: 'ALL' });
    expect(Array.isArray(allComplaints)).toBe(true);

    // PENDING filter
    const pendingComplaints = await fetchComplaints({ status: 'PENDING' });
    expect(Array.isArray(pendingComplaints)).toBe(true);

    // Custom category filter (e.g. DRAINAGE or CUSTOM_HAZARD)
    const customFiltered = await fetchComplaints({ category: 'CUSTOM_HAZARD' });
    expect(Array.isArray(customFiltered)).toBe(true);
    expect(customFiltered.length).toBe(0); // Safely returns empty list without error
  });

  // Edge Case Audit 6: Form validation in CitizenReportPage (missing title, description, image)
  it('alerts the citizen with validation banner when submitting with missing fields', async () => {
    render(<CitizenReportPage onNavigateDashboard={vi.fn()} />);
    
    // Clear the title input
    const titleInput = screen.getByPlaceholderText(/Hazardous deep pothole/i);
    fireEvent.change(titleInput, { target: { value: '' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please complete the required information before submitting/i)).toBeInTheDocument();
    });
  });

  it('verifies API service fetchComplaints returns grievance registry', async () => {
    const data = await fetchComplaints();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('severity');
    expect(data[0]).toHaveProperty('priorityScore');
  });

  it('verifies API service createComplaint generates ticket with SLA', async () => {
    const newGrievance = {
      title: 'Damaged manhole cover on main junction',
      category: 'POTHOLE',
      severity: 'CRITICAL',
      priorityScore: 94,
      latitude: 28.6139,
      longitude: 77.2090,
      ward: 'Ward 4 (Central)'
    };

    const created = await createComplaint(newGrievance);
    expect(created.id).toMatch(/^TKT-\d{4}-/);
    expect(created.title).toBe(newGrievance.title);
    expect(created.status).toBe('PENDING');
    expect(created.slaDeadline).toBeDefined();
  });
});
