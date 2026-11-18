import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { PriorityBadge } from '../components/PriorityBadge';
import { SlaCountdown } from '../components/SlaCountdown';
import { fetchComplaints, createComplaint } from '../services/api';

// Mock Leaflet react-leaflet to prevent JSDOM WebGL/Canvas rendering exceptions
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="mock-map-container">{children}</div>,
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: ({ children }) => <div data-testid="mock-marker">{children}</div>,
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
