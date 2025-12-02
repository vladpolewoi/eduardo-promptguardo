import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isEmailDismissed, getDismissedUntil } from './dismissal';
import { DISMISS_DURATION_MS } from '../config/constants';

describe('dismissal utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isEmailDismissed', () => {
    it('should return false if dismissedAt is undefined', () => {
      expect(isEmailDismissed(undefined)).toBe(false);
    });

    it('should return true if dismissed just now', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      expect(isEmailDismissed(now)).toBe(true);
    });

    it('should return true if dismissed 1 hour ago (within 24h window)', () => {
      const dismissedAt = Date.now();
      vi.setSystemTime(dismissedAt);

      // Advance 1 hour
      vi.advanceTimersByTime(1000 * 60 * 60);

      expect(isEmailDismissed(dismissedAt)).toBe(true);
    });

    it('should return false if dismissed 25 hours ago (expired)', () => {
      const dismissedAt = Date.now();
      vi.setSystemTime(dismissedAt);

      // Advance 25 hours (past the 24-hour threshold)
      vi.advanceTimersByTime(1000 * 60 * 60 * 25);

      expect(isEmailDismissed(dismissedAt)).toBe(false);
    });

    it('should return false exactly at 24 hours', () => {
      const dismissedAt = Date.now();
      vi.setSystemTime(dismissedAt);

      // Advance exactly 24 hours
      vi.advanceTimersByTime(DISMISS_DURATION_MS);

      // At exactly 24 hours, it should be expired (not less than 24h)
      expect(isEmailDismissed(dismissedAt)).toBe(false);
    });
  });

  describe('getDismissedUntil', () => {
    it('should return null if dismissedAt is undefined', () => {
      expect(getDismissedUntil(undefined)).toBe(null);
    });

    it('should return expiry date if still within window', () => {
      const dismissedAt = Date.now();
      vi.setSystemTime(dismissedAt);

      const result = getDismissedUntil(dismissedAt);

      expect(result).not.toBe(null);
      expect(result?.getTime()).toBe(dismissedAt + DISMISS_DURATION_MS);
    });

    it('should return null if dismissal has expired', () => {
      const dismissedAt = Date.now();
      vi.setSystemTime(dismissedAt);

      // Advance past expiry
      vi.advanceTimersByTime(DISMISS_DURATION_MS + 1000);

      expect(getDismissedUntil(dismissedAt)).toBe(null);
    });
  });
});
