/**
 * Claude API integration for intelligent coordination
 * 
 * This module uses Claude 3.7 Sonnet to:
 * 1. Analyze user input and extract key information
 * 2. Generate optimized prompts for Nanobanana image generation
 * 3. Generate website HTML/CSS/JavaScript code
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
 */
export async function analyzeProjectInput(input: {
  projectName: string;
  ticker: string;
  description: string;
  memeImageUrl?: string;
}): Promise<{
  bannerPrompt: string;
  logoPrompt: string;
  posterPrompt: string;
  websiteTheme: {
    primaryColor: string;
    secondaryColor: string;
    style: string;
  };
  contentSuggestions: {
    headline: string;
    tagline: string;
    features: string[];
  };
}> {
  const prompt = `You are an expert in meme coin branding and web design. Analyze the following meme project information and generate optimized prompts and design recommendations.

Project Information:
- Name: ${input.projectName}
- Ticker: ${input.ticker}
- Description: ${input.description}
${input.memeImageUrl ? `- Meme Image: ${input.memeImageUrl}` : ""}

Please provide:
1. A detailed prompt for generating a banner image (1200x400px, vibrant, eye-catching)
2. A detailed prompt for generating a logo (512x512px, clean, memorable)
3. A detailed prompt for generating a poster (800x1200px, promotional, engaging)
4. Website theme recommendations (colors and style)
5. Content suggestions (headline, tagline, key features)

Return your response in JSON format:
{
  "bannerPrompt": "...",
  "logoPrompt": "...",
  "posterPrompt": "...",
  "websiteTheme": {
    "primaryColor": "#hex",
    "secondaryColor": "#hex",
    "style": "modern/playful/professional/etc"
  },
  "contentSuggestions": {
    "headline": "...",
    "tagline": "...",
    "features": ["...", "...", "..."]
  }
}`;

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
    maxTokens: 2048,
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
 */
export async function generateWebsiteCode(input: {
  projectName: string;
  ticker: string;
  description: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    style: string;
  };
  content: {
    headline: string;
    tagline: string;
    features: string[];
  };
  bannerUrl: string;
  logoUrl: string;
  posterUrl: string;
}): Promise<string> {
  const prompt = `You are an expert web developer. Generate a complete, modern, responsive single-page website for a meme coin project.

Project Information:
- Name: ${input.projectName}
- Ticker: ${input.ticker}
- Description: ${input.description}
- Headline: ${input.content.headline}
- Tagline: ${input.content.tagline}
- Features: ${input.content.features.join(", ")}

Design Theme:
- Primary Color: ${input.theme.primaryColor}
- Secondary Color: ${input.theme.secondaryColor}
- Style: ${input.theme.style}

Assets:
- Banner: ${input.bannerUrl}
- Logo: ${input.logoUrl}
- Poster: ${input.posterUrl}

Requirements:
1. Modern, responsive design that works on mobile and desktop
2. Use the provided colors and style
3. Include sections: Hero (with banner), About, Features, Tokenomics, Roadmap, Community
4. Add smooth scrolling and animations
5. Include social media links placeholders
6. Use modern CSS (flexbox/grid) and vanilla JavaScript (no frameworks)
7. Make it visually stunning and professional
8. Optimize for fast loading

Generate a complete HTML file with inline CSS and JavaScript. Return ONLY the HTML code, no explanations.`;

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
 * Enhance user's project description using Claude Sonnet 3.7
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
