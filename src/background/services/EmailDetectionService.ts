/**
 * EmailDetectionService
 * Handles email detection, anonymization, and logging
 */

import { processAllTextInBody } from '@/shared';
import { anonymizeText } from '../utils/anonymization';
import { EmailHistoryRepository } from '../repositories/EmailHistoryRepository';

export interface AnalyzePromptPayload {
  body: string;
}

export interface AnalyzePromptResponse {
  emails: string[];
  anonymizedBody: string;
}

export class EmailDetectionService {
  constructor(private readonly repository: EmailHistoryRepository) {}

  /**
   * Analyze a ChatGPT prompt body for emails and anonymize them
   */
  async analyzePrompt(payload: AnalyzePromptPayload): Promise<AnalyzePromptResponse> {
    const { body: bodyString } = payload;

    if (!bodyString || typeof bodyString !== 'string') {
      throw new Error('Invalid body - expected string');
    }

    // Collect all detected emails from all text parts
    const allDetectedEmails: string[] = [];

    // Process each text part in the body independently
    const anonymizedBody = processAllTextInBody(bodyString, (text) => {
      console.log('[EmailDetectionService] Processing text part:', text.substring(0, 100) + '...');

      // Detect and anonymize emails in this text part
      const { emails, anonymized } = anonymizeText(text);

      // Collect emails from this part
      if (emails.length > 0) {
        allDetectedEmails.push(...emails);
      }

      return anonymized;
    });

    console.log('[EmailDetectionService] Total emails detected:', allDetectedEmails);

    // Log all detected emails to history and get normalized list
    let detectedEmails: string[] = [];
    if (allDetectedEmails.length > 0) {
      detectedEmails = await this.repository.addEntries(allDetectedEmails);
    }

    return {
      emails: detectedEmails,
      anonymizedBody,
    };
  }
}
