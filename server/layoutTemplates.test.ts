import { describe, it, expect } from 'vitest';
import { 
  selectLayoutTemplate, 
  generateSectionOrderInstruction, 
  LAYOUT_TEMPLATES,
  type LayoutTemplateName 
} from './layoutTemplates';

describe('layoutTemplates', () => {
  describe('selectLayoutTemplate', () => {
    it('should return a valid template for any combination of inputs', () => {
      const vibes = ['friendly', 'edgy', 'mysterious', 'energetic'] as const;
      const narratives = ['community', 'tech', 'culture', 'gaming'] as const;
      const layouts = ['minimal', 'playful', 'cyberpunk', 'retro'] as const;

      for (const vibe of vibes) {
        for (const narrative of narratives) {
          for (const layout of layouts) {
            const template = selectLayoutTemplate(vibe, narrative, layout);
            expect(template).toBeDefined();
            expect(template.name).toBeDefined();
            expect(template.sections).toBeInstanceOf(Array);
            expect(template.sections.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should prefer minimal-focus template for minimal layout style', () => {
      const template = selectLayoutTemplate('friendly', 'community', 'minimal');
      // minimal-focus gets +3 bonus for minimal layout
      expect(template.name).toBe('minimal-focus');
    });

    it('should prefer feature-first template for tech narrative', () => {
      const template = selectLayoutTemplate('energetic', 'tech', 'playful');
      // feature-first gets +2 bonus for tech narrative
      expect(template.name).toBe('feature-first');
    });

    it('should prefer banner-split template for cyberpunk layout', () => {
      const template = selectLayoutTemplate('edgy', 'gaming', 'cyberpunk');
      // banner-split gets +2 bonus for cyberpunk layout
      expect(template.name).toBe('banner-split');
    });
  });

  describe('LAYOUT_TEMPLATES', () => {
    it('should have all required templates defined', () => {
      const requiredTemplates: LayoutTemplateName[] = [
        'classic',
        'banner-split',
        'story-driven',
        'minimal-focus',
        'feature-first',
        'gallery-showcase'
      ];

      for (const name of requiredTemplates) {
        expect(LAYOUT_TEMPLATES[name]).toBeDefined();
        expect(LAYOUT_TEMPLATES[name].name).toBe(name);
      }
    });

    it('should have valid section types in all templates', () => {
      const validSectionTypes = [
        'hero', 'about', 'features', 'tokenomics', 'community', 
        'gallery', 'banner-divider', 'story', 'cta', 'footer'
      ];

      for (const template of Object.values(LAYOUT_TEMPLATES)) {
        for (const section of template.sections) {
          expect(validSectionTypes).toContain(section.type);
        }
      }
    });

    it('should have hero section in all templates', () => {
      for (const template of Object.values(LAYOUT_TEMPLATES)) {
        const hasHero = template.sections.some(s => s.type === 'hero');
        expect(hasHero).toBe(true);
      }
    });

    it('should have footer section in all templates', () => {
      for (const template of Object.values(LAYOUT_TEMPLATES)) {
        const hasFooter = template.sections.some(s => s.type === 'footer');
        expect(hasFooter).toBe(true);
      }
    });
  });

  describe('generateSectionOrderInstruction', () => {
    it('should generate instruction string for classic template', () => {
      const template = LAYOUT_TEMPLATES['classic'];
      const instruction = generateSectionOrderInstruction(template, true);
      
      expect(instruction).toContain('LAYOUT TEMPLATE: CLASSIC');
      expect(instruction).toContain('Hero section');
      expect(instruction).toContain('Footer section');
    });

    it('should exclude tokenomics when hasTokenomics is false', () => {
      const template = LAYOUT_TEMPLATES['classic'];
      const instruction = generateSectionOrderInstruction(template, false);
      
      expect(instruction).not.toContain('Tokenomics section');
    });

    it('should include tokenomics when hasTokenomics is true', () => {
      const template = LAYOUT_TEMPLATES['classic'];
      const instruction = generateSectionOrderInstruction(template, true);
      
      expect(instruction).toContain('Tokenomics section');
    });

    it('should include banner divider instructions for banner-split template', () => {
      const template = LAYOUT_TEMPLATES['banner-split'];
      const instruction = generateSectionOrderInstruction(template, true);
      
      expect(instruction).toContain('Banner Divider');
      expect(instruction).toContain('BANNER STRATEGY: divider');
    });

    it('should include hero style instruction', () => {
      const template = LAYOUT_TEMPLATES['minimal-focus'];
      const instruction = generateSectionOrderInstruction(template, false);
      
      expect(instruction).toContain('HERO STYLE: minimal-top');
    });
  });
});
