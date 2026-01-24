import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { ArrowRight, Rocket, TrendingUp, Package, ShoppingCart, Sparkles, Wand2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="border-b-2 border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src="/EZ.png" alt="EZCTO" className="h-10" />
            </div>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/templates">
              <Button variant="ghost" className="font-mono">
                {t('nav.templates')}
              </Button>
            </Link>
            <Link href="/supply">
              <Button variant="ghost" className="font-mono">
                {t('nav.supply')}
              </Button>
            </Link>
            <Link href="/store">
              <Button variant="ghost" className="font-mono">
                {t('nav.store')}
              </Button>
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="font-mono">
                    {t('nav.dashboard')}
                  </Button>
                </Link>
                <Link href="/launch">
                  <Button className="font-mono retro-border">
                    {t('nav.launch')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost" className="font-mono">
                    Sign In
                  </Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button className="font-mono retro-border">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary bg-primary/10">
                <span className="status-indicator active"></span>
                <span className="text-sm font-mono font-bold uppercase tracking-wider">
                  {t('hero.systemOnline')}
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                {t('hero.title')}
                <br />
                <span className="text-primary glitch-text">{t('hero.titleMeme')}</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                {t('hero.description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Link href="/launch">
                    <Button size="lg" className="font-mono text-lg retro-border w-full sm:w-auto">
                      <Rocket className="mr-2 h-5 w-5" />
                      Launch Your Project
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="font-mono text-lg retro-border w-full sm:w-auto">
                      <Rocket className="mr-2 h-5 w-5" />
                      Start Building
                    </Button>
                  </a>
                )}
                <Link href="/templates">
                  <Button size="lg" variant="outline" className="font-mono text-lg w-full sm:w-auto">
                    View Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">10min</div>
                  <div className="text-sm text-muted-foreground">Launch Time</div>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div>
                  <div className="text-3xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">Automated</div>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div>
                  <div className="text-3xl font-bold text-primary">∞</div>
                  <div className="text-sm text-muted-foreground">Potential</div>
                </div>
              </div>
            </div>

            {/* Right: Cyborg Visual */}
            <div className="relative">
              <div className="relative z-10 data-flow-bg rounded-lg p-8">
                <img 
                  src="/Pearl.png" 
                  alt="EZCTO Pearl" 
                  className="w-full h-auto drop-shadow-2xl"
                />
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 opacity-60 hover:opacity-100 transition-opacity duration-300">
                <img 
                  src="/favicon.png" 
                  alt="Cyborg Decoration" 
                  className="w-full h-full object-cover rounded-lg border-2 border-primary/50"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 opacity-60 hover:opacity-100 transition-opacity duration-300">
                <img 
                  src="/PFP2.png" 
                  alt="Cyborg Decoration" 
                  className="w-full h-full object-cover rounded-lg border-2 border-primary/50"
                />
              </div>
              
              {/* Decorative PFP Image */}
              <div className="absolute -bottom-8 -right-8 w-24 h-24 opacity-60 hover:opacity-100 transition-opacity duration-300">
                <img 
                  src="/PFP.png" 
                  alt="Cyborg PFP" 
                  className="w-full h-full object-cover rounded-lg border-2 border-primary/50"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pay Meme Formula */}
      <section className="py-12 bg-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="font-mono text-3xl md:text-4xl lg:text-5xl text-muted-foreground/60">
              {t('formula.onlyPayDex')}
            </div>
            <div className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold text-primary whitespace-nowrap">
              {t('formula.payDexMeme')}
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-card/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('barriers.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('barriers.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: t('barriers.launch.title'),
                problem: t('barriers.launch.problem'),
                solution: t('barriers.launch.solution')
              },
              {
                title: t('barriers.capability.title'),
                problem: t('barriers.capability.problem'),
                solution: t('barriers.capability.solution')
              },
              {
                title: t('barriers.traffic.title'),
                problem: t('barriers.traffic.problem'),
                solution: t('barriers.traffic.solution')
              }
            ].map((item, i) => (
              <div key={i} className="module-card">
                <div className="text-primary font-bold text-sm mb-2">PROBLEM #{i + 1}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{item.problem}</p>
                <div className="border-t-2 border-primary pt-4">
                  <div className="text-primary font-bold text-xs mb-1">SOLUTION</div>
                  <p className="text-sm">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four Core Modules */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 border-2 border-primary bg-primary/10 mb-4">
              <span className="text-sm font-mono font-bold uppercase tracking-wider">
                Core Modules
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              全生命周期解决方案
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              从启动、增长、变现到价值发现，EZCTO提供完整的Meme项目生态系统
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Module 1: Launch Engine */}
            <div className="module-card group">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 border-2 border-primary bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Launch自动化引擎</h3>
                  <div className="text-sm text-primary font-mono">STANDARD VERSION</div>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6">
                10分钟内自动化生成并交付一整套专业级启动资产：Logo、Banner、PFP、海报、官方网站、核心文案。抬高行业下限，成为Meme项目启动的"及格线"。
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1 h-1 bg-primary"></div>
                  <span>品牌视觉：Logo, Banner, PFP, 海报</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1 h-1 bg-primary"></div>
                  <span>官方网站：一键生成并部署</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1 h-1 bg-primary"></div>
                  <span>核心文案：项目叙事、白皮书、推文</span>
                </div>
              </div>
              
              {isAuthenticated ? (
                <Link href="/launch">
                  <Button className="w-full font-mono retro-border">
                    Start Launch
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()} className="block">
                  <Button className="w-full font-mono retro-border">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>

            {/* Module 2: IP Merchandise Supply Chain */}
            <Link href="/supply" className="block">
              <div className="module-card hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 border-2 border-primary bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">IP实体化供应链</h3>
                    <span className="coming-soon-badge">Coming Soon</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  打通次元壁，将数字IP转化为"物理信仰"。整合全球顶级供应链，提供从设计、打样、生产到全球配送的一站式C2M服务。
                </p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1 h-1 bg-muted-foreground"></div>
                    <span>C2M对接全球供应链</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1 h-1 bg-muted-foreground"></div>
                    <span>AI效果图生成</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1 h-1 bg-muted-foreground"></div>
                    <span>从设计到全球配送</span>
                  </div>
                </div>
                
                <Button className="w-full font-mono retro-border">
                  查看供应链
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Link>

            {/* Module 3: Official Meme Marketplace */}
            <Link href="/store" className="block">
              <div className="module-card hover:border-primary/50 transition-all cursor-pointer">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 border-2 border-primary bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">EZCTO官方商城</h3>
                  <span className="coming-soon-badge">Coming Soon</span>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Meme实体经济的“价值发现平台”。聚合所有优质Meme周边，热销榜单成为衡量项目真实社区凝聚力和长期潜力的“数据预言机”。
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>聚合销售平台</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>“热销榜”即“Alpha榜”</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>IP价值试金石</span>
                </div>
              </div>
              
              <Button className="w-full font-mono retro-border">
                进入商城
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              </div>
            </Link>

            {/* Module 4: Social Distribution Network */}
            <div className="module-card opacity-75">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 border-2 border-border bg-muted flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{t('modules.sdn.title')}</h3>
                  <span className="coming-soon-badge">{t('modules.sdn.tag')}</span>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6">
                {t('modules.sdn.description')}
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>{t('modules.sdn.features.ai')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>{t('modules.sdn.features.tiktok')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>{t('modules.sdn.features.data')}</span>
                </div>
              </div>
              
              <Button className="w-full font-mono" variant="outline" disabled>
                {t('modules.sdn.comingSoon')}
              </Button>
            </div>

            {/* Module 5: Alchemy Plan - Meme-Specific AI Model */}
            <div className="module-card opacity-75">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 border-2 border-border bg-muted flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{t('modules.alchemy.title')}</h3>
                  <span className="coming-soon-badge">{t('modules.alchemy.tag')}</span>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6">
                {t('modules.alchemy.description')}
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>{t('modules.alchemy.features.sd')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>{t('modules.alchemy.features.meme')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>{t('modules.alchemy.features.quality')}</span>
                </div>
              </div>
              
              <Button className="w-full font-mono" variant="outline" disabled>
                {t('modules.alchemy.comingSoon')}
              </Button>
            </div>

            {/* Module 6: Lora Forge - Custom Character Training */}
            <div className="module-card opacity-75">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 border-2 border-border bg-muted flex items-center justify-center flex-shrink-0">
                  <Wand2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{t('modules.lora.title')}</h3>
                  <span className="coming-soon-badge">{t('modules.lora.tag')}</span>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6">
                {t('modules.lora.description')}
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>{t('modules.lora.features.exclusive')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>{t('modules.lora.features.consistency')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground"></div>
                  <span>{t('modules.lora.features.lifecycle')}</span>
                </div>
              </div>
              
              <Button className="w-full font-mono" variant="outline" disabled>
                {t('modules.lora.comingSoon')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Flywheel */}
      <section className="py-20 bg-card/30">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              正向飞轮生态
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                用<span className="text-primary font-bold">自动化引擎</span>作为流量入口，吸引海量项目方
              </p>
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-primary rotate-90" />
              </div>
              <p>
                <span className="text-primary font-bold">炼丹计划</span>持续提升生成质量，降低启动门槛，吸引更多项目方
              </p>
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-primary rotate-90" />
              </div>
              <p>
                用<span className="text-primary font-bold">社交分发网络</span>筛选并赋能高潜力项目
              </p>
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-primary rotate-90" />
              </div>
              <p>
                用<span className="text-primary font-bold">IP实体化供应链</span>帮助其商业变现
              </p>
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-primary rotate-90" />
              </div>
              <p>
                <span className="text-primary font-bold">Lora炼制工坊</span>为热门IP打造专属模型，延长生命周期，增强社区粘性
              </p>
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-primary rotate-90" />
              </div>
              <p>
                <span className="text-primary font-bold">官方商城</span>的“热销榜”成为新的价值发现标准
              </p>
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-primary rotate-90" />
              </div>
              <p className="text-xl font-bold text-foreground">
                吸引顶级明星流量，实现终极破圈
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center retro-border p-12 bg-card/50">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Launch?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              成为下一个百万级IP，从EZCTO开始
            </p>
            {isAuthenticated ? (
              <Link href="/launch">
                <Button size="lg" className="font-mono text-lg retro-border">
                  <Rocket className="mr-2 h-5 w-5" />
                  Launch Your Project Now
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="font-mono text-lg retro-border">
                  <Rocket className="mr-2 h-5 w-5" />
                  Get Started for Free
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border py-12 bg-card/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src="/EZ.png" alt="EZCTO" className="h-8 mb-4" />
              <p className="text-sm text-muted-foreground">
                全球首个Meme项目自动化CTO与IP全生命周期服务平台
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/launch">Launch Engine</Link></li>
                <li><Link href="/merch">Merch Design</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t-2 border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 EZCTO. All rights reserved.</p>
            <p className="mt-2 font-mono">SYSTEM STATUS: <span className="text-primary">ONLINE</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
