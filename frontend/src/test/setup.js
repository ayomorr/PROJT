// Vitest setup: jsdom polyfills that the components rely on.
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());

// jsdom lacks matchMedia; ProgressRing, Reveal and charts.jsx call it.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Reveal uses IntersectionObserver; jsdom doesn't ship one.
if (!window.IntersectionObserver) {
  class IntersectionObserverMock {
    constructor(callback) {
      this.callback = callback;
      this.elements = new Set();
    }
    observe(el) {
      this.elements.add(el);
      this.callback([{ isIntersecting: true, target: el }], this);
    }
    unobserve(el) {
      this.elements.delete(el);
    }
    disconnect() {
      this.elements.clear();
    }
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: IntersectionObserverMock,
  });
}

// requestAnimationFrame exists in newer jsdom, but polyfill defensively.
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
}

// localStorage exists in jsdom when a URL is set; ensure it's present.
if (!window.localStorage) {
  const store = new Map();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    },
  });
}