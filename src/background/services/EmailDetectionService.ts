import { processAllTextInBody, EmailHistoryRepository } from '@/shared';
import { anonymizeText } from '../utils/anonymization';

export interface AnalyzePromptPayload {
  body: string;
}

export interface AnalyzePromptResponse {
  emails: string[];
  anonymizedBody: string;
}

export class EmailDetectionService {
  constructor(private readonly repository: EmailHistoryRepository) {}

  async analyzePrompt(payload: AnalyzePromptPayload): Promise<AnalyzePromptResponse> {
    const { body: bodyString } = payload;

    if (!bodyString || typeof bodyString !== 'string') {
      throw new Error('Invalid body - expected string');
    }

    const allDetectedEmails: string[] = [];

    const anonymizedBody = processAllTextInBody(bodyString, (text) => {
      const { emails, anonymized } = anonymizeText(text);

      if (emails.length > 0) {
        allDetectedEmails.push(...emails);
      }

      return anonymized;
    });

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

