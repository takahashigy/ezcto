/**
 * Website Template System
 * Generates complete HTML websites based on AI analysis and user data
 */

import type { ProjectAnalysis } from "./aiAnalyzer";

export interface TemplateData {
  projectName: string;
  ticker: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
  websiteUrl?: string;
  contractAddress?: string;
}

/**
 * Generate complete HTML website
 */
export function generateWebsiteHTML(
  data: TemplateData,
  analysis: ProjectAnalysis
): string {
  const { colorPalette, layoutStyle, vibe } = analysis;

  // Generate sections based on narrative type
  const sections = generateSections(data, analysis);

  // Generate CSS based on analysis
  const customCSS = generateCustomCSS(colorPalette, layoutStyle, vibe);

  // Assemble complete HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHTML(data.description)}">
  <meta property="og:title" content="${escapeHTML(data.projectName)} - ${escapeHTML(data.ticker)}">
  <meta property="og:description" content="${escapeHTML(data.description)}">
  <meta property="og:image" content="${data.bannerUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(data.projectName)} - ${escapeHTML(data.ticker)}">
  <meta name="twitter:description" content="${escapeHTML(data.description)}">
  <meta name="twitter:image" content="${data.bannerUrl}">
  <title>${escapeHTML(data.projectName)} - ${escapeHTML(data.ticker)}</title>
  
  <style>
    ${customCSS}
  </style>
</head>
<body>
  ${sections}
  
  <script>
    ${generateJavaScript()}
  </script>
</body>
</html>`;
}

/**
 * Generate sections based on narrative type and layout style
 */
function generateSections(
  data: TemplateData,
  analysis: ProjectAnalysis
): string {
  const { narrativeType, layoutStyle } = analysis;

  let sections = "";

  // Hero section (all websites have this)
  sections += generateHeroSection(data, analysis);

  // Add sections based on narrative type
  if (narrativeType === "community") {
    sections += generateCommunitySection(data);
    sections += generateSocialLinksSection(data);
  } else if (narrativeType === "tech") {
    sections += generateFeaturesSection(data);
    sections += generateRoadmapSection(data);
  } else if (narrativeType === "culture") {
    sections += generateMemeGallerySection(data);
    sections += generateCommunitySection(data);
  } else if (narrativeType === "gaming") {
    sections += generateGameFeaturesSection(data);
    sections += generateTokenomicsSection(data);
  }

  // All websites have footer
  sections += generateFooterSection(data);

  return sections;
}

/**
 * Generate Hero section
 */
function generateHeroSection(
  data: TemplateData,
  analysis: ProjectAnalysis
): string {
  const { layoutStyle } = analysis;

  if (layoutStyle === "minimal") {
    return `
  <section class="hero minimal">
    <div class="hero-content">
      <img src="${data.logoUrl}" alt="${escapeHTML(data.projectName)} Logo" class="hero-logo">
      <h1>${escapeHTML(data.projectName)}</h1>
      <p class="ticker">$${escapeHTML(data.ticker)}</p>
      <p class="tagline">${escapeHTML(data.description)}</p>
      ${generateSocialButtons(data)}
    </div>
  </section>`;
  } else if (layoutStyle === "playful") {
    return `
  <section class="hero playful">
    <div class="hero-bg-decorations">
      <div class="decoration cloud"></div>
      <div class="decoration star"></div>
      <div class="decoration coin"></div>
    </div>
    <div class="hero-content">
      <img src="${data.logoUrl}" alt="${escapeHTML(data.projectName)} Logo" class="hero-logo bounce">
      <h1 class="comic-text">${escapeHTML(data.projectName)}</h1>
      <p class="ticker">$${escapeHTML(data.ticker)}</p>
      <p class="tagline">${escapeHTML(data.description)}</p>
      ${generateSocialButtons(data)}
    </div>
  </section>`;
  } else if (layoutStyle === "cyberpunk") {
    return `
  <section class="hero cyberpunk">
    <div class="cyber-grid"></div>
    <div class="hero-content">
      <img src="${data.logoUrl}" alt="${escapeHTML(data.projectName)} Logo" class="hero-logo glow">
      <h1 class="neon-text">${escapeHTML(data.projectName)}</h1>
      <p class="ticker glitch">$${escapeHTML(data.ticker)}</p>
      <p class="tagline">${escapeHTML(data.description)}</p>
      ${generateSocialButtons(data)}
    </div>
  </section>`;
  } else {
    // retro
    return `
  <section class="hero retro">
    <div class="terminal-bg"></div>
    <div class="hero-content">
      <img src="${data.logoUrl}" alt="${escapeHTML(data.projectName)} Logo" class="hero-logo pixelated">
      <h1 class="terminal-text">&gt; ${escapeHTML(data.projectName)}</h1>
      <p class="ticker">$${escapeHTML(data.ticker)}</p>
      <p class="tagline">${escapeHTML(data.description)}</p>
      ${generateSocialButtons(data)}
    </div>
  </section>`;
  }
}

/**
 * Generate social buttons
 */
function generateSocialButtons(data: TemplateData): string {
  const buttons: string[] = [];

  if (data.twitterUrl) {
    buttons.push(
      `<a href="${data.twitterUrl}" target="_blank" rel="noopener noreferrer" class="social-btn">Twitter</a>`
    );
  }
  if (data.telegramUrl) {
    buttons.push(
      `<a href="${data.telegramUrl}" target="_blank" rel="noopener noreferrer" class="social-btn">Telegram</a>`
    );
  }
  if (data.discordUrl) {
    buttons.push(
      `<a href="${data.discordUrl}" target="_blank" rel="noopener noreferrer" class="social-btn">Discord</a>`
    );
  }

  if (buttons.length === 0) return "";

  return `<div class="social-links">${buttons.join("")}</div>`;
}

/**
 * Generate Community section
 */
function generateCommunitySection(data: TemplateData): string {
  return `
  <section class="community">
    <div class="container">
      <h2>Join Our Community</h2>
      <p>Be part of the ${escapeHTML(data.projectName)} movement. Together, we're building something special.</p>
      ${generateSocialButtons(data)}
    </div>
  </section>`;
}

/**
 * Generate Social Links section
 */
function generateSocialLinksSection(data: TemplateData): string {
  return `
  <section class="social-section">
    <div class="container">
      <h2>Connect With Us</h2>
      ${generateSocialButtons(data)}
    </div>
  </section>`;
}

/**
 * Generate Features section
 */
function generateFeaturesSection(data: TemplateData): string {
  return `
  <section class="features">
    <div class="container">
      <h2>Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>Innovative</h3>
          <p>Cutting-edge technology powering ${escapeHTML(data.projectName)}</p>
        </div>
        <div class="feature-card">
          <h3>Community-Driven</h3>
          <p>Built by the community, for the community</p>
        </div>
        <div class="feature-card">
          <h3>Transparent</h3>
          <p>Open and honest about our goals and progress</p>
        </div>
      </div>
    </div>
  </section>`;
}

/**
 * Generate Roadmap section
 */
function generateRoadmapSection(data: TemplateData): string {
  return `
  <section class="roadmap">
    <div class="container">
      <h2>Roadmap</h2>
      <div class="roadmap-timeline">
        <div class="roadmap-item">
          <h3>Phase 1: Launch</h3>
          <p>Initial token launch and community building</p>
        </div>
        <div class="roadmap-item">
          <h3>Phase 2: Growth</h3>
          <p>Expand partnerships and ecosystem</p>
        </div>
        <div class="roadmap-item">
          <h3>Phase 3: Scale</h3>
          <p>Global expansion and mass adoption</p>
        </div>
      </div>
    </div>
  </section>`;
}

/**
 * Generate Meme Gallery section
 */
function generateMemeGallerySection(data: TemplateData): string {
  return `
  <section class="meme-gallery">
    <div class="container">
      <h2>Meme Gallery</h2>
      <div class="gallery-grid">
        <div class="gallery-item">
          <img src="${data.logoUrl}" alt="Meme 1">
        </div>
        <div class="gallery-item">
          <img src="${data.bannerUrl}" alt="Meme 2">
        </div>
      </div>
    </div>
  </section>`;
}

/**
 * Generate Game Features section
 */
function generateGameFeaturesSection(data: TemplateData): string {
  return `
  <section class="game-features">
    <div class="container">
      <h2>Game Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>Play to Earn</h3>
          <p>Earn rewards while playing</p>
        </div>
        <div class="feature-card">
          <h3>NFT Integration</h3>
          <p>Unique collectibles and assets</p>
        </div>
        <div class="feature-card">
          <h3>Community Events</h3>
          <p>Regular tournaments and challenges</p>
        </div>
      </div>
    </div>
  </section>`;
}

/**
 * Generate Tokenomics section
 */
function generateTokenomicsSection(data: TemplateData): string {
  return `
  <section class="tokenomics">
    <div class="container">
      <h2>Tokenomics</h2>
      <div class="tokenomics-chart">
        <div class="tokenomics-item">
          <span class="label">Liquidity</span>
          <span class="value">40%</span>
        </div>
        <div class="tokenomics-item">
          <span class="label">Community</span>
          <span class="value">30%</span>
        </div>
        <div class="tokenomics-item">
          <span class="label">Team</span>
          <span class="value">20%</span>
        </div>
        <div class="tokenomics-item">
          <span class="label">Marketing</span>
          <span class="value">10%</span>
        </div>
      </div>
    </div>
  </section>`;
}

/**
 * Generate Footer section
 */
function generateFooterSection(data: TemplateData): string {
  return `
  <footer>
    <div class="container">
      <p>&copy; 2026 ${escapeHTML(data.projectName)}. All rights reserved.</p>
      ${data.contractAddress ? `<p class="contract">Contract: ${escapeHTML(data.contractAddress)}</p>` : ""}
      ${generateSocialButtons(data)}
    </div>
  </footer>`;
}

/**
 * Generate custom CSS based on analysis
 */
function generateCustomCSS(
  colorPalette: ProjectAnalysis["colorPalette"],
  layoutStyle: string,
  vibe: string
): string {
  const animationSpeed = vibe === "energetic" ? "0.3s" : "0.6s";

  return `
    /* CSS Variables */
    :root {
      --primary: ${colorPalette.primary};
      --secondary: ${colorPalette.secondary};
      --background: ${colorPalette.background};
      --text: ${colorPalette.text};
      --accent: ${colorPalette.accent};
      --animation-speed: ${animationSpeed};
    }

    /* Reset & Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: var(--background);
      color: var(--text);
      line-height: 1.6;
      overflow-x: hidden;
    }

    /* Container */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    /* Section Base */
    section {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 4rem 2rem;
      position: relative;
    }

    /* Typography */
    h1 {
      font-size: clamp(2.5rem, 8vw, 5rem);
      font-weight: 900;
      margin-bottom: 1rem;
      line-height: 1.1;
    }

    h2 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800;
      margin-bottom: 2rem;
      text-align: center;
    }

    h3 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 700;
      margin-bottom: 1rem;
    }

    p {
      font-size: clamp(1rem, 2vw, 1.25rem);
      margin-bottom: 1rem;
    }

    /* Hero Section */
    .hero {
      text-align: center;
      position: relative;
      z-index: 1;
    }

    .hero-content {
      position: relative;
      z-index: 2;
    }

    .hero-logo {
      width: clamp(200px, 40vw, 400px);
      height: auto;
      margin-bottom: 2rem;
      animation: fadeInUp var(--animation-speed) ease-out;
    }

    .ticker {
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 1rem;
    }

    .tagline {
      font-size: clamp(1rem, 2.5vw, 1.5rem);
      max-width: 600px;
      margin: 0 auto 2rem;
      opacity: 0.9;
    }

    /* Social Links */
    .social-links {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 2rem;
    }

    .social-btn {
      padding: 1rem 2rem;
      background: var(--primary);
      color: var(--background);
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 1.1rem;
      transition: all var(--animation-speed) ease;
      display: inline-block;
    }

    .social-btn:hover {
      background: var(--secondary);
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    /* Layout Style: Minimal */
    .hero.minimal {
      background: var(--background);
    }

    .hero.minimal .hero-logo {
      border-radius: 50%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    /* Layout Style: Playful */
    .hero.playful {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
    }

    .hero.playful .hero-logo.bounce {
      animation: bounce 2s ease-in-out infinite;
    }

    .hero-bg-decorations {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 0;
    }

    .decoration {
      position: absolute;
      opacity: 0.3;
    }

    .decoration.cloud {
      width: 100px;
      height: 60px;
      background: white;
      border-radius: 50px;
      top: 10%;
      left: 10%;
      animation: float 6s ease-in-out infinite;
    }

    .decoration.star {
      width: 50px;
      height: 50px;
      background: white;
      clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
      top: 20%;
      right: 15%;
      animation: twinkle 3s ease-in-out infinite;
    }

    .decoration.coin {
      width: 60px;
      height: 60px;
      background: gold;
      border-radius: 50%;
      border: 3px solid orange;
      bottom: 20%;
      right: 20%;
      animation: spin 4s linear infinite;
    }

    /* Layout Style: Cyberpunk */
    .hero.cyberpunk {
      background: #000;
      color: #0ff;
      position: relative;
    }

    .cyber-grid {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(0deg, transparent 24%, rgba(0, 255, 255, 0.05) 25%, rgba(0, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.05) 75%, rgba(0, 255, 255, 0.05) 76%, transparent 77%, transparent),
        linear-gradient(90deg, transparent 24%, rgba(0, 255, 255, 0.05) 25%, rgba(0, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.05) 75%, rgba(0, 255, 255, 0.05) 76%, transparent 77%, transparent);
      background-size: 50px 50px;
      z-index: 0;
    }

    .hero.cyberpunk .hero-logo.glow {
      filter: drop-shadow(0 0 20px var(--primary));
    }

    .neon-text {
      color: var(--primary);
      text-shadow: 
        0 0 10px var(--primary),
        0 0 20px var(--primary),
        0 0 30px var(--primary);
    }

    .glitch {
      animation: glitch 1s ease-in-out infinite;
    }

    /* Layout Style: Retro */
    .hero.retro {
      background: #000;
      color: #0f0;
      font-family: 'Courier New', monospace;
    }

    .terminal-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 255, 0, 0.03) 0px,
        rgba(0, 255, 0, 0.03) 1px,
        transparent 1px,
        transparent 2px
      );
      z-index: 0;
    }

    .terminal-text {
      font-family: 'Courier New', monospace;
      color: #0f0;
      text-shadow: 0 0 10px #0f0;
    }

    .hero.retro .hero-logo.pixelated {
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
      image-rendering: crisp-edges;
    }

    /* Feature Grid */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.05);
      padding: 2rem;
      border-radius: 20px;
      border: 2px solid var(--primary);
      transition: all var(--animation-speed) ease;
    }

    .feature-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      border-color: var(--secondary);
    }

    /* Roadmap */
    .roadmap-timeline {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .roadmap-item {
      background: rgba(255, 255, 255, 0.05);
      padding: 2rem;
      border-radius: 15px;
      border-left: 5px solid var(--primary);
    }

    /* Gallery */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }

    .gallery-item img {
      width: 100%;
      height: auto;
      border-radius: 15px;
      transition: transform var(--animation-speed) ease;
    }

    .gallery-item img:hover {
      transform: scale(1.05);
    }

    /* Tokenomics */
    .tokenomics-chart {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .tokenomics-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 15px;
    }

    .tokenomics-item .label {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    .tokenomics-item .value {
      font-size: 2.5rem;
      font-weight: 900;
      color: var(--primary);
    }

    /* Footer */
    footer {
      background: rgba(0, 0, 0, 0.5);
      padding: 3rem 2rem;
      text-align: center;
    }

    footer .contract {
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      opacity: 0.7;
      margin-top: 1rem;
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-30px); }
    }

    @keyframes twinkle {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes glitch {
      0%, 100% { transform: translate(0); }
      20% { transform: translate(-2px, 2px); }
      40% { transform: translate(-2px, -2px); }
      60% { transform: translate(2px, 2px); }
      80% { transform: translate(2px, -2px); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      section {
        padding: 3rem 1rem;
      }

      .container {
        padding: 0 1rem;
      }

      .feature-grid,
      .gallery-grid,
      .tokenomics-chart {
        grid-template-columns: 1fr;
      }
    }
  `;
}

/**
 * Generate JavaScript for interactions
 */
function generateJavaScript(): string {
  return `
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(30px)';
      section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(section);
    });

    // Copy contract address (if exists)
    const contractElement = document.querySelector('.contract');
    if (contractElement) {
      contractElement.style.cursor = 'pointer';
      contractElement.addEventListener('click', () => {
        const address = contractElement.textContent.replace('Contract: ', '');
        navigator.clipboard.writeText(address).then(() => {
          const originalText = contractElement.textContent;
          contractElement.textContent = 'Copied!';
          setTimeout(() => {
            contractElement.textContent = originalText;
          }, 2000);
        });
      });
    }
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
