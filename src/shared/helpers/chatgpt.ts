export interface ChatGPTMessage {
  content: {
    parts: (string | unknown)[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ChatGPTRequestBody {
  messages: ChatGPTMessage[];
  [key: string]: unknown;
}

export function parseChatGPTBody(bodyString: string): ChatGPTRequestBody | null {
  try {
    const parsed = JSON.parse(bodyString);

    if (!parsed.messages || !Array.isArray(parsed.messages)) {
      console.warn('[ChatGPT Helpers] Invalid body structure - missing messages array');

      return null;
    }

    return parsed;
  } catch (error) {
    console.error('[ChatGPT Helpers] Failed to parse body:', error);

    return null;
  }
}

export function stringifyChatGPTBody(body: ChatGPTRequestBody): string {
  return JSON.stringify(body);
}

export function processAllTextInBody(
  bodyString: string,
  processor: (text: string) => string,
): string {
  const body = parseChatGPTBody(bodyString);

  if (!body) {
    console.error('[ChatGPT Helpers] Cannot transform invalid body');

    // Return original on error
    return bodyString;
  }

  // Process each string part
  const transformedBody: ChatGPTRequestBody = {
    ...body,
    messages: body.messages.map((msg) => ({
      ...msg,
      content: {
        ...msg.content,
        parts: msg.content.parts.map((part) => (typeof part === 'string' ? processor(part) : part)),
      },
    })),
  };

  return stringifyChatGPTBody(transformedBody);
}

