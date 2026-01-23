import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import fs from "fs/promises";
import path from "path";

/**
 * Launch自动化引擎核心逻辑
 * 生成完整的Meme项目启动资产包
 */

export interface LaunchInput {
  projectId: number;
  name: string;
  description?: string;
  ticker?: string;
  styleTemplate?: string;
}

export interface LaunchOutput {
  projectId: number;
  assets: {
    logo?: string;
    banner?: string;
    pfp?: string;
    poster?: string;
    narrative?: string;
    whitepaper?: string;
    tweets?: string[];
    website?: string;
  };
  status: "completed" | "failed";
  error?: string;
}

/**
 * 生成Logo
 */
async function generateLogo(input: LaunchInput): Promise<string> {
  const styleDescriptions: Record<string, string> = {
    retro_gaming: "8-bit pixel art style, neon colors, arcade vibes, retro gaming aesthetic",
    cyberpunk: "cyberpunk style, red and black colors, futuristic tech, neon aesthetics",
    minimalist: "minimalist style, clean lines, monochrome, modern simplicity",
    internet_meme: "hand-drawn cartoon style, playful characters, internet meme culture",
  };

  const styleDesc = styleDescriptions[input.styleTemplate || "retro_gaming"] || "modern crypto meme style";

  const prompt = `Create a professional logo for a Meme cryptocurrency project named "${input.name}"${input.ticker ? ` ($${input.ticker})` : ""}. 
Style: ${styleDesc}
${input.description ? `Project concept: ${input.description}` : ""}
The logo should be iconic, memorable, and suitable for crypto/meme culture. Clean background, centered composition, square format.`;

  const result = await generateImage({ prompt });
  return result.url || "";
}

/**
 * 生成Banner
 */
async function generateBanner(input: LaunchInput): Promise<string> {
  const styleDescriptions: Record<string, string> = {
    retro_gaming: "8-bit pixel art style, neon colors, arcade vibes, retro gaming aesthetic",
    cyberpunk: "cyberpunk style, red and black colors, futuristic tech, neon aesthetics",
    minimalist: "minimalist style, clean lines, monochrome, modern simplicity",
    internet_meme: "hand-drawn cartoon style, playful characters, internet meme culture",
  };

  const styleDesc = styleDescriptions[input.styleTemplate || "retro_gaming"] || "modern crypto meme style";

  const prompt = `Create a Twitter/X banner image for a Meme cryptocurrency project named "${input.name}"${input.ticker ? ` ($${input.ticker})` : ""}. 
Style: ${styleDesc}
${input.description ? `Project concept: ${input.description}` : ""}
The banner should be eye-catching, professional, and convey the project's energy. Include project name prominently. Wide horizontal format, 1500x500 pixels, suitable for Twitter/X header.`;

  const result = await generateImage({ prompt });
  return result.url || "";
}

/**
 * 生成PFP (Profile Picture)
 */
async function generatePFP(input: LaunchInput): Promise<string> {
  const prompt = `Create a profile picture (PFP) avatar for a Meme cryptocurrency project named "${input.name}"${input.ticker ? ` (${input.ticker})` : ""}. 
Style: ${input.styleTemplate || "pixel_punk"}. 
${input.description ? `Project concept: ${input.description}` : ""}
The PFP should be a character or mascot that represents the project. Square format, centered, clean background.`;

  const result = await generateImage({ prompt });
  return result.url || "";
}

/**
 * 生成Poster
 */
async function generatePoster(input: LaunchInput): Promise<string> {
  const prompt = `Create a promotional poster for a Meme cryptocurrency project named "${input.name}"${input.ticker ? ` (${input.ticker})` : ""}. 
Style: ${input.styleTemplate || "pixel_punk"}. 
${input.description ? `Project concept: ${input.description}` : ""}
The poster should be suitable for social media sharing, include key visual elements, and create hype. Vertical format.`;

  const result = await generateImage({ prompt });
  return result.url || "";
}

/**
 * 生成项目叙事文案
 */
async function generateNarrative(input: LaunchInput): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a professional crypto/meme project copywriter. Write compelling, concise narratives that capture attention and build community.",
      },
      {
        role: "user",
        content: `Create a compelling project narrative for a Meme cryptocurrency project:
Name: ${input.name}
${input.ticker ? `Ticker: ${input.ticker}` : ""}
${input.description ? `Description: ${input.description}` : ""}

Write a 200-300 word narrative that:
1. Captures the project's essence and vision
2. Explains why it matters to the community
3. Creates emotional connection
4. Builds excitement and FOMO

Use meme culture language, be authentic, and make it shareable.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return typeof content === 'string' ? content : "";
}

/**
 * 生成白皮书草稿
 */
async function generateWhitepaper(input: LaunchInput): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a professional crypto whitepaper writer. Create structured, informative documents that balance technical credibility with accessibility.",
      },
      {
        role: "user",
        content: `Create a whitepaper draft for a Meme cryptocurrency project:
Name: ${input.name}
${input.ticker ? `Ticker: ${input.ticker}` : ""}
${input.description ? `Description: ${input.description}` : ""}

Structure:
1. Executive Summary
2. Vision & Mission
3. Tokenomics Overview
4. Community & Governance
5. Roadmap
6. Conclusion

Keep it concise (1000-1500 words), professional yet accessible. Focus on community value and long-term vision.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return typeof content === 'string' ? content : "";
}

/**
 * 生成Launch推文（5条）
 */
async function generateTweets(input: LaunchInput): Promise<string[]> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a viral crypto Twitter strategist. Write tweets that get engagement, build hype, and grow communities.",
      },
      {
        role: "user",
        content: `Create 5 launch tweets for a Meme cryptocurrency project:
Name: ${input.name}
${input.ticker ? `Ticker: ${input.ticker}` : ""}
${input.description ? `Description: ${input.description}` : ""}

Each tweet should:
- Be 200-280 characters
- Include relevant emojis
- Create excitement and urgency
- Be shareable and engaging
- Vary in style (announcement, teaser, community call, value prop, CTA)

Return as a JSON array of strings.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "tweets",
        strict: true,
        schema: {
          type: "object",
          properties: {
            tweets: {
              type: "array",
              items: { type: "string" },
              minItems: 5,
              maxItems: 5,
            },
          },
          required: ["tweets"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    console.warn('[generateTweets] No valid content returned from LLM');
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    return parsed.tweets || [];
  } catch {
    return [];
  }
}

/**
 * 生成Landing Page HTML
 * 使用预设模版 + AI定制化内容
 */
async function generateWebsite(input: LaunchInput): Promise<string> {
  // 映射styleTemplate到模版文件名
  const templateMap: Record<string, string> = {
    retro_gaming: "retro-gaming.html",
    cyberpunk: "cyberpunk.html",
    minimalist: "minimalist.html",
    internet_meme: "internet-meme.html",
  };

  const templateFile = templateMap[input.styleTemplate || "retro_gaming"] || "retro-gaming.html";
  const templatePath = path.join(process.cwd(), "client", "public", "templates", templateFile);

  try {
    // 读取模版文件
    let template = await fs.readFile(templatePath, "utf-8");

    // 使用AI生成项目特定的内容
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional crypto copywriter. Generate concise, engaging content for meme token websites.",
        },
        {
          role: "user",
          content: `Generate website content for a Meme cryptocurrency project:
Name: ${input.name}
${input.ticker ? `Ticker: ${input.ticker}` : ""}
${input.description ? `Description: ${input.description}` : ""}

Generate:
1. A catchy hero tagline (10-15 words)
2. A brief project description (30-50 words)
3. Three feature titles and descriptions
4. Tokenomics summary (supply, distribution)

Return as JSON.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "website_content",
          strict: true,
          schema: {
            type: "object",
            properties: {
              heroTagline: { type: "string" },
              description: { type: "string" },
              features: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["title", "description"],
                  additionalProperties: false,
                },
                minItems: 3,
                maxItems: 3,
              },
              tokenomics: {
                type: "object",
                properties: {
                  totalSupply: { type: "string" },
                  distribution: { type: "string" },
                },
                required: ["totalSupply", "distribution"],
                additionalProperties: false,
              },
            },
            required: ["heroTagline", "description", "features", "tokenomics"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      console.warn('[generateWebsite] No valid content returned from LLM, using template as-is');
      return template; // 返回原始模版作为fallback
    }

    const generatedContent = JSON.parse(content);

    // 替换模版中的占位符
    template = template.replace(/\{\{PROJECT_NAME\}\}/g, input.name);
    template = template.replace(/\{\{TICKER\}\}/g, input.ticker || input.name);
    template = template.replace(/\{\{HERO_TAGLINE\}\}/g, generatedContent.heroTagline);
    template = template.replace(/\{\{DESCRIPTION\}\}/g, generatedContent.description);
    
    // 注意：更复杂的替换（如features数组）需要更精细的模版引擎
    // 这里先返回基础替换的版本
    
    return template;
  } catch (error) {
    console.error("[generateWebsite] Error:", error);
    // Fallback: 使用AI从零生成
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional web developer. Create clean, modern, responsive HTML landing pages.",
        },
        {
          role: "user",
          content: `Create a single-page HTML landing page for: ${input.name}. Include inline CSS, responsive design, and sections for Hero, About, Tokenomics, Community.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : "";
  }
}

/**
 * 主函数：执行完整的Launch自动化流程
 */
export async function executeLaunch(input: LaunchInput): Promise<LaunchOutput> {
  try {
    // 更新项目状态为generating
    await db.updateProjectStatus(input.projectId, "generating");

    const assets: LaunchOutput["assets"] = {};

    // 并行生成视觉资产
    const [logo, banner, pfp, poster] = await Promise.all([
      generateLogo(input),
      generateBanner(input),
      generatePFP(input),
      generatePoster(input),
    ]);

    assets.logo = logo;
    assets.banner = banner;
    assets.pfp = pfp;
    assets.poster = poster;

    // 保存视觉资产到数据库
    await Promise.all([
      db.createAsset({ projectId: input.projectId, assetType: "logo", fileUrl: logo }),
      db.createAsset({ projectId: input.projectId, assetType: "banner", fileUrl: banner }),
      db.createAsset({ projectId: input.projectId, assetType: "pfp", fileUrl: pfp }),
      db.createAsset({ projectId: input.projectId, assetType: "poster", fileUrl: poster }),
    ]);

    // 生成文案资产
    const [narrative, whitepaper, tweets, website] = await Promise.all([
      generateNarrative(input),
      generateWhitepaper(input),
      generateTweets(input),
      generateWebsite(input),
    ]);

    assets.narrative = narrative;
    assets.whitepaper = whitepaper;
    assets.tweets = tweets;
    assets.website = website;

    // 保存文案资产到数据库
    await Promise.all([
      db.createAsset({ projectId: input.projectId, assetType: "narrative", textContent: narrative }),
      db.createAsset({ projectId: input.projectId, assetType: "whitepaper", textContent: whitepaper }),
      db.createAsset({ projectId: input.projectId, assetType: "tweet", textContent: tweets.join("\n\n---\n\n") }),
      db.createAsset({ projectId: input.projectId, assetType: "website", textContent: website }),
    ]);

    // 更新项目状态为completed
    await db.updateProjectStatus(input.projectId, "completed");

    return {
      projectId: input.projectId,
      assets,
      status: "completed",
    };
  } catch (error) {
    console.error("[Launch] Generation failed:", error);
    
    // 更新项目状态为failed
    await db.updateProjectStatus(input.projectId, "failed");

    return {
      projectId: input.projectId,
      assets: {},
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
