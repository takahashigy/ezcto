import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Load from localStorage or default to 'en'
    const saved = localStorage.getItem('language');
    return (saved === 'zh' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Translations
const translations = {
  en: {
    nav: {
      templates: 'Templates',
      supply: 'Supply Chain',
      store: 'Store',
      dashboard: 'Dashboard',
      launch: 'Launch Project',
    },
    hero: {
      systemOnline: 'SYSTEM ONLINE',
      title: 'Your Automated',
      titleMeme: 'Meme CTO',
      subtitle: 'AI-driven Launch Engine, Automated Social Distribution, Meme Physical Economy',
      description: 'From startup to moon, EZCTO provides a complete ecosystem for Meme projects.',
    },
     formula: {
      onlyPayDex: 'Only Pay Dex < 1',
      payDexMeme: 'Pay Dex + Pay Meme > 2',
    },
    barriers: {
      title: 'Breaking Three Barriers',
      subtitle: 'The Meme market is constrained by high costs, fragmented operations, and traffic saturation. 99% of projects fail at launch, not in the market.',
      launch: {
        title: 'Launch Barrier',
        problem: 'High-cost, low-value "listing tax"',
        solution: 'Professional launch assets in 10 minutes'
      },
      capability: {
        title: 'Capability Barrier',
        problem: 'Fragmented "workshop-style" operations',
        solution: 'All-in-one solution, no outsourcing needed'
      },
      traffic: {
        title: 'Traffic Barrier',
        problem: 'Trapped in "crypto echo chamber"',
        solution: 'Access to billions of Web2 users'
      }
    },
    modules: {
      title: 'Core Modules',
      subtitle: 'From startup to moon, EZCTO provides a complete ecosystem for Meme projects.',
      launch: {
        title: 'Launch Automation Engine',
        tag: 'STANDARD VERSION',
        description: 'Generate professional startup assets in 10 minutes: Logo, Banner, PFP, Poster, Official Website, core documents, distribution matrix, success rate increased by "double digits".',
        features: {
          assets: 'Assets: Logo, Banner, PFP, Poster',
          website: 'Official Website + one-click deployment',
          core: 'Core Documents: Project Introduction, Whitepaper, Copywriting',
        },
        button: 'Start Launch',
      },
      supply: {
        title: 'IP Merchandise Supply Chain',
        tag: 'COMING SOON',
        description: 'Break through dimensions, transform digital IP into "physical faith". Integrate global top supply chains, provide one-stop C2M service from design, sampling, production to global delivery.',
        features: {
          c2m: 'C2M connects global supply chain',
          ai: 'AI effect image generation',
          delivery: 'From design to global delivery',
        },
        button: 'View Supply Chain',
      },
      store: {
        title: 'EZCTO Official Store',
        tag: 'COMING SOON',
        description: 'Meme physical economy "value discovery platform". Aggregate all quality Meme merchandise, hot sales list becomes "data oracle" measuring project real community cohesion and long-term potential.',
        features: {
          platform: 'Aggregate sales platform',
          alphab: '"Hot List" is "Alpha"',
          ip: 'IP value discovery',
        },
        button: 'Enter Store',
      },
      sdn: {
        title: 'Social Distribution Network (SDN)',
        tag: 'COMING SOON',
        description: 'Break growth ceilings with a "web2 nuclear weapon". AI video matrix transforms project assets into viral short videos, systematically distributes to TikTok and Web2 platforms, achieving data-driven exponential growth.',
        features: {
          ai: 'AI video matrix auto-generation',
          tiktok: 'Multi-platform smart distribution',
          data: 'Data feedback loop optimization',
        },
        comingSoon: 'Coming Q2 2026',
      },
      alchemy: {
        title: 'Alchemy Plan',
        tag: 'COMING SOON',
        description: 'Train exclusive Meme image generation model based on Stable Diffusion. Learn from success cases, precisely capture Meme aesthetics, generate visual assets with stronger virality and community resonance.',
        features: {
          sd: 'Exclusive model training',
          meme: 'Deep learning of Meme aesthetics',
          quality: 'Higher quality generation results',
        },
        comingSoon: 'Coming Q4 2026',
      },
      lora: {
        title: 'Lora Forge Workshop',
        tag: 'COMING SOON',
        description: 'Provide exclusive Lora model training service for excellent Meme characters. Based on project visual assets, forge style-consistent, infinitely expandable character models to extend IP longevity.',
        features: {
          exclusive: 'Exclusive Lora model training',
          consistency: 'Style consistency guarantee',
          lifecycle: 'Infinite visual asset expansion',
        },
        comingSoon: 'Coming Soon',
      },
    },
    flywheel: {
      title: 'Positive Flywheel Ecosystem',
      step1: 'Use automated engine as traffic entry, attracting massive project parties',
      step2: 'Alchemy Plan continuously improves generation quality, lowers startup barriers, attracts more projects',
      step3: 'Use social distribution network to screen and empower high-potential projects',
      step4: 'Use IP merchandise supply chain to help them commercialize',
      step5: 'Lora Forge Workshop creates exclusive models for hot IPs, extends lifecycle, strengthens community cohesion',
      step6: 'Official store "Hot List" becomes new value discovery standard',
      step7: 'Attracts top-tier celebrity traffic, achieves ultimate breakthrough',
    },
    templates: {
      title: 'Choose Your Style',
      subtitle: 'Professional Meme website templates, one-click deployment',
      terminalHacker: {
        title: 'Terminal Hacker',
        description: 'Retro terminal style, green matrix effect',
      },
      comicBook: {
        title: 'Comic Book',
        description: 'Comic style, colorful visual impact',
      },
      wojak: {
        title: 'Minimalist Clean (Wojak)',
        description: 'Simple and clean, suitable for hand-drawn Meme',
      },
      labubu: {
        title: 'Internet Meme (Labubu)',
        description: 'Internet style, suitable for pixel art Meme',
      },
      preview: 'Preview',
      select: 'Select',
    },
  },
  zh: {
    nav: {
      templates: '模版',
      supply: '供应链',
      store: '商城',
      dashboard: '控制台',
      launch: '启动项目',
    },
    hero: {
      systemOnline: 'SYSTEM ONLINE',
      title: 'Your Automated',
      titleMeme: 'Meme CTO',
      subtitle: 'AI驱动的Launch引擎，自动化社交分发，Meme实体经济',
      description: '从启动到登月，EZCTO提供完整的Meme项目生态系统。',
    },
    formula: {
      onlyPayDex: 'Only Pay Dex < 1',
      payDexMeme: 'Pay Dex + Pay Meme > 2',
    },
    barriers: {
      title: '打破三大枷锁',
      subtitle: '当前Meme市场被高成本、碎片化运营和流量内卷束缚，99%的项目死于启动而非市场',
      launch: {
        title: '启动枷锁',
        problem: '高成本、低价值的"上币税"',
        solution: '10分钟自动化生成专业级启动资产'
      },
      capability: {
        title: '能力枷锁',
        problem: '高度碎片化的"作坊式"运营',
        solution: '一站式解决方案，无需外包或摸索'
      },
      traffic: {
        title: '流量枷锁',
        problem: '无法突破的"加密内卷"',
        solution: '打通Web2亿万级蓝海用户'
      }
    },
    problems: {
      title: '打破三大枷锁',
      subtitle: '当前Meme市场极度饱和成本，群化仅凭营销内卷是内卷，99%的项目无法于早期市场',
      problem1: {
        title: '启动枷锁',
        description: '高成本、低价值的"上币"',
        solution: '1分钟自动化专业级启动资产',
      },
      problem2: {
        title: '能力枷锁',
        description: '高转化率的"矩阵式运营"',
        solution: '一键矩阵，无限量包推送',
      },
      problem3: {
        title: '流量枷锁',
        description: '无关键利益的"加群拉新"',
        solution: '打造web2亿级流量池用户池',
      },
    },
    modules: {
      title: 'Core Modules',
      subtitle: '从启动到登月，增加分发网络筛选，变现到价值发现，EZCTO提供完整的Meme项目生态系统。',
      launch: {
        title: 'Launch自动化引擎',
        tag: 'STANDARD VERSION',
        description: '10分钟内自动生成并交付一整套专业级启动资产：Logo、Banner、PFP、海报、官方网站、核心文档、分发矩阵下，成功率提升"双位数"及格线"。',
        features: {
          assets: '品牌资产：Logo、Banner、PFP、海报',
          website: '官方网站 + 一键式成部署',
          core: '核心文档：项目简介、白皮书、讯文案',
        },
        button: 'Start Launch',
      },
      supply: {
        title: 'IP实体化供应链',
        tag: 'COMING SOON',
        description: '打通次元壁，将数字IP转化为"物理信仰"。整合全球顶级供应链，提供从设计、打样、生产到全球配送的一站式C2M服务。',
        features: {
          c2m: 'C2M对接全球供应链',
          ai: 'AI效果图生成',
          delivery: '从设计到全球配送',
        },
        button: '查看供应链',
      },
      store: {
        title: 'EZCTO官方商城',
        tag: 'COMING SOON',
        description: 'Meme实体经济的"价值发现平台"。聚合所有优质Meme周边，热销榜单成为衡量项目真实社区凝聚力和长期潜力的"数据预言机"。',
        features: {
          platform: '聚合销售平台',
          alphab: '"热销榜"即"Alpha榜"',
          ip: 'IP价值发现金矿',
        },
        button: '进入商城',
      },
      sdn: {
        title: '社交分发网络（SDN）',
        tag: 'COMING SOON',
        description: '打破增长上限的“核武器”。AI视频矩阵自动将项目素材转化为病毒式短视频，系统化分发至TikTok等Web2平台，实现数据驱动的指数级增长。',
        features: {
          ai: 'AI视频矩阵自动生成',
          tiktok: '多平台智能分发',
          data: '数据反馈闭环优化',
        },
        comingSoon: 'Coming Q2 2026',
      },
      alchemy: {
        title: '炼丹计划',
        tag: 'COMING SOON',
        description: '基于Stable Diffusion训练专属于Meme图片生成的大模型。深度学习成功案例，精准捕捉Meme美学，生成更具传播力和社区共鸣的视觉资产。',
        features: {
          sd: '专属大模型训练',
          meme: '深度学习Meme美学',
          quality: '更高质量的生成结果',
        },
        comingSoon: 'Coming Q4 2026',
      },
      lora: {
        title: 'Lora炼制工坊',
        tag: 'COMING SOON',
        description: '为优秀的Meme角色提供专属Lora模型训练服务。基于项目的视觉资产，炼制出风格一致、可无限扩展的专属角色模型，让IP生命力更长久。',
        features: {
          exclusive: '专属Lora模型训练',
          consistency: '风格一致性保证',
          lifecycle: '无限扩展视觉资产',
        },
        comingSoon: 'Coming Soon',
      },
    },
    flywheel: {
      title: '正向飞轮生态',
      step1: '用自动化引擎作为流量入口，吸引海量项目方',
      step2: '炼丹计划持续提升生成质量，降低启动门槛，吸引更多项目方',
      step3: '用社交分发网络筛选并赋能高潜力项目',
      step4: '用IP实体化供应链帮助其商业变现',
      step5: 'Lora炼制工坊为热门IP打造专属模型，延长生命周期，增强社区粘性',
      step6: '官方商城的“热销榜”成为新的价值发现标准',
      step7: '吸引顶级明星流量，实现终极破圈',
    },
    templates: {
      title: 'Choose Your Style',
      subtitle: '专业的Meme网站模板，一键部署',
      terminalHacker: {
        title: 'Terminal Hacker',
        description: '复古终端风格，绿色矩阵效果',
      },
      comicBook: {
        title: 'Comic Book',
        description: '漫画风格，色彩鲜明视觉冲击',
      },
      wojak: {
        title: 'Minimalist Clean (Wojak)',
        description: '简约清爽，适合手绘Meme',
      },
      labubu: {
        title: 'Internet Meme (Labubu)',
        description: '网络风格，适合像素艺术Meme',
      },
      preview: 'Preview',
      select: 'Select',
    },
  },
};
