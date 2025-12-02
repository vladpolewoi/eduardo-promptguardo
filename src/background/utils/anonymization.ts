import { EMAIL_REGEX, ANONYMIZED_EMAIL_PLACEHOLDER } from '../config/constants';

export interface AnonymizationResult {
  anonymized: string;
  emails: string[];
}

export function anonymizeText(text: string): AnonymizationResult {
  const emails = new Set<string>();

  const anonymized = text.replace(EMAIL_REGEX, (email) => {
    emails.add(email);

    return ANONYMIZED_EMAIL_PLACEHOLDER;
  });

  return { anonymized, emails: Array.from(emails) };
}

