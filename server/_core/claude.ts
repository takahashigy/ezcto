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
}): Promise<{
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
  featureIconPrompts: string[];
  communityScenePrompt: string;
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
  "logoPrompt": "Detailed prompt for 512x512 logo (clean, memorable, works at small sizes)",
  "heroBackgroundPrompt": "Detailed prompt for 1920x1080 hero background (atmospheric, not too busy, leaves space for text overlay)",
  "featureIconPrompts": [
    "Prompt for first 256x256 feature icon (simple, iconic, matches brand style)",
    "Prompt for second 256x256 feature icon",
    "Prompt for third 256x256 feature icon"
  ],
  "communityScenePrompt": "Detailed prompt for 800x600 community scene (shows community vibe, welcoming, energetic)",
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
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude response as JSON");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate website HTML/CSS/JavaScript code
 * Uses Claude Opus 4.5 for high-quality code generation
 */
export async function generateWebsiteCode(input: {
  projectName: string;
  ticker: string;
  description: string;
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
  logoUrl: string;
  heroBackgroundUrl: string;
  featureIconUrls: string[];
  communitySceneUrl: string;
}): Promise<string> {
  const prompt = `You are a world-class full-stack developer specializing in high-conversion meme coin landing pages. Your mission is to create a stunning, professional single-page website that maximizes user engagement and drives action.

**YOUR IDENTITY & MISSION:**
You are not just generating code—you are crafting a marketing masterpiece. Every pixel, every animation, every word placement must work together to create an irresistible user experience that converts visitors into community members.

**PROJECT INFORMATION:**
- Name: ${input.projectName}
- Ticker: ${input.ticker}
- Description: ${input.description}
- Brand Personality: ${input.brandStrategy.personality}
- Visual Style: ${input.brandStrategy.visualStyle}

**DESIGN SYSTEM:**
Colors:
- Primary: ${input.colorScheme.primary}
- Secondary: ${input.colorScheme.secondary}
- Accent: ${input.colorScheme.accent}

Content:
- Headline: ${input.websiteContent.headline}
- Tagline: ${input.websiteContent.tagline}
- About: ${input.websiteContent.about}
- Features: ${input.websiteContent.features.join(", ")}
- Total Supply: ${input.websiteContent.tokenomics.totalSupply}
- Distribution: ${input.websiteContent.tokenomics.distribution}

**AVAILABLE VISUAL ASSETS (use ALL of them intelligently):**
1. PayDex Banner (1500x500): ${input.paydexBannerUrl}
2. X/Twitter Banner (1200x480): ${input.xBannerUrl}
3. Logo (512x512): ${input.logoUrl}
4. Hero Background (1920x1080): ${input.heroBackgroundUrl}
5. Feature Icons (256x256): ${input.featureIconUrls.join(", ")}
6. Community Scene (800x600): ${input.communitySceneUrl}

**MANDATORY STRUCTURE & IMAGE USAGE:**

1. **Hero Section** (full viewport height)
   - Background: Use heroBackgroundUrl with overlay
   - Logo: Display logoUrl prominently
   - Headline + Tagline
   - Primary CTA button: "Buy ${input.ticker}"
   - Secondary CTA: "Join Community"

2. **About Section**
   - Use communitySceneUrl as a decorative element
   - Display the about text
   - Show ticker and total supply

3. **Features Section**
   - Create 3 feature cards
   - Each card uses one icon from featureIconUrls
   - Display feature text from websiteContent.features

4. **Tokenomics Section**
   - Visual distribution chart (use CSS, not canvas)
   - Total supply and distribution info

5. **Marketing Assets Gallery Section**
   - Display PayDex banner with download button
   - Display X/Twitter banner with download button
   - Add "Download Marketing Kit" button that downloads both

6. **Community Section**
   - Social media links (Twitter, Telegram, Discord placeholders)
   - Final CTA

**TECHNICAL REQUIREMENTS:**

1. **Responsive Design**
   - Mobile-first approach
   - Breakpoints: 640px, 768px, 1024px, 1280px
   - All images must be responsive

2. **Performance**
   - Lazy load images below the fold
   - Optimize CSS (no unused rules)
   - Minimize JavaScript

3. **Animations**
   - Smooth scroll behavior
   - Fade-in on scroll for sections
   - Hover effects on buttons and cards
   - Subtle parallax on hero background

4. **Interactivity**
   - Copy contract address on click
   - Download buttons for marketing assets
   - Smooth navigation

5. **SEO & Meta**
   - Proper meta tags (title, description, og:image)
   - Semantic HTML5
   - Structured data (JSON-LD)

**STYLE GUIDELINES:**

- Match the brand personality (${input.brandStrategy.personality})
- Follow the visual style (${input.brandStrategy.visualStyle})
- Use the provided color scheme consistently
- Typography: Choose fonts that match the visual style
- Spacing: Generous whitespace, clear visual hierarchy
- CTAs: Make them impossible to miss

**OUTPUT FORMAT:**

Generate a complete, production-ready HTML file with:
- Inline CSS in <style> tags
- Inline JavaScript in <script> tags
- All images referenced by URL
- No external dependencies (except fonts from Google Fonts if needed)

Return ONLY the complete HTML code, starting with <!DOCTYPE html> and ending with </html>. No explanations, no markdown code blocks, just pure HTML.

Create a website that doesn't just look good—it CONVERTS. Make every visitor want to join this community.`;

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
    model: "claude-opus-4-5-20251101", // Use Opus for high-quality code generation
    temperature: 0.7,
    maxTokens: 8192,
    apiKey: opusApiKey, // Use dedicated Opus API key
  });

  // Extract HTML code
  const htmlMatch = response.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
  if (!htmlMatch) {
    // If no DOCTYPE found, try to find html tags
    const htmlTagMatch = response.match(/<html[\s\S]*<\/html>/i);
    if (htmlTagMatch) {
      return htmlTagMatch[0];
    }
    throw new Error("Failed to extract HTML code from Claude response");
  }
  
  return htmlMatch[0];
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
