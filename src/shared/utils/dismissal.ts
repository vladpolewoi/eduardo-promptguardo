/**
 * Dismissal utilities
 * Pure functions for email dismissal logic
 */

import { MS_PER_HOUR, DISMISS_DURATION_MS } from '../config/constants';

/**
 * Check if an email is currently dismissed (within 24h window)
 */
export function isEmailDismissed(dismissedAt: number | undefined): boolean {
  if (!dismissedAt) return false;

  const now = Date.now();
  const timeSinceDismissed = now - dismissedAt;

  return timeSinceDismissed < DISMISS_DURATION_MS;
}

/**
 * Get the date when a dismissed email will expire
 * Returns null if not dismissed or already expired
 */
export function getDismissedUntil(dismissedAt: number | undefined): Date | null {
  if (!dismissedAt) return null;

  const expiresAt = dismissedAt + DISMISS_DURATION_MS;
  const now = Date.now();

  // Only return if still within dismiss window
  if (expiresAt > now) {
    return new Date(expiresAt);
  }

  return null;
}

/**
 * Get hours since email was dismissed
 */
export function getHoursSinceDismissed(dismissedAt: number): number {
  const now = Date.now();
  return (now - dismissedAt) / MS_PER_HOUR;
}

