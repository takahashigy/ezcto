/**
 * 风格适配系统
 * 为每个模版定义详细的风格描述，确保AI生成的图片与模版风格一致
 */

export const STYLE_PROMPTS = {
  retro_gaming: {
    name: "Terminal Hacker",
    description: "8-bit pixel art style, neon green matrix code, hacker terminal aesthetic, retro arcade vibes, black background with green accents",
    colors: ["#000000", "#00FF00", "#00FF41", "#0A0E27"],
    mood: "cyberpunk, tech-focused, mysterious, hacker culture",
  },
  cyberpunk: {
    name: "Comic Book",
    description: "cartoon comic book style, hand-drawn decorations, vibrant colors, playful meme culture, bold outlines, pop art influences",
    colors: ["#00BFFF", "#FFD700", "#FF6B9D", "#FFFFFF"],
    mood: "fun, energetic, community-driven, meme-friendly",
  },
  minimalist: {
    name: "Wojak Style",
    description: "sky blue background, hand-drawn cartoon style, cute decorative elements (clouds, stars, coins), simple line art, emotional expression",
    colors: ["#00BFFF", "#FFD700", "#FFFFFF", "#000000"],
    mood: "relatable, emotional, internet culture, wholesome",
  },
  internet_meme: {
    name: "Labubu Style",
    description: "dark background with white canvas, dashed grid system, pixel art style, yellow and blue accents, geometric shapes, modern digital aesthetic",
    colors: ["#0A0E1A", "#FFFFFF", "#FFD700", "#00BFFF"],
    mood: "cute, modern, artistic, design-focused",
  },
} as const;

export type StyleTemplate = keyof typeof STYLE_PROMPTS;

/**
 * 获取风格描述
 */
export function getStyleDescription(template?: string): string {
  const style = STYLE_PROMPTS[template as StyleTemplate] || STYLE_PROMPTS.retro_gaming;
  return `${style.description}. Color palette: ${style.colors.join(", ")}. Mood: ${style.mood}.`;
}

/**
 * 为Logo生成优化的Prompt
 */
export function getLogoPrompt(
  projectName: string,
  ticker: string | undefined,
  styleTemplate: string | undefined,
  description?: string
): string {
  const styleDesc = getStyleDescription(styleTemplate);
  
  return `Transform this character/meme into a professional logo icon for "${projectName}"${ticker ? ` ($${ticker})` : ""}.

Style requirements: ${styleDesc}

Design specifications:
- Square format (1:1 ratio)
- Keep the character recognizable but adapt it to match the style
- Simplify details for icon use - should be clear at small sizes
- Bold shapes and clean lines
- Centered composition
- Transparent or solid color background matching the style

${description ? `Project concept: ${description}` : ""}

The logo should capture the character's personality while fitting perfectly into the ${STYLE_PROMPTS[styleTemplate as StyleTemplate]?.name || "chosen"} aesthetic.`;
}

/**
 * 为Banner生成优化的Prompt
 */
export function getBannerPrompt(
  projectName: string,
  ticker: string | undefined,
  styleTemplate: string | undefined,
  description?: string
): string {
  const styleDesc = getStyleDescription(styleTemplate);
  
  return `Create a Twitter/X banner image featuring this character for "${projectName}"${ticker ? ` ($${ticker})` : ""}.

Style requirements: ${styleDesc}

Layout specifications:
- Wide horizontal format: 1500x500 pixels
- Character positioned on left or right side (not center)
- Project name "${projectName}" prominently displayed in large text
- ${ticker ? `Include ticker symbol "$${ticker}" in a visible location` : ""}
- Add decorative elements that match the style (stars, coins, geometric shapes, etc.)
- Background should match the template's color palette and aesthetic

${description ? `Project concept: ${description}` : ""}

The banner should be eye-catching, professional, and immediately convey the project's energy and style.`;
}

/**
 * 为PFP生成优化的Prompt
 */
export function getPFPPrompt(
  projectName: string,
  ticker: string | undefined,
  styleTemplate: string | undefined,
  description?: string
): string {
  const styleDesc = getStyleDescription(styleTemplate);
  
  return `Create a profile picture (PFP) avatar from this character for "${projectName}"${ticker ? ` ($${ticker})` : ""}.

Style requirements: ${styleDesc}

Design specifications:
- Square format but designed for circular crop (important!)
- Focus on face/upper body - should be recognizable in small circular format
- Character should be centered and facing forward
- Zoom in closer than the original image for better visibility
- Background should be simple and match the style's color palette
- High contrast to ensure visibility at small sizes

${description ? `Project concept: ${description}` : ""}

Remember: This will be displayed as a circular avatar, so keep important elements in the center circle area.`;
}

/**
 * 为Poster生成优化的Prompt
 */
export function getPosterPrompt(
  projectName: string,
  ticker: string | undefined,
  styleTemplate: string | undefined,
  description?: string
): string {
  const styleDesc = getStyleDescription(styleTemplate);
  
  return `Create a promotional poster featuring this character for "${projectName}"${ticker ? ` ($${ticker})` : ""}.

Style requirements: ${styleDesc}

Design specifications:
- Vertical format (suitable for social media sharing)
- Character as the main focal point
- Project name "${projectName}" in large, bold text
- ${ticker ? `Ticker symbol "$${ticker}" prominently displayed` : ""}
- Add hype-building elements: "TO THE MOON", "JOIN US", or similar messaging
- Include decorative elements matching the style
- Background should create excitement and energy

${description ? `Project concept: ${description}` : ""}

The poster should create FOMO and excitement, making people want to join the community immediately.`;
}

/**
 * 为网站Hero图生成优化的Prompt
 */
export function getHeroImagePrompt(
  projectName: string,
  ticker: string | undefined,
  styleTemplate: string | undefined,
  description?: string
): string {
  const styleDesc = getStyleDescription(styleTemplate);
  
  return `Create a website hero image featuring this character for "${projectName}"${ticker ? ` ($${ticker})` : ""}.

Style requirements: ${styleDesc}

Design specifications:
- Horizontal format suitable for website hero section
- Character should be the main focal point, positioned prominently
- Background and decorative elements should match the ${STYLE_PROMPTS[styleTemplate as StyleTemplate]?.name || "chosen"} template aesthetic
- Include visual elements that complement the template design (grid lines, geometric shapes, decorative icons)
- High quality and visually striking
- Should work well as a website header image

${description ? `Project concept: ${description}` : ""}

The image should immediately capture attention and set the tone for the entire website.`;
}
