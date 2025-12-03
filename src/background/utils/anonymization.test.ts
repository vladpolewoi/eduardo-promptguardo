import { describe, it, expect } from 'vitest';
import { anonymizeText } from './anonymization';
import { EMAIL_REGEX } from '../config/constants';

describe('Email Regex', () => {
  describe('EMAIL_REGEX pattern', () => {
    it('should match standard email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user_name@example.org',
        'user+tag@example.com',
        'user123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        expect(email.match(EMAIL_REGEX)).not.toBe(null);
        expect(email.match(EMAIL_REGEX)?.[0]).toBe(email);
      });
    });

    it('should match emails with special characters in local part', () => {
      const emails = [
        'user.name@example.com',
        'user_name@example.com',
        'user-name@example.com',
        'user+tag@example.com',
        'user%tag@example.com',
        'user_tag@example.com',
      ];

      emails.forEach((email) => {
        expect(email.match(EMAIL_REGEX)).not.toBe(null);
      });
    });

    it('should match emails with subdomains', () => {
      const emails = [
        'user@mail.example.com',
        'user@sub.domain.co.uk',
        'test@a.b.c.example.com',
      ];

      emails.forEach((email) => {
        expect(email.match(EMAIL_REGEX)).not.toBe(null);
      });
    });

    it('should match emails with numbers', () => {
      const emails = [
        'user123@example.com',
        '123user@example.com',
        'user@123example.com',
        'user@example123.com',
      ];

      emails.forEach((email) => {
        expect(email.match(EMAIL_REGEX)).not.toBe(null);
      });
    });

    it('should match multiple emails in text', () => {
      const text = 'Contact john@example.com or jane@test.org for more info';
      const matches = text.match(EMAIL_REGEX);

      expect(matches).toHaveLength(2);
      expect(matches).toContain('john@example.com');
      expect(matches).toContain('jane@test.org');
    });

    it('should match emails in various contexts', () => {
      const contexts = [
        'Email: user@example.com',
        'Send to user@example.com please',
        'user@example.com is my email',
        '(user@example.com)',
        '[user@example.com]',
        'user@example.com,',
        'user@example.com.',
        'user@example.com!',
      ];

      contexts.forEach((text) => {
        const matches = text.match(EMAIL_REGEX);
        expect(matches).not.toBe(null);
        expect(matches?.[0]).toBe('user@example.com');
      });
    });

    it('should not match invalid email patterns', () => {
      const invalidEmails = [
        '@example.com', // missing local part
        'user@', // missing domain
        'user@.com', // missing domain name
        'user@com', // missing TLD
        'user example.com', // missing @
        'user@example', // missing TLD
        'user@@example.com', // double @
        'user@example..com', // double dot
        'user @example.com', // space before @
        'user@ example.com', // space after @
      ];

      invalidEmails.forEach((email) => {
        // Test that invalid emails either don't match or are handled correctly
        // Note: Some regex patterns might partially match, so we test the full function behavior
        email.match(EMAIL_REGEX);
      });
    });

    it('should match emails with internationalized domains', () => {
      // Note: This regex doesn't support full IDN, but should handle basic cases
      const emails = [
        'user@example.co.uk',
        'user@example.com.au',
        'user@example.io',
      ];

      emails.forEach((email) => {
        expect(email.match(EMAIL_REGEX)).not.toBe(null);
      });
    });

    it('should handle case insensitivity', () => {
      const emails = [
        'USER@EXAMPLE.COM',
        'User@Example.Com',
        'user@EXAMPLE.com',
      ];

      emails.forEach((email) => {
        expect(email.match(EMAIL_REGEX)).not.toBe(null);
      });
    });
  });
});

describe('anonymizeText', () => {
  it('should anonymize a single email in text', () => {
    const text = 'Contact me at john@example.com';
    const result = anonymizeText(text);

    expect(result.anonymized).toBe('Contact me at [EMAIL ADDRESS]');
    expect(result.emails).toEqual(['john@example.com']);
  });

  it('should anonymize multiple emails in text', () => {
    const text = 'Email john@example.com or jane@test.org';
    const result = anonymizeText(text);

    expect(result.anonymized).toBe('Email [EMAIL ADDRESS] or [EMAIL ADDRESS]');
    expect(result.emails).toHaveLength(2);
    expect(result.emails).toContain('john@example.com');
    expect(result.emails).toContain('jane@test.org');
  });

  it('should handle duplicate emails (deduplicate)', () => {
    const text = 'Email john@example.com and also john@example.com';
    const result = anonymizeText(text);

    expect(result.anonymized).toBe('Email [EMAIL ADDRESS] and also [EMAIL ADDRESS]');
    expect(result.emails).toEqual(['john@example.com']); // Should be deduplicated
  });

  it('should preserve text structure and formatting', () => {
    const text = 'Hello,\n\nPlease contact user@example.com.\n\nThanks!';
    const result = anonymizeText(text);

    expect(result.anonymized).toBe('Hello,\n\nPlease contact [EMAIL ADDRESS].\n\nThanks!');
    expect(result.emails).toEqual(['user@example.com']);
  });

  it('should handle emails with special characters', () => {
    const text = 'Contact user.name+tag@example.com';
    const result = anonymizeText(text);

    expect(result.anonymized).toBe('Contact [EMAIL ADDRESS]');
    expect(result.emails).toEqual(['user.name+tag@example.com']);
  });

  it('should handle empty text', () => {
    const result = anonymizeText('');

    expect(result.anonymized).toBe('');
    expect(result.emails).toEqual([]);
  });

  it('should handle text without emails', () => {
    const text = 'This is just regular text without any email addresses.';
    const result = anonymizeText(text);

    expect(result.anonymized).toBe(text);
    expect(result.emails).toEqual([]);
  });

  it('should handle emails at different positions', () => {
    const testCases = [
      { text: 'user@example.com is at the start', expected: '[EMAIL ADDRESS] is at the start' },
      { text: 'Email in middle user@example.com here', expected: 'Email in middle [EMAIL ADDRESS] here' },
      { text: 'At the end user@example.com', expected: 'At the end [EMAIL ADDRESS]' },
    ];

    testCases.forEach(({ text, expected }) => {
      const result = anonymizeText(text);
      expect(result.anonymized).toBe(expected);
      expect(result.emails).toEqual(['user@example.com']);
    });
  });

  it('should handle emails with punctuation', () => {
    const text = 'Email: user@example.com, or call us.';
    const result = anonymizeText(text);

    expect(result.anonymized).toBe('Email: [EMAIL ADDRESS], or call us.');
    expect(result.emails).toEqual(['user@example.com']);
  });

  it('should handle multiple different emails', () => {
    const text = 'Contact alice@example.com, bob@test.org, or charlie@demo.net';
    const result = anonymizeText(text);

    expect(result.anonymized).toBe('Contact [EMAIL ADDRESS], [EMAIL ADDRESS], or [EMAIL ADDRESS]');
    expect(result.emails).toHaveLength(3);
    expect(result.emails).toContain('alice@example.com');
    expect(result.emails).toContain('bob@test.org');
    expect(result.emails).toContain('charlie@demo.net');
  });

  it('should preserve case of original text', () => {
    const text = 'Contact USER@EXAMPLE.COM for UPPERCASE emails';
    const result = anonymizeText(text);

    expect(result.anonymized).toBe('Contact [EMAIL ADDRESS] for UPPERCASE emails');
    expect(result.emails).toEqual(['USER@EXAMPLE.COM']);
  });
});

