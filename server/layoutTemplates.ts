/**
 * Layout Templates Configuration
 * 
 * Defines multiple layout templates with different:
 * - Section ordering
 * - Banner usage (as dividers, backgrounds, etc.)
 * - Visual rhythm and spacing
 * - Hero styles
 */

export type LayoutTemplateName = 
  | 'classic'           // Traditional: Hero → About → Features → Community
  | 'banner-split'      // Uses banners as section dividers
  | 'story-driven'      // Narrative flow: Hero → Story → Gallery → Community
  | 'minimal-focus'     // Ultra minimal: Hero → CA → Social
  | 'feature-first'     // Features prominent: Hero → Features → About → Community
  | 'gallery-showcase'  // Visual heavy: Hero → Gallery → About → Community
  | 'dark-cyberpunk'    // 暗黑赛博朋克: Neon accents, dark bg, glitch effects
  | 'retro-pixel';      // 复古像素风: Pixel art style, terminal aesthetic

export interface LayoutSection {
  id: string;
  type: 'hero' | 'about' | 'features' | 'tokenomics' | 'community' | 'gallery' | 'banner-divider' | 'story' | 'cta' | 'footer';
  // How to use banner in this section
  bannerUsage?: 'none' | 'background' | 'divider-above' | 'divider-below' | 'inline-decoration' | 'footer-decoration';
  // Section-specific styling hints
  style?: {
    fullWidth?: boolean;
    darkOverlay?: boolean;
    parallax?: boolean;
    centered?: boolean;
  };
}

export interface LayoutTemplate {
  name: LayoutTemplateName;
  description: string;
  // Which vibes/narratives this template works best with
  bestFor: {
    vibes: Array<'friendly' | 'edgy' | 'mysterious' | 'energetic'>;
    narratives: Array<'community' | 'tech' | 'culture' | 'gaming'>;
  };
  // Section order and configuration
  sections: LayoutSection[];
  // Hero style variant
  heroStyle: 'centered' | 'split-left' | 'split-right' | 'fullscreen-bg' | 'minimal-top';
  // How to handle the banner asset
  bannerStrategy: 'hero-only' | 'divider' | 'background-accent' | 'gallery-item' | 'footer-decoration';
}

/**
 * All available layout templates
 */
export const LAYOUT_TEMPLATES: Record<LayoutTemplateName, LayoutTemplate> = {
  'classic': {
    name: 'classic',
    description: 'Traditional meme coin layout with clear sections',
    bestFor: {
      vibes: ['friendly', 'energetic'],
      narratives: ['community', 'tech'],
    },
    sections: [
      { id: 'hero', type: 'hero', bannerUsage: 'none' },
      { id: 'about', type: 'about', bannerUsage: 'none' },
      { id: 'features', type: 'features', bannerUsage: 'none' },
      { id: 'tokenomics', type: 'tokenomics', bannerUsage: 'none' },
      { id: 'community', type: 'community', bannerUsage: 'none' },
      { id: 'banners', type: 'gallery', bannerUsage: 'inline-decoration' },
      { id: 'footer', type: 'footer', bannerUsage: 'none' },
    ],
    heroStyle: 'centered',
    bannerStrategy: 'gallery-item',
  },

  'banner-split': {
    name: 'banner-split',
    description: 'Uses banners as visual dividers between sections',
    bestFor: {
      vibes: ['edgy', 'energetic'],
      narratives: ['culture', 'gaming'],
    },
    sections: [
      { id: 'hero', type: 'hero', bannerUsage: 'none' },
      { id: 'divider-1', type: 'banner-divider', bannerUsage: 'divider-below', style: { fullWidth: true } },
      { id: 'about', type: 'about', bannerUsage: 'none' },
      { id: 'features', type: 'features', bannerUsage: 'none' },
      { id: 'divider-2', type: 'banner-divider', bannerUsage: 'divider-below', style: { fullWidth: true } },
      { id: 'tokenomics', type: 'tokenomics', bannerUsage: 'none' },
      { id: 'community', type: 'community', bannerUsage: 'none' },
      { id: 'footer', type: 'footer', bannerUsage: 'none' },
    ],
    heroStyle: 'fullscreen-bg',
    bannerStrategy: 'divider',
  },

  'story-driven': {
    name: 'story-driven',
    description: 'Narrative flow that tells a story, great for culture memes',
    bestFor: {
      vibes: ['mysterious', 'friendly'],
      narratives: ['culture', 'community'],
    },
    sections: [
      { id: 'hero', type: 'hero', bannerUsage: 'background', style: { darkOverlay: true, parallax: true } },
      { id: 'story', type: 'story', bannerUsage: 'none' },
      { id: 'gallery', type: 'gallery', bannerUsage: 'inline-decoration' },
      { id: 'features', type: 'features', bannerUsage: 'none' },
      { id: 'community', type: 'community', bannerUsage: 'none' },
      { id: 'footer', type: 'footer', bannerUsage: 'none' },
    ],
    heroStyle: 'fullscreen-bg',
    bannerStrategy: 'background-accent',
  },

  'minimal-focus': {
    name: 'minimal-focus',
    description: 'Ultra minimal - just the essentials, like Popcat',
    bestFor: {
      vibes: ['friendly', 'mysterious'],
      narratives: ['culture', 'community'],
    },
    sections: [
      { id: 'hero', type: 'hero', bannerUsage: 'none', style: { centered: true } },
      { id: 'cta', type: 'cta', bannerUsage: 'none' },
      { id: 'community', type: 'community', bannerUsage: 'none' },
      { id: 'footer', type: 'footer', bannerUsage: 'footer-decoration' },
    ],
    heroStyle: 'minimal-top',
    bannerStrategy: 'footer-decoration',
  },

  'feature-first': {
    name: 'feature-first',
    description: 'Features prominently displayed, great for tech projects',
    bestFor: {
      vibes: ['energetic', 'edgy'],
      narratives: ['tech', 'gaming'],
    },
    sections: [
      { id: 'hero', type: 'hero', bannerUsage: 'none' },
      { id: 'features', type: 'features', bannerUsage: 'none', style: { fullWidth: true } },
      { id: 'divider', type: 'banner-divider', bannerUsage: 'divider-below' },
      { id: 'about', type: 'about', bannerUsage: 'none' },
      { id: 'tokenomics', type: 'tokenomics', bannerUsage: 'none' },
      { id: 'community', type: 'community', bannerUsage: 'none' },
      { id: 'footer', type: 'footer', bannerUsage: 'none' },
    ],
    heroStyle: 'split-left',
    bannerStrategy: 'divider',
  },

  'gallery-showcase': {
    name: 'gallery-showcase',
    description: 'Visual-heavy layout showcasing meme assets',
    bestFor: {
      vibes: ['friendly', 'energetic'],
      narratives: ['culture', 'community'],
    },
    sections: [
      { id: 'hero', type: 'hero', bannerUsage: 'none' },
      { id: 'gallery', type: 'gallery', bannerUsage: 'inline-decoration', style: { fullWidth: true } },
      { id: 'about', type: 'about', bannerUsage: 'none' },
      { id: 'features', type: 'features', bannerUsage: 'none' },
      { id: 'community', type: 'community', bannerUsage: 'none' },
      { id: 'footer', type: 'footer', bannerUsage: 'none' },
    ],
    heroStyle: 'centered',
    bannerStrategy: 'gallery-item',
  },

  'dark-cyberpunk': {
    name: 'dark-cyberpunk',
    description: '暗黑赛博朋克风格 - 霓虹灯光、深色背景、科技感十足',
    bestFor: {
      vibes: ['edgy', 'mysterious'],
      narratives: ['tech', 'gaming'],
    },
    sections: [
      { id: 'hero', type: 'hero', bannerUsage: 'background', style: { darkOverlay: true, fullWidth: true } },
      { id: 'glitch-divider-1', type: 'banner-divider', bannerUsage: 'divider-below', style: { fullWidth: true } },
      { id: 'features', type: 'features', bannerUsage: 'none', style: { fullWidth: true } },
      { id: 'about', type: 'about', bannerUsage: 'none' },
      { id: 'glitch-divider-2', type: 'banner-divider', bannerUsage: 'divider-below', style: { fullWidth: true } },
      { id: 'tokenomics', type: 'tokenomics', bannerUsage: 'none' },
      { id: 'community', type: 'community', bannerUsage: 'none' },
      { id: 'footer', type: 'footer', bannerUsage: 'footer-decoration' },
    ],
    heroStyle: 'fullscreen-bg',
    bannerStrategy: 'divider',
  },

  'retro-pixel': {
    name: 'retro-pixel',
    description: '复古像素风格 - 8-bit美学、终端界面、怀旧游戏感',
    bestFor: {
      vibes: ['friendly', 'energetic'],
      narratives: ['gaming', 'culture'],
    },
    sections: [
      { id: 'hero', type: 'hero', bannerUsage: 'none', style: { centered: true } },
      { id: 'story', type: 'story', bannerUsage: 'none' },
      { id: 'features', type: 'features', bannerUsage: 'none' },
      { id: 'pixel-gallery', type: 'gallery', bannerUsage: 'inline-decoration' },
      { id: 'tokenomics', type: 'tokenomics', bannerUsage: 'none' },
      { id: 'community', type: 'community', bannerUsage: 'none' },
      { id: 'footer', type: 'footer', bannerUsage: 'none' },
    ],
    heroStyle: 'minimal-top',
    bannerStrategy: 'gallery-item',
  },
};

/**
 * Select the best layout template based on project analysis
 */
export function selectLayoutTemplate(
  vibe: 'friendly' | 'edgy' | 'mysterious' | 'energetic',
  narrativeType: 'community' | 'tech' | 'culture' | 'gaming',
  layoutStyle: 'minimal' | 'playful' | 'cyberpunk' | 'retro'
): LayoutTemplate {
  // Score each template based on how well it matches
  const scores: Array<{ template: LayoutTemplate; score: number }> = [];

  for (const template of Object.values(LAYOUT_TEMPLATES)) {
    let score = 0;

    // Vibe match (weight: 2)
    if (template.bestFor.vibes.includes(vibe)) {
      score += 2;
    }

    // Narrative match (weight: 2)
    if (template.bestFor.narratives.includes(narrativeType)) {
      score += 2;
    }

    // Layout style specific bonuses
    if (layoutStyle === 'minimal' && template.name === 'minimal-focus') {
      score += 3;
    }
    if (layoutStyle === 'playful' && template.name === 'gallery-showcase') {
      score += 2;
    }
    if (layoutStyle === 'cyberpunk' && template.name === 'banner-split') {
      score += 2;
    }
    if (layoutStyle === 'retro' && template.name === 'story-driven') {
      score += 2;
    }

    // 暗黑赛博朋克模板特殊加分
    if (layoutStyle === 'cyberpunk' && template.name === 'dark-cyberpunk') {
      score += 4; // 最高优先级
    }
    if (vibe === 'edgy' && template.name === 'dark-cyberpunk') {
      score += 2;
    }
    if (vibe === 'mysterious' && template.name === 'dark-cyberpunk') {
      score += 2;
    }

    // 复古像素风模板特殊加分
    if (layoutStyle === 'retro' && template.name === 'retro-pixel') {
      score += 4; // 最高优先级
    }
    if (narrativeType === 'gaming' && template.name === 'retro-pixel') {
      score += 2;
    }

    // Tech projects prefer feature-first or dark-cyberpunk
    if (narrativeType === 'tech' && template.name === 'feature-first') {
      score += 2;
    }
    if (narrativeType === 'tech' && template.name === 'dark-cyberpunk') {
      score += 1;
    }

    // Gaming projects prefer retro-pixel
    if (narrativeType === 'gaming' && template.name === 'retro-pixel') {
      score += 1;
    }

    // Culture memes prefer story-driven or gallery
    if (narrativeType === 'culture' && (template.name === 'story-driven' || template.name === 'gallery-showcase')) {
      score += 1;
    }

    // Add some randomness for variety (0-1 points)
    score += Math.random();

    scores.push({ template, score });
  }

  // Sort by score descending and return the best match
  scores.sort((a, b) => b.score - a.score);
  
  console.log(`[LayoutTemplates] Selected template: ${scores[0].template.name} (score: ${scores[0].score.toFixed(2)})`);
  console.log(`[LayoutTemplates] Input: vibe=${vibe}, narrative=${narrativeType}, style=${layoutStyle}`);
  
  return scores[0].template;
}

/**
 * Generate section order instruction for Claude prompt
 */
export function generateSectionOrderInstruction(template: LayoutTemplate, hasTokenomics: boolean): string {
  const sections = template.sections
    .filter(s => {
      // Skip tokenomics if not provided
      if (s.type === 'tokenomics' && !hasTokenomics) return false;
      return true;
    })
    .map((section, index) => {
      let instruction = `${index + 1}. `;
      
      switch (section.type) {
        case 'hero':
          instruction += `Hero section (id="hero") - Style: ${template.heroStyle}`;
          break;
        case 'about':
          instruction += `About section (id="about")`;
          break;
        case 'features':
          instruction += `Features section (id="features")`;
          if (section.style?.fullWidth) instruction += ' - Full width layout';
          break;
        case 'tokenomics':
          instruction += `Tokenomics section (id="tokenomics")`;
          break;
        case 'community':
          instruction += `Community section (id="community")`;
          break;
        case 'gallery':
          instruction += `Gallery section (id="gallery") - Showcase meme assets and banners`;
          break;
        case 'banner-divider':
          instruction += `Banner Divider (id="${section.id}") - Use PayDex or X banner as full-width visual separator`;
          break;
        case 'story':
          instruction += `Story section (id="story") - Narrative about the project's origin/journey`;
          break;
        case 'cta':
          instruction += `CTA section (id="cta") - Prominent call-to-action buttons`;
          break;
        case 'footer':
          instruction += `Footer section`;
          break;
      }

      // Add banner usage instruction
      if (section.bannerUsage && section.bannerUsage !== 'none') {
        switch (section.bannerUsage) {
          case 'background':
            instruction += '\n   → Use banner as section background image';
            break;
          case 'divider-above':
            instruction += '\n   → Place banner image above this section as divider';
            break;
          case 'divider-below':
            instruction += '\n   → Place banner image below this section as divider';
            break;
          case 'inline-decoration':
            instruction += '\n   → Include banner as inline image decoration';
            break;
        }
      }

      return instruction;
    });

  return `**LAYOUT TEMPLATE: ${template.name.toUpperCase()}**
Description: ${template.description}

**SECTION ORDER (FOLLOW THIS EXACTLY):**
${sections.join('\n')}

**HERO STYLE: ${template.heroStyle}**
${getHeroStyleInstruction(template.heroStyle)}

**BANNER STRATEGY: ${template.bannerStrategy}**
${getBannerStrategyInstruction(template.bannerStrategy)}`;
}

function getHeroStyleInstruction(style: string): string {
  switch (style) {
    case 'centered':
      return '- Content centered horizontally and vertically\n- Logo above headline\n- CTA buttons below tagline';
    case 'split-left':
      return '- Two-column layout: Logo/image on LEFT, text on RIGHT\n- Asymmetric visual weight';
    case 'split-right':
      return '- Two-column layout: Text on LEFT, Logo/image on RIGHT\n- Asymmetric visual weight';
    case 'fullscreen-bg':
      return '- Full viewport height with background image\n- Content overlaid with semi-transparent backdrop\n- Dramatic visual impact';
    case 'minimal-top':
      return '- Minimal height, content at top\n- Large logo/character image dominates\n- Very little text, just essentials';
    default:
      return '- Standard centered layout';
  }
}

function getBannerStrategyInstruction(strategy: string): string {
  switch (strategy) {
    case 'hero-only':
      return '- Use banner only in hero section\n- Do not repeat banner elsewhere';
    case 'divider':
      return '- Use banners as full-width visual dividers between major sections\n- Creates visual rhythm and breaks up content';
    case 'background-accent':
      return '- Use banner as subtle background element\n- Apply blur or overlay for text readability';
    case 'gallery-item':
      return '- Display banners in a dedicated gallery/assets section\n- Show as downloadable marketing materials';
    case 'footer-decoration':
      return '- Use banner as footer decoration or background\n- Subtle presence, not prominent';
    default:
      return '- Standard banner usage in assets section';
  }
}
