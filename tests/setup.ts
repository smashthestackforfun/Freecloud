import { vi } from 'vitest';

const storageMock: Record<string, unknown> = {};

const chromeMock = {
  runtime: {
    sendMessage: vi.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    connect: vi.fn().mockReturnValue({
      onDisconnect: { addListener: vi.fn() },
      postMessage: vi.fn(),
    }),
  },
  tabs: {
    sendMessage: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue({ id: 1, url: 'https://example.com' }),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  debugger: {
    attach: vi.fn().mockResolvedValue(undefined),
    detach: vi.fn().mockResolvedValue(undefined),
    sendCommand: vi.fn().mockResolvedValue({}),
    onEvent: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onDetach: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn().mockImplementation((key: string) =>
        Promise.resolve({ [key]: storageMock[key] }),
      ),
      set: vi.fn().mockImplementation((items: Record<string, unknown>) => {
        Object.assign(storageMock, items);
        return Promise.resolve();
      }),
    },
    session: {
      get: vi.fn().mockImplementation((key: string) =>
        Promise.resolve({ [key]: storageMock[`session_${key}`] }),
      ),
      set: vi.fn().mockImplementation((items: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(items)) {
          storageMock[`session_${k}`] = v;
        }
        return Promise.resolve();
      }),
      remove: vi.fn().mockResolvedValue(undefined),
    },
  },
  downloads: {
    download: vi.fn().mockResolvedValue(1),
  },
  windows: {
    create: vi.fn().mockResolvedValue({ id: 1, tabs: [{ id: 100 }] }),
    update: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue(undefined),
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
  webNavigation: {
    onCommitted: {
      addListener: vi.fn(),
    },
  },
  scripting: {
    executeScript: vi.fn().mockResolvedValue(undefined),
  },
  cookies: {
    getAll: vi.fn().mockResolvedValue([]),
  },
};

Object.defineProperty(globalThis, 'chrome', {
  value: chromeMock,
  writable: true,
});

Object.defineProperty(globalThis, 'CSS', {
  value: {
    escape: (s: string) => s.replace(/([^\w-])/g, '\\$1'),
  },
  writable: true,
});
