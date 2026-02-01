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

**CRITICAL REQUIREMENTS FOR BANNER PROMPTS:**
- PayDex and X/Twitter banners MUST have the ticker "${input.ticker}" (WITHOUT $ symbol) as the most prominent, centered text element
- Text must be bold, highly readable, with strong contrast against background
- Use simple backgrounds that don't compete with text visibility
- Specify exact text placement: "Large bold text '${input.ticker}' centered in the composition"

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
  "paydexBannerPrompt": "Detailed prompt for 1500x500 PayDex banner. MUST include: 'Large bold text ${input.ticker} centered prominently, professional trading platform banner style, high contrast for text readability, [visual style details]'",
  "xBannerPrompt": "Detailed prompt for 1200x480 X/Twitter banner. MUST include: 'Large bold text ${input.ticker} centered prominently, social media header style, leave left 200px space for profile picture, high contrast for text visibility, [visual style details]'",
  "heroBackgroundPrompt": "Detailed prompt for 1920x1080 hero background (atmospheric, not too busy, leaves space for text overlay)",
  "featureIconPrompt": "Detailed prompt for 256x256 feature icon (simple, iconic, matches brand style)",
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

Remember: The ticker text "${input.ticker}" (without $) MUST be clearly visible and centered in both banner prompts. This is non-negotiable for marketing effectiveness.`;

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
  const prompt = `Generate ONLY the HTML structure for a meme coin landing page. No CSS, no JavaScript.

**PROJECT:** ${input.projectName} (${input.ticker})
**CONTENT:**
- Headline: ${input.websiteContent.headline}
- Tagline: ${input.websiteContent.tagline}
- About: ${input.websiteContent.about}
- Features: ${input.websiteContent.features.join(", ")}

**IMAGES (use these exact URLs):**
- Logo: ${input.logoUrl} (user's original uploaded image - DO NOT replace)
- Hero BG: ${input.heroBackgroundUrl} (MUST be prominently visible as hero section background)
- Community Scene: ${input.communitySceneUrl || ''} (use in About/Community section)
- Feature Icon: ${input.featureIconUrl}
- PayDex Banner: ${input.paydexBannerUrl} (for download only, NOT for display in main content)
- X Banner: ${input.xBannerUrl} (for download only, NOT for display in main content)

**STRUCTURE:**
1. Hero section:
   - Logo in navbar (use logoUrl directly)
   - Hero background image MUST be visible (use heroBackgroundUrl as <img> or background-image)
   - Headline, tagline, CTA buttons
2. About section:
   - Community scene image (use communitySceneUrl)
   - Project description
3. Features section:
   - 3 feature cards with icons (use featureIconUrl)
4. Tokenomics section:
   - Supply: ${input.websiteContent.tokenomics.totalSupply}
   - Distribution: ${input.websiteContent.tokenomics.distribution}
5. Community section:
   - Social links (Twitter/X, Telegram, Discord)
   - Final CTA
6. Footer:
   - Download buttons for marketing assets (PayDex Banner, X Banner)
   - These banners are for DOWNLOAD only, not for display

**CRITICAL RULES:**
- Logo MUST use the exact logoUrl provided (user's original image)
- Hero background MUST be clearly visible, not hidden by overlays
- Banners (PayDex, X) are download assets, NOT display elements
- All images must use max-width: 100% for responsive sizing

Return ONLY semantic HTML5 with proper tags, IDs, and classes. No inline styles.`;

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

${htmlStructure.substring(0, 3000)}...

**DESIGN SYSTEM:**
- Primary: ${input.colorScheme.primary}
- Secondary: ${input.colorScheme.secondary}
- Accent: ${input.colorScheme.accent}
- Personality: ${input.brandStrategy.personality}
- Visual Style: ${input.brandStrategy.visualStyle}

**REQUIREMENTS:**
- Responsive (mobile-first, breakpoints: 640px, 768px, 1024px, 1280px)
- Smooth animations (fade-in on scroll, hover effects, parallax)
- Modern typography matching visual style
- High-conversion CTAs

**CRITICAL CSS RULES:**
1. HERO BACKGROUND VISIBILITY:
   - The hero background image MUST be clearly visible
   - If using overlay/gradient on hero, opacity MUST NOT exceed 0.4 (40%)
   - Example: background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(...);
   - DO NOT use solid colors or opaque gradients that hide the background image

2. IMAGE RESPONSIVENESS:
   - All images MUST have: max-width: 100%; height: auto;
   - Banners and large images must NEVER overflow the viewport
   - Use object-fit: cover for background images

3. BANNER DOWNLOAD SECTION:
   - Banner images in footer/download section should be contained within viewport width
   - Use a container with max-width and center alignment

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

**FEATURES:**
1. Smooth scroll navigation
2. Fade-in on scroll animations
3. Copy contract address to clipboard
4. Download marketing assets
5. Lazy load images

Return ONLY the JavaScript code inside <script> tags. Keep it minimal and performant.`;

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
    <style>
${cssCode}
    </style>
</head>
<body>
${bodyContent}
    <script>
${jsCode}
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
