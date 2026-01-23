import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

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
  const prompt = `Create a professional logo for a Meme cryptocurrency project named "${input.name}"${input.ticker ? ` (${input.ticker})` : ""}. 
Style: ${input.styleTemplate || "pixel_punk"}. 
${input.description ? `Project concept: ${input.description}` : ""}
The logo should be iconic, memorable, and suitable for crypto/meme culture. Clean background, centered composition.`;

  const result = await generateImage({ prompt });
  return result.url || "";
}

/**
 * 生成Banner
 */
async function generateBanner(input: LaunchInput): Promise<string> {
  const prompt = `Create a Twitter/X banner (1500x500) for a Meme cryptocurrency project named "${input.name}"${input.ticker ? ` (${input.ticker})` : ""}. 
Style: ${input.styleTemplate || "pixel_punk"}. 
${input.description ? `Project concept: ${input.description}` : ""}
The banner should be eye-catching, professional, and convey the project's energy. Include project name prominently.`;

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

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') return [];

  try {
    const parsed = JSON.parse(content);
    return parsed.tweets || [];
  } catch {
    return [];
  }
}

/**
 * 生成Landing Page HTML
 */
async function generateWebsite(input: LaunchInput): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a professional web developer. Create clean, modern, responsive HTML landing pages.",
      },
      {
        role: "user",
        content: `Create a single-page HTML landing page for a Meme cryptocurrency project:
Name: ${input.name}
${input.ticker ? `Ticker: ${input.ticker}` : ""}
${input.description ? `Description: ${input.description}` : ""}

Requirements:
- Single HTML file with inline CSS
- Responsive design
- Modern, clean aesthetic
- Sections: Hero, About, Tokenomics, Roadmap, Community
- Include social media placeholders
- Meme-friendly but professional

Return only the complete HTML code.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return typeof content === 'string' ? content : "";
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
