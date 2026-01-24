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
      home: 'Home',
      templates: 'Templates',
      supply: 'Supply Chain',
      store: 'Store',
      dashboard: 'Dashboard',
      launch: 'Launch Project',
      myProjects: 'My Projects',
      login: 'Login',
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
      page: {
        title: 'One-Click Generation · Narrative-Matching Meme Websites',
        subtitle: 'Choose a style template, AI automatically generates brand-consistent landing pages',
        subtitleLine2: 'Supports visual editing, one-click publish',
        feature1: 'AI Smart Generation',
        feature2: 'Visual Editing',
        feature3: 'Source Code Download',
        gridTitle: '4 Preset Styles · Launch Now',
        comingSoonTitle: 'More Templates · In Development',
        ctaTitle: 'Ready to Launch Your Meme Project?',
        ctaSubtitle: 'Choose a template, generate complete brand assets and landing page in 10 minutes',
        ctaButton: 'Start Launch Now',
        previewTitle: 'Template Preview',
        openNewWindow: 'Open in New Window',
        close: 'Close',
      },
      card: {
        suitable: 'Suitable:',
        fonts: 'Fonts:',
        preview: 'Preview Template',
        use: 'Use Template',
      },
      terminalHacker: {
        name: 'Terminal Hacker',
        description: 'Hacker terminal style, green matrix code, cyberpunk tech feel',
        scenario: 'Tech/Hacker/AI themed Memes',
      },
      comicBook: {
        name: 'Comic Book',
        description: 'Cartoon comic style, hand-drawn decorative elements, vibrant colors',
        scenario: 'Emoji/Cultural meme/Community-driven projects',
      },
      wojak: {
        name: 'Wojak Style',
        description: 'Sky blue background, hand-drawn decorative elements, comic fonts, complete Wojak website replica',
        scenario: 'Emoji/Emotional meme/Community culture projects',
      },
      labubu: {
        name: 'Labubu Style',
        description: 'Dark background + white canvas, dashed grid system, pixel art + scrollbar animation',
        scenario: 'Cute/Kawaii/Cartoon style projects',
      },
      comingSoon: {
        vaporwave: { name: 'Vaporwave', description: 'Vaporwave aesthetics' },
        brutalism: { name: 'Brutalism', description: 'Brutalist design' },
        glassmorphism: { name: 'Glassmorphism', description: 'Glass morphism style' },
      },
    },
    supply: {
      page: {
        tag: 'IP MERCHANDISE SUPPLY CHAIN',
        title: 'From Digital Consensus to Physical Faith',
        subtitle: 'Connect with global premium supply chains, transform your Meme IP into physical products',
        subtitleLine2: 'Small batch customization · Fast delivery · Zero inventory risk',
        startButton: 'Start Customization',
        servicesTitle: 'One-Stop Supply Chain Service',
        servicesSubtitle: 'From design to delivery, worry-free throughout',
        partnersTitle: 'Partner Factory Network',
        partnersSubtitle: 'Carefully selected global premium manufacturers',
        ctaTitle: 'Ready to Materialize Your IP?',
        ctaSubtitle: 'Start now, bring your Meme from screen to reality',
        ctaButton: 'Start Customization Now',
      },
      services: {
        production: {
          title: 'Custom Production',
          description: 'Connect with global premium factories, support small batch custom production',
          feature1: 'MOQ as low as 50 pieces',
          feature2: '7-15 days delivery',
          feature3: 'Quality guarantee',
        },
        packaging: {
          title: 'Packaging Design',
          description: 'Professional packaging design team, create unique brand experience',
          feature1: '3D renderings',
          feature2: 'Eco-friendly materials',
          feature3: 'Brand customization',
        },
        logistics: {
          title: 'Logistics & Delivery',
          description: 'Global logistics network, fast and reliable delivery service',
          feature1: 'Global delivery',
          feature2: 'Real-time tracking',
          feature3: 'Insurance protection',
        },
        inventory: {
          title: 'Inventory Management',
          description: 'Smart inventory system, optimize costs and reduce risks',
          feature1: 'Zero inventory risk',
          feature2: 'On-demand production',
          feature3: 'Data analytics',
        },
      },
      partners: {
        factoryA: { name: 'Premium Factory A', category: 'Plush Toys', capacity: '100K/month' },
        factoryB: { name: 'Premium Factory B', category: 'Apparel Printing', capacity: '50K/month' },
        factoryC: { name: 'Premium Factory C', category: 'Accessories', capacity: '200K/month' },
        factoryD: { name: 'Premium Factory D', category: 'Packaging & Printing', capacity: '500K/month' },
      },
    },
    store: {
      page: {
        tag: 'EZSTORE OFFICIAL MARKETPLACE',
        title: 'Hot List = Value Discovery Standard',
        subtitle: 'Unified brand marketplace, real-time sales data, transparent value standards',
        subtitleLine2: 'Predict project potential from product popularity, attract top-tier traffic for ultimate breakthrough',
        comingSoon: 'Coming Soon',
        previewStore: 'Preview Store',
        whyTitle: 'Why Choose EZSTORE?',
        whySubtitle: 'Unified traffic entry, transparent value standards',
        topProductsTitle: 'Hot List TOP 4',
        topProductsSubtitle: 'Real-time sales data, transparent value standards',
        valueTitle: 'Hot List = Value Discovery Standard',
        valueDescription: 'Through real-time sales data, EZSTORE\'s hot list becomes the transparent standard for Meme project value. IPs behind high-sales products often have stronger community consensus and commercial potential, attracting top-tier celebrity traffic for ultimate breakthrough.',
        stats: {
          users: 'Monthly Active Users',
          gmv: 'Monthly GMV',
          brands: 'Partner Brands',
        },
        ctaTitle: 'Ready to List Your Products on EZSTORE?',
        ctaSubtitle: 'Start now, let your Meme IP shine in the official marketplace',
        ctaButton: 'Join Now',
        salesLabel: 'Sales:',
      },
      features: {
        marketplace: {
          title: 'Official Marketplace',
          description: 'Unified brand marketplace showcasing all Meme IP products',
          benefit1: 'Unified traffic entry',
          benefit2: 'Brand endorsement',
          benefit3: 'Cross-selling',
        },
        hotlist: {
          title: 'Hot List',
          description: 'Real-time updated sales rankings, value discovery standard',
          benefit1: 'Data transparency',
          benefit2: 'Trend prediction',
          benefit3: 'Investment reference',
        },
        quality: {
          title: 'Quality Certification',
          description: 'Strict product quality control, guaranteed user experience',
          benefit1: 'Quality guarantee',
          benefit2: 'Easy returns',
          benefit3: 'Reputation assurance',
        },
        community: {
          title: 'Community Driven',
          description: 'User reviews and feedback drive product optimization',
          benefit1: 'Authentic reviews',
          benefit2: 'Community co-creation',
          benefit3: 'Continuous improvement',
        },
      },
      products: {
        wojak: { name: 'Wojak Plush Toy' },
        pepe: { name: 'Pepe Limited T-Shirt' },
        doge: { name: 'Doge Mug' },
        labubu: { name: 'Labubu Figure' },
      },
    },
    launch: {
      page: {
        tag: 'LAUNCH AUTOMATION ENGINE',
        title: 'Create Your Meme Project',
        subtitle: 'Generate professional brand assets in 10 minutes: Logo, Banner, PFP, Poster, Website, Copy',
        formTitle: 'Project Information',
        formDescription: 'Fill in your project details to start the automated generation process',
        whatYouGetTitle: "What You'll Get",
        visualAssets: 'Visual Assets',
        contentAssets: 'Content Assets',
        generationTime: "Generation typically takes 5-10 minutes. You'll be notified when complete.",
      },
      form: {
        projectName: 'Project Name',
        projectNamePlaceholder: 'e.g., DogeKing, PepeRevolution',
        projectNameHelp: 'The name of your Meme project',
        ticker: 'Ticker Symbol',
        tickerPlaceholder: 'e.g., DOGE, PEPE',
        tickerHelp: 'Token ticker symbol (optional)',
        uploadImages: 'Upload Meme Character Images',
        uploadPrompt: 'Click to upload or drag and drop',
        uploadFormat: 'PNG, JPG, WEBP (Max 10MB per image)',
        uploadCount: 'images uploaded',
        removeBackground: 'Automatically remove background (recommended for better results)',
        uploadHelp: 'Upload your Meme character/IP image. AI will use this to generate all visual assets (Logo, Banner, PFP, etc.) in your chosen style.',
        description: 'Project Description',
        descriptionPlaceholder: 'Describe your project concept, target audience, and unique value proposition...',
        descriptionHelp: 'The more details you provide, the better the AI can generate your assets',
        styleTemplate: 'Visual Style Template',
        styleTemplatePlaceholder: 'Select a style template',
        styleTemplateHelp: 'Choose a visual style for your brand assets (affects logo, website, and all visual elements)',
        primary: 'Primary',
        imageSizeError: 'Image size must be less than 10MB',
      },
      styles: {
        retroGaming: { name: 'Retro Gaming', description: '8-bit pixel art, neon colors, arcade vibes' },
        cyberpunk: { name: 'Cyberpunk', description: 'Red & black, futuristic tech, neon aesthetics' },
        minimalist: { name: 'Minimalist', description: 'Clean lines, monochrome, modern simplicity' },
        internetMeme: { name: 'Internet Meme', description: 'Hand-drawn style, cartoon characters, playful' },
      },
      assets: {
        logo: 'Logo (PNG, SVG)',
        banner: 'Banner (Twitter/X)',
        pfp: 'Profile Picture (PFP)',
        poster: 'Promotional Poster',
        narrative: 'Project Narrative',
        whitepaper: 'Whitepaper Draft',
        tweets: 'Launch Tweets (5x)',
        landingPage: 'Landing Page HTML',
      },
      buttons: {
        uploadingImage: 'Uploading Image...',
        generatingAssets: 'Generating Assets...',
        launchProject: 'Launch Project',
        cancel: 'Cancel',
      },
    },
    dashboard: {
      tabs: {
        projects: 'My Projects',
        orders: 'My Orders',
      },
      page: {
        title: 'Project Dashboard',
        systemOnline: 'SYSTEM ONLINE',
        newProject: 'New Project',
        generationHistory: 'Generation History',
        yourProjects: 'Your Projects',
      },
      orders: {
        title: 'My Custom Orders',
        empty: 'No orders yet',
        emptyDescription: "You haven't submitted any custom orders yet. Visit Supply Chain to start your first order.",
        emptyButton: 'Browse Supply Chain',
        orderNumber: 'Order',
        productType: 'Product Type',
        quantity: 'Quantity',
        budget: 'Budget',
        contact: 'Contact',
        files: 'Files',
        description: 'Description',
        createdAt: 'Created',
        viewFile: 'View',
      },
      stats: {
        totalProjects: 'TOTAL PROJECTS',
        completed: 'COMPLETED',
        inProgress: 'IN PROGRESS',
      },
      empty: {
        title: 'No Projects Yet',
        description: 'Start your first Meme project with our automated Launch Engine',
        button: 'Create Your First Project',
      },
      project: {
        noDescription: 'No description',
        ticker: 'Ticker',
        created: 'Created',
        viewDetails: 'View Details',
        delete: 'Delete',
        confirmDelete: 'Are you sure you want to delete this project?',
        deleteSuccess: 'Project deleted successfully',
        deleteError: 'Failed to delete project',
      },
      status: {
        completed: 'COMPLETED',
        generating: 'GENERATING',
        failed: 'FAILED',
        pending: 'PENDING',
      },
    },
    customOrder: {
      page: {
        tag: 'Supply Chain Customization',
        title: 'Custom Manufacturing Order',
        subtitle: 'From design to delivery, we handle everything for your Meme project merchandise',
      },
      form: {
        productType: 'Product Type',
        productTypePlaceholder: 'Select product category',
        quantity: 'Order Quantity',
        quantityPlaceholder: 'Enter quantity (minimum 100 units)',
        budget: 'Budget Range',
        budgetPlaceholder: 'Select your budget',
        description: 'Requirements Description',
        descriptionPlaceholder: 'Describe your customization needs, design requirements, material preferences, etc...',
        uploadFiles: 'Upload Design Files',
        uploadPrompt: 'Click to upload or drag and drop',
        uploadFormat: 'PNG, JPG, PDF, AI (Max 10MB per file)',
        uploadCount: 'files uploaded',
        contactName: 'Contact Name',
        contactNamePlaceholder: 'Your name',
        contactEmail: 'Email Address',
        contactEmailPlaceholder: 'your@email.com',
        contactPhone: 'Phone Number',
        contactPhonePlaceholder: '+1 (555) 000-0000',
      },
      productTypes: {
        merchandise: { name: 'Merchandise', description: 'T-shirts, hoodies, hats, stickers, etc.' },
        packaging: { name: 'Packaging Design', description: 'Custom boxes, bags, labels, etc.' },
        manufacturing: { name: 'Custom Manufacturing', description: 'Toys, figures, collectibles, etc.' },
        logistics: { name: 'Logistics Service', description: 'Warehousing, fulfillment, shipping, etc.' },
      },
      budgets: {
        small: '$1,000 - $5,000',
        medium: '$5,000 - $20,000',
        large: '$20,000 - $50,000',
        enterprise: '$50,000+',
      },
      buttons: {
        submit: 'Submit Order Request',
        submitting: 'Submitting...',
      },
      success: {
        title: 'Order Request Submitted!',
        description: 'Our supply chain team will review your request and contact you within 24 hours.',
        button: 'Back to Supply Chain',
      },
    },
  },
  zh: {
    nav: {
      home: '首页',
      templates: '模版',
      supply: '供应链',
      store: '商城',
      dashboard: '控制台',
      launch: '启动项目',
      myProjects: '我的项目',
      login: '登录',
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
      page: {
        title: '一键生成 · 匹配叙事的Meme网站',
        subtitle: '选择风格模版，AI自动生成品牌一致的落地页',
        subtitleLine2: '支持可视化编辑，一键发布上线',
        feature1: 'AI智能生成',
        feature2: '可视化编辑',
        feature3: '源码下载',
        gridTitle: '4种预设风格 · 即刻启动',
        comingSoonTitle: '更多模版 · 开发中',
        ctaTitle: '准备好启动你的Meme项目了吗？',
        ctaSubtitle: '选择一个模版，10分钟内生成完整的品牌资产和落地页',
        ctaButton: '立即开始 Launch',
        previewTitle: '模版预览',
        openNewWindow: '新窗口打开',
        close: '关闭',
      },
      card: {
        suitable: '适用:',
        fonts: '字体:',
        preview: '预览模版',
        use: '使用模版',
      },
      terminalHacker: {
        name: 'Terminal Hacker',
        description: '黑客终端风格，绿色矩阵代码，赛博朋克科技感',
        scenario: '技术/黑客/AI主题Meme',
      },
      comicBook: {
        name: 'Comic Book',
        description: '卡通漫画风格，手绘装饰元素，鲜艳配色',
        scenario: '表情包/文化meme/社区驱动项目',
      },
      wojak: {
        name: 'Wojak Style',
        description: '天蓝色背景，手绘装饰元素，漫画字体，完整复刻Wojak网站',
        scenario: '表情包/情绪 meme/社区文化项目',
      },
      labubu: {
        name: 'Labubu Style',
        description: '深色背景+白色画布，虚线网格系统，像素艺术+滚动条动画',
        scenario: '可爱/萌系/卡通风格项目',
      },
      comingSoon: {
        vaporwave: { name: 'Vaporwave', description: '蒸汽波美学' },
        brutalism: { name: 'Brutalism', description: '粗野主义设计' },
        glassmorphism: { name: 'Glassmorphism', description: '玻璃拟态风格' },
      },
    },
    supply: {
      page: {
        tag: 'IP实体化供应链',
        title: '从数字共识到物理信仰',
        subtitle: '连接全球优质供应链，将你的Meme IP转化为实体商品',
        subtitleLine2: '小批量定制 · 快速交付 · 零库存风险',
        startButton: '开始定制',
        servicesTitle: '一站式供应链服务',
        servicesSubtitle: '从设计到交付，全程无忧',
        partnersTitle: '合作工厂网络',
        partnersSubtitle: '严选全球优质制造商',
        ctaTitle: '准备好将你的IP实体化了吗？',
        ctaSubtitle: '立即开始，让你的Meme从屏幕走向现实',
        ctaButton: '立即开始定制',
      },
      services: {
        production: {
          title: '定制生产',
          description: '连接全球优质工厂，支持小批量定制生产',
          feature1: 'MOQ低至50件',
          feature2: '7-15天交付',
          feature3: '质量保证',
        },
        packaging: {
          title: '包装设计',
          description: '专业包装设计团队，打造独特品牌体验',
          feature1: '3D效果图',
          feature2: '环保材料',
          feature3: '品牌定制',
        },
        logistics: {
          title: '物流配送',
          description: '全球物流网络，快速可靠的配送服务',
          feature1: '全球配送',
          feature2: '实时追踪',
          feature3: '保险保障',
        },
        inventory: {
          title: '库存管理',
          description: '智能库存系统，优化成本降低风险',
          feature1: '零库存风险',
          feature2: '按需生产',
          feature3: '数据分析',
        },
      },
      partners: {
        factoryA: { name: '优质工厂A', category: '毛绒玩具', capacity: '月产10万件' },
        factoryB: { name: '优质工厂B', category: '服装印花', capacity: '月产5万件' },
        factoryC: { name: '优质工厂C', category: '周边配件', capacity: '月产20万件' },
        factoryD: { name: '优质工厂D', category: '包装印刷', capacity: '月产50万件' },
      },
    },
    store: {
      page: {
        tag: 'EZSTORE官方商城',
        title: '热销榜即价值发现标准',
        subtitle: '统一的品牌商城，实时销售数据，透明的价值标准',
        subtitleLine2: '从商品热度预测项目潜力，吸引顶级流量破圈',
        comingSoon: '即将上线',
        previewStore: '预览商城',
        whyTitle: '为什么选择EZSTORE？',
        whySubtitle: '统一流量入口，透明价值标准',
        topProductsTitle: '热销榜 TOP 4',
        topProductsSubtitle: '实时销售数据，透明价值标准',
        valueTitle: '热销榜 = 价值发现标准',
        valueDescription: '通过实时销售数据，EZSTORE的热销榜成为Meme项目价值的透明标准。高销量商品背后的IP往往具有更强的社区共识和商业潜力，吸引顶级明星流量，实现终极破圈。',
        stats: {
          users: '月活用户',
          gmv: '月GMV',
          brands: '入驻品牌',
        },
        ctaTitle: '准备好在EZSTORE上架你的商品了吗？',
        ctaSubtitle: '立即开始，让你的Meme IP在官方商城闪耀',
        ctaButton: '立即入驻',
        salesLabel: '销量:',
      },
      features: {
        marketplace: {
          title: '官方商城',
          description: '统一的品牌商城，展示所有Meme IP商品',
          benefit1: '统一流量入口',
          benefit2: '品牌背书',
          benefit3: '交叉销售',
        },
        hotlist: {
          title: '热销榜单',
          description: '实时更新的销售排行榜，发现价值标准',
          benefit1: '数据透明',
          benefit2: '趋势预测',
          benefit3: '投资参考',
        },
        quality: {
          title: '质量认证',
          description: '严格的商品质量把关，保证用户体验',
          benefit1: '质量保证',
          benefit2: '退换无忧',
          benefit3: '信誉保障',
        },
        community: {
          title: '社区驱动',
          description: '用户评价和反馈驱动商品优化',
          benefit1: '真实评价',
          benefit2: '社区共建',
          benefit3: '持续改进',
        },
      },
      products: {
        wojak: { name: 'Wojak毛绒玩具' },
        pepe: { name: 'Pepe限量T恤' },
        doge: { name: 'Doge马克杯' },
        labubu: { name: 'Labubu手办' },
      },
    },
    launch: {
      page: {
        tag: 'Launch自动化引擎',
        title: '创建你的Meme项目',
        subtitle: '10分钟内生成专业级品牌资产：Logo、Banner、PFP、海报、网站、文案',
        formTitle: '项目信息',
        formDescription: '填写项目详情，启动自动化生成流程',
        whatYouGetTitle: '你将获得',
        visualAssets: '视觉资产',
        contentAssets: '内容资产',
        generationTime: '生成通常需要5-10分钟。完成后将通知你。',
      },
      form: {
        projectName: '项目名称',
        projectNamePlaceholder: '例如：DogeKing, PepeRevolution',
        projectNameHelp: '你的Meme项目名称',
        ticker: 'Ticker符号',
        tickerPlaceholder: '例如：DOGE, PEPE',
        tickerHelp: '代币Ticker符号（可选）',
        uploadImages: '上传Meme角色图片',
        uploadPrompt: '点击上传或拖拽文件',
        uploadFormat: 'PNG, JPG, WEBP（每张最多10MB）',
        uploadCount: '张图片已上传',
        removeBackground: '自动移除背景（推荐，获得更好效果）',
        uploadHelp: '上传你的Meme角色/IP图片。AI将使用它生成所有视觉资产（Logo、Banner、PFP等）。',
        description: '项目描述',
        descriptionPlaceholder: '描述你的项目概念、目标受众和独特价值...',
        descriptionHelp: '提供的细节越多，AI生成的资产质量越好',
        styleTemplate: '视觉风格模板',
        styleTemplatePlaceholder: '选择风格模板',
        styleTemplateHelp: '为你的品牌资产选择视觉风格（影响logo、网站和所有视觉元素）',
        primary: '主图',
        imageSizeError: '图片大小必须小于10MB',
      },
      styles: {
        retroGaming: { name: '复古游戏', description: '8位像素艺术，霓虹色彩，街机氛围' },
        cyberpunk: { name: '赛博朋克', description: '红黑配色，未来科技，霓虹美学' },
        minimalist: { name: '极简主义', description: '简洁线条，单色调，现代简约' },
        internetMeme: { name: '网络梅姆', description: '手绘风格，卡通角色，俏皮活泼' },
      },
      assets: {
        logo: 'Logo (PNG, SVG)',
        banner: 'Banner (Twitter/X)',
        pfp: '头像 (PFP)',
        poster: '宣传海报',
        narrative: '项目叙事',
        whitepaper: '白皮书草稿',
        tweets: '启动推文 (5条)',
        landingPage: '落地页 HTML',
      },
      buttons: {
        uploadingImage: '上传图片中...',
        generatingAssets: '生成资产中...',
        launchProject: '启动项目',
        cancel: '取消',
      },
    },
    dashboard: {
      tabs: {
        projects: '我的项目',
        orders: '我的订单',
      },
      page: {
        title: '项目仪表板',
        systemOnline: '系统在线',
        newProject: '新建项目',
        generationHistory: '生成历史',
        yourProjects: '你的项目',
      },
      orders: {
        title: '我的定制订单',
        empty: '暂无订单',
        emptyDescription: '您还没有提交任何定制订单。访问供应链页面开始您的第一个订单。',
        emptyButton: '浏览供应链',
        orderNumber: '订单编号',
        productType: '产品类型',
        quantity: '数量',
        budget: '预算',
        contact: '联系人',
        files: '附件',
        description: '需求描述',
        createdAt: '创建时间',
        viewFile: '查看',
      },
      stats: {
        totalProjects: '总项目数',
        completed: '已完成',
        inProgress: '进行中',
      },
      empty: {
        title: '还没有项目',
        description: '使用我们的Launch自动化引擎启动你的第一个Meme项目',
        button: '创建第一个项目',
      },
      project: {
        noDescription: '无描述',
        ticker: 'Ticker',
        created: '创建时间',
        viewDetails: '查看详情',
        delete: '删除',
        confirmDelete: '确定要删除这个项目吗？',
        deleteSuccess: '项目删除成功',
        deleteError: '删除项目失败',
      },
      status: {
        completed: '已完成',
        generating: '生成中',
        failed: '失败',
        pending: '等待中',
      },
    },
    customOrder: {
      page: {
        tag: '供应链定制',
        title: '定制生产订单',
        subtitle: '从设计到交付，我们为你的Meme项目周边提供全流程服务',
      },
      form: {
        productType: '产品类型',
        productTypePlaceholder: '选择产品类别',
        quantity: '订单数量',
        quantityPlaceholder: '输入数量（最低100件）',
        budget: '预算范围',
        budgetPlaceholder: '选择你的预算',
        description: '需求描述',
        descriptionPlaceholder: '描述你的定制需求、设计要求、材质偏好等...',
        uploadFiles: '上传设计文件',
        uploadPrompt: '点击上传或拖拽文件',
        uploadFormat: 'PNG, JPG, PDF, AI（单个文件最大10MB）',
        uploadCount: '个文件已上传',
        contactName: '联系人',
        contactNamePlaceholder: '你的姓名',
        contactEmail: '邮箱地址',
        contactEmailPlaceholder: 'your@email.com',
        contactPhone: '电话号码',
        contactPhonePlaceholder: '+86 138 0000 0000',
      },
      productTypes: {
        merchandise: { name: '周边商品', description: 'T恤、卫衣、帽子、贴纸等' },
        packaging: { name: '包装设计', description: '定制盒子、袋子、标签等' },
        manufacturing: { name: '定制生产', description: '玩具、手办、收藏品等' },
        logistics: { name: '物流服务', description: '仓储、配送、发货等' },
      },
      budgets: {
        small: '￥1,000 - ￥5,000',
        medium: '￥5,000 - ￥20,000',
        large: '￥20,000 - ￥50,000',
        enterprise: '￥50,000+',
      },
      buttons: {
        submit: '提交订单需求',
        submitting: '提交中...',
      },
      success: {
        title: '订单需求已提交！',
        description: '我们的供应链团队将审核你的需求，并24小时内联系你。',
        button: '返回供应链',
      },
    },
  },
};
