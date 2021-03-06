const makeServiceWorkerEnv = require('../index');

// https://github.com/GoogleChrome/samples/blob/gh-pages/service-worker/basic/service-worker.js
describe('basic', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv());
    jest.resetModules();
  });

  it('should attach the listeners', () => {
    require('./fixtures/basic');
    expect(self.listeners.size).toEqual(3);
    expect(self.listeners.has('install')).toBe(true);
    expect(self.listeners.has('fetch')).toBe(true);
    expect(self.listeners.has('activate')).toBe(true);
  });

  it('should precache the PRECACHE_URLS on install', async () => {
    global.fetch = () => Promise.resolve('FAKE_RESPONSE');
    require('./fixtures/basic');

    await self.trigger('install');
    const caches = self.snapshot().caches;
    Object.keys(caches['precache-v1']).forEach(key => {
      expect(caches['precache-v1'][key]).toEqual('FAKE_RESPONSE');
    });
  });

  it('should delete old caches on activate', async () => {
    self.caches.open('TEST');
    expect(self.snapshot().caches.TEST).toBeDefined();
    require('./fixtures/basic');

    await self.trigger('activate');
    expect(self.snapshot().caches.TEST).toBeUndefined();
  });

  it('should return a cached response', async () => {
    require('./fixtures/basic');

    const cachedResponse = { clone: () => {} };
    const cachedRequest = new Request('/test');
    const cache = await self.caches.open('TEST');
    cache.put(cachedRequest, cachedResponse);

    const response = await self.trigger('fetch', cachedRequest);
    expect(response[0]).toEqual(cachedResponse);
  });

  it('should fetch and cache an uncached request', async () => {
    const mockResponse = { clone: () => mockResponse };
    global.fetch = () => Promise.resolve(mockResponse);
    require('./fixtures/basic');

    const request = new Request('/test');
    const response = await self.trigger('fetch', request);
    expect(response[0]).toEqual(mockResponse);
    const runtimeCache = self.snapshot().caches.runtime;
    expect(runtimeCache[request.url]).toEqual(mockResponse);
  });

  it('should fetch and cache an uncached request (generated request from string)', async () => {
    const mockResponse = { clone: () => mockResponse };
    global.fetch = () => Promise.resolve(mockResponse);
    require('./fixtures/basic');

    const response = await self.trigger('fetch', '/test');
    expect(response[0]).toEqual(mockResponse);
    const runtimeCache = self.snapshot().caches.runtime;
    expect(runtimeCache['https://www.test.com/test']).toEqual(mockResponse);
  });

  it('has performance.now()', () => {
    const now = performance.now();
    expect(now).toBeGreaterThan(0);
  });

  it('has an importScripts mock', () => {
    expect(global).toHaveProperty('importScripts');
    expect(global.importScripts).toBeInstanceOf(Function);
  });

  it('has a SyncEvent mock', () => {
    expect(global).toHaveProperty('SyncEvent');
  });

  it('has an URLSearchParams mock', () => {
    expect(global).toHaveProperty('URLSearchParams');
  });

  it('has an BroadcastChannel mock', () => {
    expect(global).toHaveProperty('BroadcastChannel');
  });

  it('has an FileReader mock', () => {
    expect(global).toHaveProperty('FileReader');
  });

  it('has an ExtendableMessageEvent mock', () => {
    expect(global).toHaveProperty('ExtendableMessageEvent');
  });
});
