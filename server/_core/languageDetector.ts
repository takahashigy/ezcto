/**
 * Language detection utility for multi-language support
 */

export type SupportedLanguage = 'zh-CN' | 'en' | 'ja' | 'ko';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  htmlLang: string;
}

const LANGUAGE_MAP: Record<SupportedLanguage, LanguageInfo> = {
  'zh-CN': { code: 'zh-CN', name: 'Chinese', htmlLang: 'zh-CN' },
  'en': { code: 'en', name: 'English', htmlLang: 'en' },
  'ja': { code: 'ja', name: 'Japanese', htmlLang: 'ja' },
  'ko': { code: 'ko', name: 'Korean', htmlLang: 'ko' },
};

/**
 * Detect the primary language of input text based on Unicode character ranges
 * 
 * Priority rules for mixed-language content:
 * - If Chinese characters are present (even mixed with English), prioritize Chinese
 * - Japanese and Korean take precedence over pure English
 * - English keywords in Chinese/Japanese/Korean text are preserved naturally
 */
export function detectLanguage(text: string): SupportedLanguage {
  if (!text || text.trim().length === 0) {
    return 'en'; // Default to English
  }

  // Count characters by language
  let chineseCount = 0;
  let japaneseCount = 0;
  let koreanCount = 0;
  let englishCount = 0;

  for (const char of text) {
    const code = char.charCodeAt(0);

    // Chinese (CJK Unified Ideographs)
    if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF)) {
      chineseCount++;
    }
    // Japanese (Hiragana and Katakana)
    else if ((code >= 0x3040 && code <= 0x309F) || (code >= 0x30A0 && code <= 0x30FF)) {
      japaneseCount++;
    }
    // Korean (Hangul)
    else if (code >= 0xAC00 && code <= 0xD7AF) {
      koreanCount++;
    }
    // English (Basic Latin)
    else if ((code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A)) {
      englishCount++;
    }
  }

  // Priority: Chinese > Japanese > Korean > English
  // If ANY Chinese characters exist, treat as Chinese (handles mixed Chinese-English input)
  // This ensures "这是一个Meme项目" is detected as Chinese, not English
  if (chineseCount > 0) {
    return 'zh-CN';
  }

  // Japanese takes priority over English (Kanji may be counted as Chinese above)
  if (japaneseCount > 0) {
    return 'ja';
  }

  // Korean takes priority over English
  if (koreanCount > 0) {
    return 'ko';
  }

  // Default to English
  return 'en';
}

/**
 * Detect language from multiple input fields (project name, ticker, description)
 */
export function detectLanguageFromInputs(inputs: {
  projectName?: string;
  ticker?: string;
  description?: string;
}): SupportedLanguage {
  // Combine all inputs with weighted priority (description > projectName > ticker)
  const combinedText = [
    inputs.description || '',
    inputs.projectName || '',
    inputs.ticker || '',
  ].join(' ');

  return detectLanguage(combinedText);
}

/**
 * Get language info by code
 */
export function getLanguageInfo(code: SupportedLanguage): LanguageInfo {
  return LANGUAGE_MAP[code];
}

/**
 * Get language instruction for AI prompts
 */
export function getLanguageInstruction(language: SupportedLanguage): string {
  const instructions: Record<SupportedLanguage, string> = {
    'zh-CN': '请使用简体中文输出所有文案内容。',
    'en': 'Please output all content in English.',
    'ja': 'すべてのコンテンツを日本語で出力してください。',
    'ko': '모든 콘텐츠를 한국어로 출력하세요.',
  };

  return instructions[language];
}
