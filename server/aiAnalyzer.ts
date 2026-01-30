/**
 * AI Analysis Engine
 * Analyzes user's meme image and project description to determine:
 * - Narrative type (community, tech, culture, gaming)
 * - Layout style (minimal, playful, cyberpunk, retro)
 * - Color palette
 * - Vibe/mood
 */

import { invokeLLM } from "./_core/llm";

export interface ProjectAnalysis {
  narrativeType: "community" | "tech" | "culture" | "gaming";
  layoutStyle: "minimal" | "playful" | "cyberpunk" | "retro";
  colorPalette: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  vibe: "friendly" | "edgy" | "mysterious" | "energetic";
  targetAudience: string;
}

export async function analyzeProject(
  memeImageUrl: string,
  projectName: string,
  ticker: string,
  description: string
): Promise<ProjectAnalysis> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a Meme project analysis expert. Analyze the user's meme image and project description to determine the best website design strategy.

Consider:
1. Narrative Type: What story does this meme tell?
   - community: Cute, friendly, community-driven (like Doge)
   - tech: Futuristic, innovative, technology-focused (like AI agents)
   - culture: Cultural meme, internet culture reference (like Pepe, Wojak)
   - gaming: Game-related, playful, gamified (like GameFi projects)

2. Layout Style: What visual style matches this project?
   - minimal: Clean, simple, lots of whitespace (like Popcat)
   - playful: Fun, colorful, hand-drawn elements (like Wojak)
   - cyberpunk: Dark, neon, futuristic (like Neonverse)
   - retro: Nostalgic, pixel art, terminal-style (like Fartcoin)

3. Color Palette: Extract or recommend colors that match the meme's vibe
   - primary: Main brand color
   - secondary: Accent/highlight color
   - background: Page background
   - text: Main text color
   - accent: Special elements color

4. Vibe: Overall emotional tone
   - friendly: Warm, welcoming, approachable
   - edgy: Bold, rebellious, provocative
   - mysterious: Dark, intriguing, enigmatic
   - energetic: Dynamic, exciting, high-energy

5. Target Audience: Who is this meme for? (brief description)`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Project Name: ${projectName}
Ticker: ${ticker}
Description: ${description}

Analyze the meme image and provide a comprehensive design strategy.`,
          },
          {
            type: "image_url",
            image_url: {
              url: memeImageUrl,
              detail: "high",
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "project_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            narrativeType: {
              type: "string",
              enum: ["community", "tech", "culture", "gaming"],
              description: "The narrative category that best fits this project",
            },
            layoutStyle: {
              type: "string",
              enum: ["minimal", "playful", "cyberpunk", "retro"],
              description: "The visual layout style that matches the project",
            },
            colorPalette: {
              type: "object",
              properties: {
                primary: {
                  type: "string",
                  description: "Primary brand color (hex code)",
                },
                secondary: {
                  type: "string",
                  description: "Secondary accent color (hex code)",
                },
                background: {
                  type: "string",
                  description: "Page background color (hex code)",
                },
                text: {
                  type: "string",
                  description: "Main text color (hex code)",
                },
                accent: {
                  type: "string",
                  description: "Special elements color (hex code)",
                },
              },
              required: ["primary", "secondary", "background", "text", "accent"],
              additionalProperties: false,
            },
            vibe: {
              type: "string",
              enum: ["friendly", "edgy", "mysterious", "energetic"],
              description: "Overall emotional tone of the project",
            },
            targetAudience: {
              type: "string",
              description: "Brief description of the target audience (1 sentence)",
            },
          },
          required: [
            "narrativeType",
            "layoutStyle",
            "colorPalette",
            "vibe",
            "targetAudience",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (!content || typeof content !== "string") {
    throw new Error("Invalid AI response format");
  }
  
  const analysis = JSON.parse(content) as ProjectAnalysis;

  return analysis;
}
