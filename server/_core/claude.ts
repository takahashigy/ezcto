/**
 * Claude API integration for intelligent coordination
 * 
 * This module uses Claude Opus 4.5 and Haiku 4.5 to:
 * 1. Analyze user input and extract key information (Opus)
 * 2. Generate optimized prompts for Nanobanana image generation (Opus)
 * 3. Generate website HTML/CSS/JavaScript code (Opus)
 * 4. Enhance user descriptions (Haiku)
 */

export type ClaudeMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ClaudeResponse = {
  content: Array<{
    type: "text";
    text: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
};

import { retryWithBackoff } from "./retry";

/**
 * Call Claude API with messages
 */
export async function callClaude(
  messages: ClaudeMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    apiKey?: string; // Allow custom API key
  }
): Promise<string> {
  return retryWithBackoff(async () => {
    return await callClaudeInternal(messages, options);
  }, {
    maxRetries: 3,
    initialDelayMs: 1000,
    onRetry: (error, attempt) => {
      console.log(`[Claude] Retry attempt ${attempt}/3 due to: ${error.message}`);
    },
  });
}

/**
 * Internal Claude API call (without retry)
 */
async function callClaudeInternal(
  messages: ClaudeMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    apiKey?: string;
  }
): Promise<string> {
  const apiUrl = process.env.CLAUDE_API_URL;

  if (!apiUrl) {
    throw new Error("CLAUDE_API_URL is not configured");
  }

  const model = options?.model || "claude-opus-4-5-20251101";
  const maxTokens = options?.maxTokens || 4096;
  const temperature = options?.temperature || 0.7;
  
  // Use provided API key or fallback to CLAUDE_API_KEY
  const apiKey = options?.apiKey || process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    throw new Error("Claude API key is not configured");
  }

  const response = await fetch(`${apiUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Claude API request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as ClaudeResponse;

  if (!result.content || result.content.length === 0) {
    throw new Error("No content returned from Claude API");
  }

  return result.content[0].text;
}

/**
 * Analyze user input and generate structured project information
 * Uses Claude Opus 4.5 for high-quality brand strategy analysis
 */
export async function analyzeProjectInput(input: {
  projectName: string;
  ticker: string;
  description: string;
  memeImageUrl?: string;
  tokenomics?: string;
}): Promise<{
  // Detected language
  language: string;
  // Brand strategy
  brandStrategy: {
    personality: string;
    targetAudience: string;
    coreMessage: string;
    visualStyle: string;
  };
  // Color scheme
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  // Image generation prompts
  paydexBannerPrompt: string;
  xBannerPrompt: string;
  logoPrompt: string;
  heroBackgroundPrompt: string;
  featureIconPrompt: string;
  // Website content
  websiteContent: {
    headline: string;
    tagline: string;
    about: string;
    features: string[];
    tokenomics: {
      totalSupply: string;
      distribution: string;
    };
  };
}> {
  const prompt = `You are a world-class meme coin branding strategist and visual designer. Your mission is to analyze a meme cryptocurrency project and create a comprehensive brand strategy with optimized image generation prompts.

Project Information:
- Name: ${input.projectName}
- Ticker: ${input.ticker} (display WITHOUT $ symbol)
- Description: ${input.description}
${input.memeImageUrl ? `- Meme Image Reference: ${input.memeImageUrl}` : ""}
${input.tokenomics ? `- Tokenomics: ${input.tokenomics}` : ""}

Your task is to provide a complete brand strategy and image generation prompts. Focus on creating a cohesive visual identity that will drive conversions.

**COLOR INSPIRATION FROM USER IMAGE (OPTIONAL REFERENCE):**
${input.memeImageUrl ? `- The user has provided a meme image. Analyze its dominant colors and visual style as INSPIRATION for the color scheme.
- You may use similar colors or complementary colors that harmonize with the image.
- This is a REFERENCE, not a strict requirement. Prioritize aesthetic appeal and creative design over exact color matching.
- If the image has a specific art style (cartoon, pixel art, realistic, etc.), consider matching the website's visual style to it.` : "- No meme image provided. Use your creative judgment for the color scheme."}

**LANGUAGE DETECTION AND CONTENT GENERATION:**
- Detect the primary language of the project description
- If description contains ANY Chinese characters (中文), even mixed with English, generate ALL websiteContent fields in Chinese
- If description is in Japanese (日本語), generate ALL websiteContent fields in Japanese
- If description is in Korean (한국어), generate ALL websiteContent fields in Korean
- Otherwise, generate content in English
- Keep project name "${input.projectName}" and ticker "${input.ticker}" as-is (don't translate)
- The headline, tagline, about, and features MUST match the detected language
- For Chinese content: PRESERVE English keywords from user's input (e.g., Meme, Token, NFT, DeFi, Web3, AI)
- Mix Chinese and English naturally when the user's description contains English terms

**CRITICAL RULE - DO NOT FABRICATE DATA:**
- If tokenomics field is empty or not provided, set websiteContent.tokenomics.totalSupply and websiteContent.tokenomics.distribution to empty strings ""
- NEVER invent or guess tokenomics data - only use what the user explicitly provides
- Empty tokenomics means the section will be hidden on the website

**CRITICAL REQUIREMENTS FOR BANNER PROMPTS:**
- PayDex and X/Twitter banners MUST have the ticker "${input.ticker}" (WITHOUT $ symbol) as the most prominent, centered text element
- Text must be bold, highly readable, with strong contrast against background
- Use simple backgrounds that don't compete with text visibility
- Specify exact text placement: "Large bold text '${input.ticker}' centered in the composition"
- NEVER include hex color codes (like #FFD700, #FF0000, etc.) as visible text in the banner
- The ONLY text that should appear in banners is the ticker symbol "${input.ticker}" - no color codes, no hashtags with numbers
- Color information should describe the visual style, NOT be rendered as text

Please provide your analysis in the following JSON format:
{
  "brandStrategy": {
    "personality": "Brief description of brand personality (playful/professional/rebellious/etc)",
    "targetAudience": "Target demographic and psychographic profile",
    "coreMessage": "The single most important message this project conveys",
    "visualStyle": "Overall visual aesthetic (cartoon/realistic/pixel-art/cyberpunk/etc)"
  },
  "colorScheme": {
    "primary": "#hex color for main brand color",
    "secondary": "#hex color for secondary elements",
    "accent": "#hex color for CTAs and highlights"
  },
  "paydexBannerPrompt": "Detailed prompt for 1500x500 PayDex banner. MUST include: 'Large bold text showing ONLY the ticker ${input.ticker} centered prominently, professional trading platform banner style, high contrast for text readability, [visual style details]'. IMPORTANT: The ONLY text visible in the banner should be '${input.ticker}' - do NOT include any hex color codes like #FFD700 as text.",
  "xBannerPrompt": "Detailed prompt for 1200x480 X/Twitter banner. CRITICAL: Content MUST fill the ENTIRE canvas from edge to edge. Requirements: 1) Large bold text ${input.ticker} centered prominently 2) Design spans FULL WIDTH 1200px with NO empty margins 3) NO blank space on left or right sides 4) Background and design elements cover the entire banner area 5) High contrast for text visibility 6) Social media header style. DO NOT leave empty space for profile picture - fill the entire canvas.",
  "heroBackgroundPrompt": "Detailed prompt for 1920x1080 hero background (atmospheric, not too busy, leaves space for text overlay)",
  "featureIconPrompt": "Detailed prompt for 256x256 feature icon. CRITICAL: MUST have FULLY TRANSPARENT BACKGROUND with alpha channel. Requirements: 1) PNG format with transparency 2) NO solid background color 3) NO circular or rectangular background shape 4) Icon should float on transparent canvas 5) Simple flat or minimalist iconic design 6) Clean edges suitable for any background. Example: 'Minimalist [icon subject] icon, flat design, isolated on transparent background, no background elements, clean vector-style edges'",
  "communityScenePrompt": "Detailed prompt for 800x600 community scene image showing enthusiastic supporters, community gathering, or social atmosphere that matches the brand personality",
  "websiteContent": {
    "headline": "Catchy main headline for hero section",
    "tagline": "Brief memorable tagline",
    "about": "2-3 sentence about section describing the project",
    "features": [
      "First key feature or benefit",
      "Second key feature or benefit",
      "Third key feature or benefit"
    ],
    "tokenomics": {
      "totalSupply": "Total supply amount (e.g., '1,000,000,000')",
      "distribution": "Brief distribution summary (e.g., '50% Liquidity, 30% Community, 20% Team')"
    }
  }
}

Remember: The ticker text "${input.ticker}" (without $) MUST be clearly visible and centered in both banner prompts. This is non-negotiable for marketing effectiveness.

CRITICAL: NEVER include hex color codes (e.g., #FFD700, #00FF00) as visible text in any banner prompt. The ONLY text that should appear in banners is the project ticker "${input.ticker}". Color descriptions should be used to describe the visual style, not rendered as text content.`;

  const opusApiKey = process.env.CLAUDE_OPUS_API_KEY;
  
  if (!opusApiKey) {
    throw new Error("CLAUDE_OPUS_API_KEY is not configured");
  }

  const response = await callClaude([
    {
      role: "user",
      content: prompt,
    },
  ], {
    model: "claude-opus-4-5-20251101", // Use Opus for high-quality analysis
    temperature: 0.8, // Higher temperature for creativity
    maxTokens: 3072,
    apiKey: opusApiKey, // Use dedicated Opus API key
  });

  // Parse JSON response
  let jsonString = response;
  
  // Remove markdown code blocks if present
  const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
  }
  
  // Extract JSON object
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[analyzeProjectInput] Failed to find JSON in response:", response.substring(0, 500));
    throw new Error("Failed to parse Claude response as JSON");
  }
  
  try {
    const result = JSON.parse(jsonMatch[0]);
    // Detect language from user input
    const { detectLanguageFromInputs } = await import('./languageDetector');
    const detectedLanguage = detectLanguageFromInputs({
      projectName: input.projectName,
      ticker: input.ticker,
      description: input.description,
    });
    return {
      ...result,
      language: detectedLanguage,
    };
  } catch (error) {
    // Try to fix common JSON issues (trailing commas, etc.)
    const fixedJson = jsonMatch[0]
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
      .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":'); // Quote unquoted keys
    
    try {
      return JSON.parse(fixedJson);
    } catch (secondError) {
      console.error("[analyzeProjectInput] Failed to parse JSON:", jsonMatch[0].substring(0, 500));
      throw new Error(`Failed to parse Claude response as JSON: ${error}`);
    }
  }
}

/**
 * Generate website HTML/CSS/JavaScript code
 * Uses Claude Opus 4.5 for high-quality code generation
 */
/**
 * Generate HTML structure (Step 1 of 3)
 */
async function generateHTMLStructure(input: any, opusApiKey: string): Promise<string> {
  // Build tokenomics section instruction based on whether data exists
  const hasTokenomics = input.websiteContent.tokenomics.totalSupply && input.websiteContent.tokenomics.distribution;
  const tokenomicsInstruction = hasTokenomics 
    ? `5. Tokenomics section (id="tokenomics"):
   - Supply: ${input.websiteContent.tokenomics.totalSupply}
   - Distribution: ${input.websiteContent.tokenomics.distribution}
   - Use visual representation: pie chart (CSS-based) OR progress bars for distribution percentages
   - Make it visually appealing, not just plain text`
    : `5. Tokenomics section: DO NOT INCLUDE THIS SECTION - user did not provide tokenomics data`;

  // Build CA instruction based on whether contract address exists
  const hasCA = input.contractAddress && input.contractAddress.trim();
  
  // Determine chain type based on contract address format
  // BSC/ETH addresses start with 0x, Solana addresses are Base58 encoded
  const getChainPath = (address: string): string => {
    if (!address) return 'bsc';
    return address.trim().startsWith('0x') ? 'bsc' : 'sol';
  };
  const chainPath = hasCA ? getChainPath(input.contractAddress!) : 'bsc';
  const gmgnUrl = hasCA ? `https://gmgn.ai/${chainPath}/token/${input.contractAddress}` : '';
  const caInstruction = hasCA
    ? `**CONTRACT ADDRESS (CA) - CRITICAL:**
- CA: ${input.contractAddress}
- Display prominently in Hero section (below CTA buttons) or in a dedicated section
- MUST use this EXACT structure for copy functionality to work (COPY EXACTLY, DO NOT MODIFY):
  <div class="ca-container">
    <span class="ca-text">${input.contractAddress}</span>
    <button id="copy-ca-btn" class="copy-btn" data-ca="${input.contractAddress}">${input.language === 'zh-CN' ? '复制' : 'Copy'}</button>
  </div>
- CRITICAL: The <button> tag MUST be properly closed with </button>
- CRITICAL: The button MUST contain text content ("Copy" or "复制") between opening and closing tags
- The data-ca attribute MUST be on the BUTTON element (not the container)
- The button MUST have id="copy-ca-btn" for JavaScript to find it
- DO NOT truncate, modify, or split this structure across lines
- VERIFY: Button format must be <button ...>text</button> with NO line breaks inside the tag`
    : '';

  // Build language instruction based on detected language
  const languageInstruction = input.language === 'zh-CN' 
    ? `**LANGUAGE: 简体中文 (Chinese)**
- ALL text content MUST be in Chinese, including:
  - Navigation links: 首页, 关于, 特性, ${hasTokenomics ? '代币经济, ' : ''}社区
  - Button text: 立即购买, 了解更多, 加入社区, 复制, 下载
  - Section titles: 关于我们, 核心特性, 代币经济, 社区
  - Footer text: 版权所有, 下载营销素材
- Keep project name "${input.projectName}" and ticker "${input.ticker}" as-is (don't translate)
- Keep technical terms like CA address as-is
- PRESERVE English keywords from user's description (e.g., Meme, Token, NFT, DeFi, Web3, AI, etc.)
- Mix Chinese and English naturally when the user's input contains English terms`
    : input.language === 'ja'
    ? `**LANGUAGE: 日本語 (Japanese)**
- ALL text content MUST be in Japanese, including:
  - Navigation links: ホーム, 概要, 特徴, ${hasTokenomics ? 'トークノミクス, ' : ''}コミュニティ
  - Button text: 今すぐ購入, 詳細を見る, コミュニティに参加, コピー, ダウンロード
  - Section titles, footer text, etc.
- Keep project name "${input.projectName}" and ticker "${input.ticker}" as-is`
    : input.language === 'ko'
    ? `**LANGUAGE: 한국어 (Korean)**
- ALL text content MUST be in Korean, including:
  - Navigation links: 홈, 소개, 기능, ${hasTokenomics ? '토큰노믹스, ' : ''}커뮤니티
  - Button text: 지금 구매, 자세히 보기, 커뮤니티 참여, 복사, 다운로드
  - Section titles, footer text, etc.
- Keep project name "${input.projectName}" and ticker "${input.ticker}" as-is`
    : `**LANGUAGE: English**
- ALL text content should be in English
- Use professional, engaging copywriting style`;

  const prompt = `Generate ONLY the HTML structure for a meme coin landing page. No CSS, no JavaScript.

**PROJECT:** ${input.projectName} (${input.ticker})
${languageInstruction}
**BRAND PERSONALITY:** ${input.brandStrategy.personality}
**VISUAL STYLE:** ${input.brandStrategy.visualStyle}

**CONTENT:**
- Headline: ${input.websiteContent.headline}
- Tagline: ${input.websiteContent.tagline}
- About: ${input.websiteContent.about}
- Features: ${input.websiteContent.features.join(", ")}

${caInstruction}

**IMAGES (use these exact URLs):**
- Logo: ${input.logoUrl} (user's original uploaded image - use in navbar and footer)
- Hero BG: ${input.heroBackgroundUrl} (MUST be the FULL BACKGROUND of hero section, prominently visible)
- Community Scene: ${input.communitySceneUrl || ''} (use as main visual in About section)
- Feature Icon: ${input.featureIconUrl} (use as SMALL decorative icon, max 64px-80px, in feature cards)
- PayDex Banner: ${input.paydexBannerUrl} (can be used for decoration, MUST be responsive)
- X Banner: ${input.xBannerUrl} (can be used for decoration, MUST be responsive)

**PAGE STRUCTURE:**
1. Navigation bar (fixed at top):
   - Logo on left (use logoUrl, reasonable size ~40-50px height)
   - Nav links: About, Features, ${hasTokenomics ? 'Tokenomics, ' : ''}Community
   - Each nav link should have data-section attribute matching section IDs
   - Add class "active" to current section's nav link (JS will handle this)

2. Hero section (id="hero", FULL VIEWPORT HEIGHT):
   - Use heroBackgroundUrl as the FULL SECTION BACKGROUND (background-image style)
   - Overlay text: Headline, Tagline
   - CTA buttons:
     ${hasCA ? `- "Buy Now" button: <a href="${gmgnUrl}" target="_blank" class="buy-btn">Buy Now</a>` : '- NO Buy Now button (no contract address provided)'}
     - "Learn More" button (scrolls to about section)
   ${hasCA ? `- Contract Address display: Show "${input.contractAddress}" with a Copy button (id="copy-ca-btn", data-ca="${input.contractAddress}")` : '- NO Contract Address display (user did not provide CA)'}
   - The hero background image MUST be clearly visible, not hidden by dark overlays

3. About section (id="about"):
   - Use communitySceneUrl as the MAIN VISUAL (large, prominent, ~400-600px max-width)
   - Project description text alongside or below the image
   - Layout: image on one side, text on the other (or stacked on mobile)

4. Features section (id="features"):
   - 3 feature cards in a row (grid or flexbox)
   - CRITICAL: Each feature card MUST include an <img> tag with the feature icon:
     <div class="feature-card">
       <img src="${input.featureIconUrl}" alt="Feature Icon" class="feature-icon" loading="lazy" decoding="async">
       <h3>Feature Title</h3>
       <p>Feature description</p>
     </div>
   - The feature icon MUST be SMALL (max 64-80px width/height), NOT full-width
   - DO NOT skip the feature icon image - it is REQUIRED in every card
   - Use the SAME icon URL for all 3 cards (they share the same decorative icon)

${tokenomicsInstruction}

6. Community section (id="community"):
   - Social links container with class "social-links" (MUST be HORIZONTAL row layout)
   - Use Font Awesome icons (ONLY show links that have URLs provided):
     ${input.twitterUrl ? `- Twitter/X: <a href="${input.twitterUrl}" target="_blank" class="social-link"><i class="fa-brands fa-x-twitter"></i></a>` : '- NO Twitter link (user did not provide)'}
     ${input.telegramUrl ? `- Telegram: <a href="${input.telegramUrl}" target="_blank" class="social-link"><i class="fa-brands fa-telegram"></i></a>` : '- NO Telegram link (user did not provide)'}
     ${input.discordUrl ? `- Discord: <a href="${input.discordUrl}" target="_blank" class="social-link"><i class="fa-brands fa-discord"></i></a>` : '- NO Discord link (user did not provide)'}
   - CRITICAL: Wrap all social links in <div class="social-links"> container
   - CRITICAL: Social links MUST be displayed in a HORIZONTAL ROW, NOT vertical
   - IMPORTANT: Do NOT show social icons for links that are not provided
   - Final CTA button

7. Marketing Banners section (id="banners", before footer):
   - Section title: "Marketing Assets" or similar
   - Display PayDex Banner as responsive image: <img src="${input.paydexBannerUrl}" class="banner-preview" alt="PayDex Banner">
   - Display X Banner as responsive image: <img src="${input.xBannerUrl}" class="banner-preview" alt="X Banner">
   - Each banner should have a download button below it
   - Banners MUST be displayed adaptively (width: 100%, max-width: 800px, centered)
   - Add download attribute to links: <a href="${input.paydexBannerUrl}" download>Download PayDex Banner</a>

8. Footer:
   - DO NOT include Logo in footer (to avoid sizing issues)
   - Quick download links for marketing assets (smaller buttons)
   - Social media icons (same as community section)
   - Copyright text

**CRITICAL RULES:**
1. Hero background (heroBackgroundUrl) MUST be visible as full-section background, NOT as a small image
2. Community scene (communitySceneUrl) MUST be displayed prominently in About section
3. Feature icon (featureIconUrl) MUST be SMALL (max 64-80px), used as decorative element in cards
4. All images MUST have: loading="lazy" (except hero bg), decoding="async", alt text
5. All images MUST be responsive: max-width: 100%; height: auto;
6. ${hasTokenomics ? 'Tokenomics MUST have visual representation (pie chart or progress bars)' : 'DO NOT include Tokenomics section'}
7. Navigation links MUST have data-section attributes for scroll-spy functionality
8. ${hasCA ? 'Contract Address MUST be copyable with visual feedback' : 'No contract address to display'}
9. Use Font Awesome for social icons (CDN will be added in head)
10. Text style MUST match the brand personality: ${input.brandStrategy.personality}

Return ONLY semantic HTML5 with proper tags, IDs, classes, and data attributes. No inline styles.`;

  return await callClaude([{ role: "user", content: prompt }], {
    model: "claude-opus-4-5-20251101",
    temperature: 0.5,
    maxTokens: 8192,
    apiKey: opusApiKey,
  });
}

/**
 * Generate CSS styles (Step 2 of 3)
 */
async function generateCSS(input: any, htmlStructure: string, opusApiKey: string): Promise<string> {
  const prompt = `Generate ONLY the CSS for this HTML structure:

${htmlStructure.substring(0, 4000)}...

**DESIGN SYSTEM:**
- Primary: ${input.colorScheme.primary}
- Secondary: ${input.colorScheme.secondary}
- Accent: ${input.colorScheme.accent}
- Personality: ${input.brandStrategy.personality}
- Visual Style: ${input.brandStrategy.visualStyle}

**REQUIREMENTS:**
- Responsive (mobile-first, breakpoints: 640px, 768px, 1024px, 1280px)
- Smooth animations (fade-in on scroll, hover effects)
- Modern typography matching visual style
- High-conversion CTAs with hover effects
- Text colors MUST have good contrast against backgrounds

**TYPOGRAPHY AND TEXT WRAPPING (CRITICAL FOR CJK LANGUAGES):**
- For hero headlines and section titles: use word-break: keep-all; to prevent single character orphans
- Chinese/Japanese/Korean text should NOT break in the middle of words
- Hero headline CSS example:
  .hero-title, h1, .headline {
    word-break: keep-all;      /* Prevents breaking CJK words */
    overflow-wrap: break-word; /* Allows breaking at word boundaries if needed */
    hyphens: none;             /* No hyphenation for CJK */
  }
- For long titles, use responsive font-size with clamp() or vw units to prevent overflow
- Example: font-size: clamp(1.5rem, 5vw, 3rem);
- Avoid fixed widths on text containers that might cause single-character line breaks
- Use min-width: 0 on flex children to allow proper text wrapping

**CRITICAL CSS RULES:**

1. HERO SECTION (MOST IMPORTANT):
   - Hero section MUST be min-height: 100vh (full viewport)
   - Hero background image MUST be clearly visible
   - Use: background-size: cover; background-position: center;
   - If using overlay, opacity MUST NOT exceed 0.3 (30%)
   - Example: background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.3)), url(...);
   - DO NOT use solid colors that hide the background image

2. NAVIGATION:
   - Fixed position at top (position: fixed; top: 0; width: 100%; z-index: 1000;)
   - Nav links with .active class should have distinct styling (underline, color change, or background)
   - Smooth transition for active state changes

3. FEATURES SECTION LAYOUT (CRITICAL FOR CENTERING):
   - .features-grid or features container MUST be centered: margin: 0 auto; max-width: 1200px;
   - Use flexbox with centering: display: flex; flex-wrap: wrap; justify-content: center; gap: 2rem;
   - OR use CSS Grid with centering: display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); justify-items: center;
   - Each feature card: max-width: 350px; width: 100%;
   - On mobile (< 768px): single column, cards centered
   - On desktop: 3 cards in a row, evenly spaced and centered

4. FEATURE ICONS:
   - Feature icons MUST be SMALL: max-width: 64px; max-height: 64px;
   - Center icons in feature cards: margin: 0 auto; display: block;
   - DO NOT make feature icons full-width

5. COMMUNITY SCENE IMAGE:
   - In About section: max-width: 500px; width: 100%;
   - Add border-radius and subtle shadow for polish
   - Responsive: scales down on mobile

6. IMAGE RESPONSIVENESS:
   - All images: max-width: 100%; height: auto;
   - Banners MUST NOT overflow viewport
   - Use object-fit: cover for background images

7. CONTRACT ADDRESS (CA) STYLING:
   - .ca-container: prominent display, centered or left-aligned
   - .ca-text: monospace font, truncate on mobile if needed
   - .copy-btn: clear button styling with hover effect
   - .copy-success: visual feedback class (green color, checkmark)

8. TOKENOMICS VISUALIZATION (if present):
   - Pie chart: use CSS conic-gradient or SVG
   - Progress bars: colored bars with percentage labels
   - Make it visually appealing, not just plain text

9. SOCIAL MEDIA LINKS (CRITICAL):
   - Social links MUST be displayed as HORIZONTAL inline buttons/icons
   - Use flexbox: display: flex; flex-direction: row; gap: 1rem; justify-content: center;
   - Each social link: display: inline-flex; align-items: center; justify-content: center;
   - Icon size: font-size: 1.5rem to 2rem;
   - Add hover effects (scale, color change)
   - NEVER use vertical layout (flex-direction: column) for social links
   - Example: .social-links { display: flex; flex-direction: row; gap: 1rem; }
   - Example: .social-links a { display: inline-flex; width: 48px; height: 48px; border-radius: 50%; }

10. MARKETING BANNERS SECTION:
   - .banner-preview: width: 100%; max-width: 800px; height: auto; margin: 0 auto; display: block;
   - Banners should be centered with margin: 2rem auto;
   - Add subtle shadow or border for visual separation
   - Download buttons below each banner, styled as secondary CTAs
   - Responsive: on mobile, banners stack vertically with full width

11. FOOTER:
   - Clean layout with proper spacing
   - DO NOT include any logo image in footer
   - Quick download links (smaller than main CTAs)
   - Social media icons (horizontal row)
   - Copyright text

12. LAZY LOADING TRANSITIONS:
   - img { opacity: 0; transition: opacity 0.3s ease-in-out; }
   - img.loaded { opacity: 1; }

Return ONLY the CSS code inside <style> tags.`;

  return await callClaude([{ role: "user", content: prompt }], {
    model: "claude-opus-4-5-20251101",
    temperature: 0.5,
    maxTokens: 12288,
    apiKey: opusApiKey,
  });
}

/**
 * Generate JavaScript (Step 3 of 3)
 */
async function generateJavaScript(opusApiKey: string): Promise<string> {
  const prompt = `Generate ONLY the JavaScript for a meme coin landing page.

**REQUIRED FEATURES:**

1. NAVIGATION SCROLL-SPY (MOST IMPORTANT):
   - Track which section is currently in viewport
   - Update nav link .active class based on scroll position
   - Use IntersectionObserver to detect section visibility
   - When a section enters viewport (threshold: 0.3-0.5), add .active to corresponding nav link
   - Remove .active from other nav links
   - Example:
     const sections = document.querySelectorAll('section[id]');
     const navLinks = document.querySelectorAll('nav a[data-section]');
     const observer = new IntersectionObserver((entries) => {
       entries.forEach(entry => {
         if (entry.isIntersecting) {
           navLinks.forEach(link => link.classList.remove('active'));
           const activeLink = document.querySelector(\`nav a[data-section="\${entry.target.id}"]\`);
           if (activeLink) activeLink.classList.add('active');
         }
       });
     }, { threshold: 0.3 });
     sections.forEach(section => observer.observe(section));

2. SMOOTH SCROLL NAVIGATION:
   - All anchor links scroll smoothly to target section
   - Use behavior: 'smooth' or custom easing
   - Account for fixed navbar height offset

3. CONTRACT ADDRESS COPY (CRITICAL - MUST WORK):
   - Find the copy button by id="copy-ca-btn" or class="copy-btn"
   - Get the contract address from data-ca attribute on the button
   - On click:
     a. Get CA from button.getAttribute('data-ca') or button.dataset.ca
     b. Copy to clipboard: navigator.clipboard.writeText(ca)
     c. Show visual feedback:
        - Change button text to "Copied!" temporarily
        - Add .copy-success class
        - After 2 seconds, revert to original text
   - IMPORTANT: Use this exact pattern:
     const copyBtn = document.getElementById('copy-ca-btn') || document.querySelector('.copy-btn');
     if (copyBtn) {
       copyBtn.addEventListener('click', async () => {
         const ca = copyBtn.getAttribute('data-ca');
         if (ca) {
           try {
             await navigator.clipboard.writeText(ca);
             const originalText = copyBtn.textContent;
             copyBtn.textContent = 'Copied!';
             copyBtn.classList.add('copy-success');
             setTimeout(() => {
               copyBtn.textContent = originalText;
               copyBtn.classList.remove('copy-success');
             }, 2000);
           } catch (err) {
             console.error('Failed to copy:', err);
           }
         }
       });
     }

4. FADE-IN ON SCROLL ANIMATIONS:
   - Use IntersectionObserver for elements with .fade-in class
   - Add .visible class when element enters viewport
   - CSS handles the actual animation

5. IMAGE LAZY LOADING:
   - Add 'loaded' class to images when they finish loading
   - Use img.onload or img.complete check
   - Smooth fade-in transition via CSS

6. DOWNLOAD BUTTONS:
   - For download links, ensure proper download attribute
   - Optional: track download clicks

**CODE QUALITY:**
- Use modern ES6+ syntax
- Use event delegation where appropriate
- Handle edge cases (missing elements, API failures)
- Keep code minimal and performant
- Use DOMContentLoaded to ensure DOM is ready

Return ONLY the JavaScript code inside <script> tags.`;

  return await callClaude([{ role: "user", content: prompt }], {
    model: "claude-opus-4-5-20251101",
    temperature: 0.5,
    maxTokens: 4096,
    apiKey: opusApiKey,
  });
}

export async function generateWebsiteCode(input: {
  projectName: string;
  ticker: string;
  description: string;
  contractAddress?: string; // User's contract address (CA) for copy functionality
  // Social links
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
  language: string;
  brandStrategy: {
    personality: string;
    visualStyle: string;
  };
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  websiteContent: {
    headline: string;
    tagline: string;
    about: string;
    features: string[];
    tokenomics: {
      totalSupply: string;
      distribution: string;
    };
  };
  // All generated image URLs
  paydexBannerUrl: string;
  xBannerUrl: string;
  logoUrl: string; // User's original uploaded image
  heroBackgroundUrl: string;
  featureIconUrl: string;
  communitySceneUrl?: string; // New: community scene image
}): Promise<string> {
  console.log("[generateWebsiteCode] Step 1: Generating HTML structure...");
  
  const opusApiKey = process.env.CLAUDE_OPUS_API_KEY;
  if (!opusApiKey) {
    throw new Error("CLAUDE_OPUS_API_KEY is not configured");
  }

  // Step 1: Generate HTML structure
  let htmlStructure = await generateHTMLStructure(input, opusApiKey);
  htmlStructure = extractCode(htmlStructure, 'html');
  console.log("[generateWebsiteCode] HTML structure generated:", htmlStructure.length, "chars");

  // Step 2: Generate CSS
  console.log("[generateWebsiteCode] Step 2: Generating CSS...");
  let cssCode = await generateCSS(input, htmlStructure, opusApiKey);
  cssCode = extractCode(cssCode, 'css');
  console.log("[generateWebsiteCode] CSS generated:", cssCode.length, "chars");

  // Step 3: Generate JavaScript
  console.log("[generateWebsiteCode] Step 3: Generating JavaScript...");
  let jsCode = await generateJavaScript(opusApiKey);
  jsCode = extractCode(jsCode, 'js');
  console.log("[generateWebsiteCode] JavaScript generated:", jsCode.length, "chars");

  // Step 4: Combine all parts
  console.log("[generateWebsiteCode] Step 4: Combining all parts...");
  const completeHTML = combineHTMLParts(htmlStructure, cssCode, jsCode, input);
  console.log("[generateWebsiteCode] Complete HTML:", completeHTML.length, "chars");
  
  return completeHTML;
}

/**
 * Extract code from Claude response (handles markdown blocks)
 * Also cleans up any remaining markdown artifacts
 */
function extractCode(response: string, type: 'html' | 'css' | 'js'): string {
  let code = response;
  
  // Remove markdown code blocks (```html, ```css, ```javascript, ```js, or just ```)
  const codeBlockMatch = code.match(/```(?:html|css|javascript|js)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    code = codeBlockMatch[1].trim();
  }
  
  // Clean up any remaining markdown artifacts at the start
  code = code.replace(/^```(?:html|css|javascript|js)?\s*/i, '');
  // Clean up any remaining markdown artifacts at the end
  code = code.replace(/\s*```$/i, '');
  
  // For CSS, extract <style> tags
  if (type === 'css') {
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (styleMatch) {
      return styleMatch[1].trim();
    }
  }
  
  // For JS, extract <script> tags
  if (type === 'js') {
    const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (scriptMatch) {
      return scriptMatch[1].trim();
    }
  }
  
  return code.trim();
}

/**
 * Combine HTML, CSS, and JavaScript into a complete document
 */
function combineHTMLParts(htmlStructure: string, cssCode: string, jsCode: string, input: any): string {
  // Extract body content from HTML structure
  const bodyMatch = htmlStructure.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch ? bodyMatch[1].trim() : htmlStructure;
  
  // Final cleanup: remove any remaining markdown artifacts from body content
  bodyContent = bodyContent
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  
  // CRITICAL: Escape </script> in JavaScript code to prevent premature tag closure
  // This is a common issue when JS code contains string literals with </script>
  const safeJsCode = jsCode.replace(/<\/script>/gi, '<\\/script>');
  
  // Build complete HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${input.projectName} (${input.ticker}) - ${input.websiteContent.tagline}</title>
    <meta name="description" content="${input.websiteContent.about.substring(0, 160)}">
    <meta property="og:title" content="${input.projectName} (${input.ticker})">
    <meta property="og:description" content="${input.websiteContent.tagline}">
    <meta property="og:image" content="${input.logoUrl}">
    <link rel="icon" href="${input.logoUrl}" type="image/png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <style>
${cssCode}
    </style>
</head>
<body>
${bodyContent}
    <script>
${safeJsCode}
    </script>
</body>
</html>`;

}

/**
 * Enhance user's project description using Claude Haiku 4.5
 * This provides better input for Claude Opus 4.5 to generate high-quality assets
 */
export async function enhanceDescription(input: {
  projectName: string;
  ticker: string;
  description: string;
}): Promise<string> {
  const prompt = `You are a professional meme coin project consultant. Your task is to enhance and expand a user's brief project description into a detailed, comprehensive description that will help AI generate better marketing materials.

Project Name: ${input.projectName}
Ticker: ${input.ticker}
User's Brief Description: ${input.description}

Please enhance this description by:
1. Expanding on the core concept and unique selling points
2. Adding target audience and community vision
3. Including potential use cases or features
4. Describing the brand personality and tone
5. Mentioning any cultural references or meme origins if applicable

Provide a detailed, engaging description (150-300 words) that captures the essence of this meme coin project. Write in an enthusiastic but professional tone. Focus on what makes this project unique and appealing to potential investors.

Return ONLY the enhanced description text, no additional commentary.`;

  const haikuApiKey = process.env.CLAUDE_HAIKU_API_KEY;
  
  if (!haikuApiKey) {
    throw new Error("CLAUDE_HAIKU_API_KEY is not configured");
  }

  const enhancedDescription = await callClaude(
    [
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      model: "claude-haiku-4-5-20251001", // Use Haiku for fast and cost-effective description enhancement
      maxTokens: 1024,
      temperature: 0.8, // Higher temperature for more creative descriptions
      apiKey: haikuApiKey, // Use dedicated Haiku API key
    }
  );

  return enhancedDescription.trim();
}
