import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { ShoppingCart, TrendingUp, Award, Users, Star, ArrowRight, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Store() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const features = [
    {
      icon: ShoppingCart,
      key: "marketplace"
    },
    {
      icon: TrendingUp,
      key: "hotlist"
    },
    {
      icon: Award,
      key: "quality"
    },
    {
      icon: Users,
      key: "community"
    }
  ];

  const topProducts = [
    {
      key: "wojak",
      sales: "10,000+",
      rating: 4.8,
      price: "$29.99",
      image: "🧸"
    },
    {
      key: "pepe",
      sales: "8,500+",
      rating: 4.9,
      price: "$39.99",
      image: "👕"
    },
    {
      key: "doge",
      sales: "7,200+",
      rating: 4.7,
      price: "$19.99",
      image: "☕"
    },
    {
      key: "labubu",
      sales: "6,800+",
      rating: 4.9,
      price: "$49.99",
      image: "🎨"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-primary/30 bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/EZ.png" alt="EZCTO" className="h-10" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-mono hover:text-primary transition-colors">
              {t('nav.home')}
            </Link>
            <Link href="/templates" className="text-sm font-mono hover:text-primary transition-colors">
              {t('nav.templates')}
            </Link>
            <Link href="/supply" className="text-sm font-mono hover:text-primary transition-colors">
              {t('nav.supply')}
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="outline" className="font-mono border-2 border-primary text-primary hover:bg-primary hover:text-black">
                  {t('nav.dashboard')}
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="outline" className="font-mono border-2 border-primary text-primary hover:bg-primary hover:text-black">
                  {t('nav.login')}
                </Button>
              </a>
            )}
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 scanline opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-block px-4 py-2 border-2 border-primary bg-primary/10 mb-6">
            <span className="text-sm font-mono font-bold uppercase tracking-wider">
              {t('store.page.tag')}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-mono font-bold mb-6 tracking-tight">
            {t('store.page.title').includes('=') ? (
              <>
                <span className="text-primary">{t('store.page.title').split('=')[0].trim()}</span>
                <span className="mx-2">=</span>
                <span className="text-primary">{t('store.page.title').split('=')[1].trim()}</span>
              </>
            ) : (
              <>
                <span className="text-primary">Hot List</span>
                <span className="mx-2">=</span>
                <br className="md:hidden" />
                <span className="text-primary">Value Discovery Standard</span>
              </>
            )}
          </h1>
          <p className="text-xl md:text-2xl font-mono text-muted-foreground mb-8 max-w-3xl mx-auto">
            {t('store.page.subtitle')}
            <br />
            {t('store.page.subtitleLine2')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80" disabled>
              {t('store.page.comingSoon')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="font-mono text-lg px-8 py-6 border-2 border-primary text-primary hover:bg-primary hover:text-black" disabled>
              <ExternalLink className="mr-2 h-5 w-5" />
              {t('store.page.previewStore')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('store.page.whyTitle')}</h2>
            <p className="text-xl text-muted-foreground font-mono">{t('store.page.whySubtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:border-primary">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">{t(`store.features.${feature.key}.title`)}</h3>
                </div>
                <p className="text-muted-foreground mb-4 font-mono text-sm">{t(`store.features.${feature.key}.description`)}</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm font-mono">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>{t(`store.features.${feature.key}.benefit1`)}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm font-mono">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>{t(`store.features.${feature.key}.benefit2`)}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm font-mono">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>{t(`store.features.${feature.key}.benefit3`)}</span>
                  </li>
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('store.page.topProductsTitle')}</h2>
            <p className="text-xl text-muted-foreground font-mono">{t('store.page.topProductsSubtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topProducts.map((product, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:border-primary">
                <div className="text-6xl text-center mb-4">{product.image}</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-primary font-bold">#{index + 1}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-mono">{product.rating}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{t(`store.products.${product.key}.name`)}</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground font-mono">{t('store.page.salesLabel')} {product.sales}</span>
                  <span className="text-lg font-bold text-primary">{product.price}</span>
                </div>
                <Button className="w-full font-mono bg-primary text-black hover:bg-primary/80" disabled>
                  {t('store.page.comingSoon')}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Value Discovery */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('store.page.valueTitle')}</h2>
            <p className="text-xl text-muted-foreground mb-8 font-mono whitespace-pre-line">
              {t('store.page.valueDescription')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">100K+</div>
                <p className="text-sm font-mono text-muted-foreground">{t('store.page.stats.users')}</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">$2M+</div>
                <p className="text-sm font-mono text-muted-foreground">{t('store.page.stats.gmv')}</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <p className="text-sm font-mono text-muted-foreground">{t('store.page.stats.brands')}</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('store.page.ctaTitle')}</h2>
          <p className="text-xl text-muted-foreground mb-8 font-mono">
            {t('store.page.ctaSubtitle')}
          </p>
          {isAuthenticated ? (
            <Link href="/launch">
              <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
                {t('store.page.ctaButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
                {t('store.page.ctaButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t-2 border-primary/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-mono text-muted-foreground">
            © 2026 EZCTO. Powered by AI · Built for Meme Economy
          </p>
        </div>
      </footer>
    </div>
  );
}
