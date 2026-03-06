// Jest setup for React Testing Library
import '@testing-library/jest-dom';

global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock matchMedia for ThemeProvider (used in ThemeContext)
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Provide a default fetch mock so components relying on CMS endpoints
// can fall back gracefully during tests without throwing.
const fetchStub = jest.fn(async () => ({
  ok: false,
  status: 404,
  json: async () => ({}),
}));
global.fetch = fetchStub;
if (typeof window !== 'undefined') {
  window.fetch = fetchStub;
}

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const isSuppressedReactTestWarning = (message) => {
  const text = String(message || '');
  return (
    text.includes('ReactDOMTestUtils.act') ||
    text.includes('React Router Future Flag Warning')
  );
};

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (isSuppressedReactTestWarning(args[0])) {
      return;
    }
    originalConsoleError(...args);
  });

  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    if (isSuppressedReactTestWarning(args[0])) {
      return;
    }
    originalConsoleWarn(...args);
  });
});

afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});
