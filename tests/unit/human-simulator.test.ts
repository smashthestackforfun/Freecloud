import { describe, it, expect } from 'vitest';
import { HUMAN_TYPE_MIN_MS, HUMAN_TYPE_MAX_MS, HUMAN_DELAY_MIN_MS, HUMAN_DELAY_MAX_MS } from '../../src/shared/constants';
import { randomBetween } from '../../src/shared/utils';

describe('human simulation timing', () => {
  it('typing delays fall within configured range', () => {
    for (let i = 0; i < 100; i++) {
      const delay = randomBetween(HUMAN_TYPE_MIN_MS, HUMAN_TYPE_MAX_MS);
      expect(delay).toBeGreaterThanOrEqual(HUMAN_TYPE_MIN_MS);
      expect(delay).toBeLessThanOrEqual(HUMAN_TYPE_MAX_MS);
    }
  });

  it('inter-step delays fall within configured range', () => {
    for (let i = 0; i < 100; i++) {
      const delay = randomBetween(HUMAN_DELAY_MIN_MS, HUMAN_DELAY_MAX_MS);
      expect(delay).toBeGreaterThanOrEqual(HUMAN_DELAY_MIN_MS);
      expect(delay).toBeLessThanOrEqual(HUMAN_DELAY_MAX_MS);
    }
  });

  it('randomBetween produces values across the range', () => {
    const values = Array.from({ length: 1000 }, () => randomBetween(0, 100));
    const min = Math.min(...values);
    const max = Math.max(...values);
    expect(min).toBeLessThan(20);
    expect(max).toBeGreaterThan(80);
  });
});
