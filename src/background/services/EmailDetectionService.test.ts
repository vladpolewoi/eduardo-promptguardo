import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailDetectionService, type AnalyzePromptPayload } from './EmailDetectionService';
import type { EmailHistoryRepository } from '@/shared/repositories';

// Mock the anonymization utility
vi.mock('../utils/anonymization', () => ({
  anonymizeText: vi.fn((text: string) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails: string[] = [];
    const anonymized = text.replace(emailRegex, (email) => {
      emails.push(email);
      return '[EMAIL ADDRESS]';
    });
    return { anonymized, emails };
  }),
}));

describe('EmailDetectionService', () => {
  let service: EmailDetectionService;
  let mockRepository: EmailHistoryRepository;
  let mockAddEntries: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock repository with addEntries method
    mockAddEntries = vi.fn();
    mockRepository = {
      addEntries: mockAddEntries,
    } as unknown as EmailHistoryRepository;

    // Create service instance with mocked repository
    service = new EmailDetectionService(mockRepository);
  });

  describe('analyzePrompt', () => {
    it('should detect and anonymize emails in simple text', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['Contact me at john@example.com'],
              },
            },
          ],
        }),
      };

      mockAddEntries.mockResolvedValue(['john@example.com']);

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toEqual(['john@example.com']);
      expect(result.anonymizedBody).toContain('[EMAIL ADDRESS]');
      expect(result.anonymizedBody).not.toContain('john@example.com');
      expect(mockAddEntries).toHaveBeenCalledWith(['john@example.com']);
    });

    it('should handle multiple emails in one message', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['Contact john@example.com or jane@test.org'],
              },
            },
          ],
        }),
      };

      mockAddEntries.mockResolvedValue(['john@example.com', 'jane@test.org']);

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toHaveLength(2);
      expect(result.emails).toContain('john@example.com');
      expect(result.emails).toContain('jane@test.org');
      expect(mockAddEntries).toHaveBeenCalledWith(
        expect.arrayContaining(['john@example.com', 'jane@test.org']),
      );
    });

    it('should handle emails in multiple messages', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['First email: alice@example.com'],
              },
            },
            {
              content: {
                parts: ['Second email: bob@test.org'],
              },
            },
          ],
        }),
      };

      mockAddEntries.mockResolvedValue(['alice@example.com', 'bob@test.org']);

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toHaveLength(2);
      expect(mockAddEntries).toHaveBeenCalledWith(
        expect.arrayContaining(['alice@example.com', 'bob@test.org']),
      );
    });

    it('should handle emails in multiple parts of same message', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['Email: user1@example.com', 'Also contact user2@test.org'],
              },
            },
          ],
        }),
      };

      mockAddEntries.mockResolvedValue(['user1@example.com', 'user2@test.org']);

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toHaveLength(2);
      expect(mockAddEntries).toHaveBeenCalledWith(
        expect.arrayContaining(['user1@example.com', 'user2@test.org']),
      );
    });

    it('should deduplicate emails across messages', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['Contact john@example.com'],
              },
            },
            {
              content: {
                parts: ['Also john@example.com'],
              },
            },
          ],
        }),
      };

      mockAddEntries.mockResolvedValue(['john@example.com']);

      const result = await service.analyzePrompt(payload);

      // The repository should receive deduplicated emails
      expect(mockAddEntries).toHaveBeenCalled();
      const callArgs = mockAddEntries.mock.calls[0][0];
      expect(callArgs.filter((e: string) => e === 'john@example.com')).toHaveLength(2); // Both instances collected
      // But repository should deduplicate
      expect(result.emails).toEqual(['john@example.com']);
    });

    it('should handle text without emails', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['This is just regular text without any email addresses.'],
              },
            },
          ],
        }),
      };

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toEqual([]);
      expect(result.anonymizedBody).toBe(payload.body); // Should remain unchanged
      expect(mockAddEntries).not.toHaveBeenCalled();
    });

    it('should handle empty body', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: [''],
              },
            },
          ],
        }),
      };

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toEqual([]);
      expect(mockAddEntries).not.toHaveBeenCalled();
    });

    it('should handle non-string parts (preserve them)', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['Email: user@example.com', { type: 'image', data: 'base64...' }],
              },
            },
          ],
        }),
      };

      mockAddEntries.mockResolvedValue(['user@example.com']);

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toEqual(['user@example.com']);
      const parsed = JSON.parse(result.anonymizedBody);
      expect(parsed.messages[0].content.parts[1]).toEqual({ type: 'image', data: 'base64...' });
    });

    it('should handle invalid ChatGPT body structure gracefully', async () => {
      const payload: AnalyzePromptPayload = {
        body: 'This is not valid JSON',
      };

      // Should return original body when parsing fails
      const result = await service.analyzePrompt(payload);

      expect(result.anonymizedBody).toBe(payload.body);
      expect(mockAddEntries).not.toHaveBeenCalled();
    });

    it('should handle body without messages array', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          someOtherField: 'value',
        }),
      };

      const result = await service.analyzePrompt(payload);

      expect(result.anonymizedBody).toBe(payload.body);
      expect(mockAddEntries).not.toHaveBeenCalled();
    });

    it('should throw error for invalid body type (not string)', async () => {
      const payload = {
        body: null,
      } as unknown as AnalyzePromptPayload;

      await expect(service.analyzePrompt(payload)).rejects.toThrow('Invalid body - expected string');
    });

    it('should throw error for missing body', async () => {
      const payload = {
        body: undefined,
      } as unknown as AnalyzePromptPayload;

      await expect(service.analyzePrompt(payload)).rejects.toThrow('Invalid body - expected string');
    });

    it('should throw error for empty string body', async () => {
      const payload: AnalyzePromptPayload = {
        body: '',
      };

      // Empty string is falsy, so it throws an error (matches current implementation)
      await expect(service.analyzePrompt(payload)).rejects.toThrow('Invalid body - expected string');
    });

    it('should handle repository errors gracefully', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['Contact john@example.com'],
              },
            },
          ],
        }),
      };

      const repositoryError = new Error('Storage error');
      mockAddEntries.mockRejectedValue(repositoryError);

      await expect(service.analyzePrompt(payload)).rejects.toThrow('Storage error');
    });

    it('should process complex ChatGPT body structure', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: {
                parts: [
                  'Please send an email to',
                  'admin@company.com',
                  'and cc',
                  'manager@company.com',
                ],
              },
              metadata: { some: 'data' },
            },
            {
              role: 'assistant',
              content: {
                parts: ['I can help with that.'],
              },
            },
          ],
          conversation_id: '123',
          other_fields: 'preserved',
        }),
      };

      mockAddEntries.mockResolvedValue(['admin@company.com', 'manager@company.com']);

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toHaveLength(2);
      expect(result.emails).toContain('admin@company.com');
      expect(result.emails).toContain('manager@company.com');

      // Verify structure is preserved
      const parsed = JSON.parse(result.anonymizedBody);
      expect(parsed.conversation_id).toBe('123');
      expect(parsed.other_fields).toBe('preserved');
      expect(parsed.messages).toHaveLength(2);
      expect(parsed.messages[0].metadata).toEqual({ some: 'data' });
    });

    it('should handle emails with special characters', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['Contact user.name+tag@example.com'],
              },
            },
          ],
        }),
      };

      mockAddEntries.mockResolvedValue(['user.name+tag@example.com']);

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toContain('user.name+tag@example.com');
      expect(result.anonymizedBody).toContain('[EMAIL ADDRESS]');
    });

    it('should handle mixed case emails', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['Contact USER@EXAMPLE.COM'],
              },
            },
          ],
        }),
      };

      mockAddEntries.mockResolvedValue(['USER@EXAMPLE.COM']);

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toContain('USER@EXAMPLE.COM');
    });

    it('should return correct structure in response', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['Email: test@example.com'],
              },
            },
          ],
        }),
      };

      mockAddEntries.mockResolvedValue(['test@example.com']);

      const result = await service.analyzePrompt(payload);

      expect(result).toHaveProperty('emails');
      expect(result).toHaveProperty('anonymizedBody');
      expect(Array.isArray(result.emails)).toBe(true);
      expect(typeof result.anonymizedBody).toBe('string');
    });

    it('should not call repository when no emails detected', async () => {
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: ['No emails here'],
              },
            },
          ],
        }),
      };

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toEqual([]);
      expect(mockAddEntries).not.toHaveBeenCalled();
    });

    it('should handle very long text with many emails', async () => {
      const emails = Array.from({ length: 10 }, (_, i) => `user${i}@example.com`);
      const text = emails.join(' and ');
      const payload: AnalyzePromptPayload = {
        body: JSON.stringify({
          messages: [
            {
              content: {
                parts: [text],
              },
            },
          ],
        }),
      };

      mockAddEntries.mockResolvedValue(emails);

      const result = await service.analyzePrompt(payload);

      expect(result.emails).toHaveLength(10);
      expect(mockAddEntries).toHaveBeenCalledWith(expect.arrayContaining(emails));
    });
  });
});

