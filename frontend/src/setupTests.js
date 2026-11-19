import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.scrollTo to prevent JSDOM "Not implemented" warnings
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
}
