import { describe, it, expect } from 'vitest';
import {
  shouldCaptureRequest,
  shouldCaptureBody,
  shouldSkipStatus,
} from '../../src/background/network-filter';

describe('shouldCaptureRequest', () => {
  it('captures XHR requests', () => {
    expect(shouldCaptureRequest('XHR')).toBe(true);
  });

  it('captures Fetch requests', () => {
    expect(shouldCaptureRequest('Fetch')).toBe(true);
  });

  it('captures Document requests', () => {
    expect(shouldCaptureRequest('Document')).toBe(true);
  });

  it('rejects Image requests', () => {
    expect(shouldCaptureRequest('Image')).toBe(false);
  });

  it('rejects Stylesheet requests', () => {
    expect(shouldCaptureRequest('Stylesheet')).toBe(false);
  });

  it('rejects Script requests', () => {
    expect(shouldCaptureRequest('Script')).toBe(false);
  });

  it('rejects Font requests', () => {
    expect(shouldCaptureRequest('Font')).toBe(false);
  });
});

describe('shouldCaptureBody', () => {
  it('captures JSON responses', () => {
    expect(shouldCaptureBody('application/json')).toBe(true);
  });

  it('captures HTML responses', () => {
    expect(shouldCaptureBody('text/html')).toBe(true);
  });

  it('captures text responses', () => {
    expect(shouldCaptureBody('text/plain')).toBe(true);
  });

  it('rejects image responses', () => {
    expect(shouldCaptureBody('image/png')).toBe(false);
    expect(shouldCaptureBody('image/jpeg')).toBe(false);
  });

  it('rejects font responses', () => {
    expect(shouldCaptureBody('font/woff2')).toBe(false);
  });

  it('rejects video responses', () => {
    expect(shouldCaptureBody('video/mp4')).toBe(false);
  });

  it('rejects binary responses', () => {
    expect(shouldCaptureBody('application/octet-stream')).toBe(false);
    expect(shouldCaptureBody('application/pdf')).toBe(false);
    expect(shouldCaptureBody('application/zip')).toBe(false);
  });

  it('captures when mimeType is undefined', () => {
    expect(shouldCaptureBody(undefined)).toBe(true);
  });
});

describe('shouldSkipStatus', () => {
  it('skips redirects', () => {
    expect(shouldSkipStatus(301)).toBe(true);
    expect(shouldSkipStatus(302)).toBe(true);
    expect(shouldSkipStatus(307)).toBe(true);
  });

  it('skips 204 No Content', () => {
    expect(shouldSkipStatus(204)).toBe(true);
  });

  it('does not skip 200', () => {
    expect(shouldSkipStatus(200)).toBe(false);
  });

  it('does not skip 404', () => {
    expect(shouldSkipStatus(404)).toBe(false);
  });

  it('does not skip 500', () => {
    expect(shouldSkipStatus(500)).toBe(false);
  });
});
