import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Package, Truck, Factory, ShoppingBag, CheckCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Supply() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const services = [
    {
      icon: Factory,
      key: "production"
    },
    {
      icon: Package,
      key: "packaging"
    },
    {
      icon: Truck,
      key: "logistics"
    },
    {
      icon: ShoppingBag,
      key: "inventory"
    }
  ];

  const partners = [
    { key: "factoryA" },
    { key: "factoryB" },
    { key: "factoryC" },
    { key: "factoryD" }
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
            <Link href="/store" className="text-sm font-mono hover:text-primary transition-colors">
              {t('nav.store')}
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
              {t('supply.page.tag')}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-mono font-bold mb-6 tracking-tight leading-tight">
            {t('supply.page.title').includes('数字共识') ? (
              <>
                {t('supply.page.title').split('数字共识')[0]}
                <span className="text-primary">数字共识</span>
                {t('supply.page.title').split('数字共识')[1]?.split('物理信仰')[0]}
                <span className="text-primary">物理信仰</span>
              </>
            ) : (
              <>
                From <span className="text-primary">Digital Consensus</span>
                <br className="md:hidden" />
                {' '}to <span className="text-primary">Physical Faith</span>
              </>
            )}
          </h1>
          <p className="text-xl md:text-2xl font-mono text-muted-foreground mb-8 max-w-3xl mx-auto">
            {t('supply.page.subtitle')}
            <br />
            {t('supply.page.subtitleLine2')}
          </p>
          <div className="flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/launch">
                <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80">
                  {t('supply.page.startButton')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80">
                  {t('supply.page.startButton')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('supply.page.servicesTitle')}</h2>
            <p className="text-xl text-muted-foreground font-mono">{t('supply.page.servicesSubtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:border-primary">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <service.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">{t(`supply.services.${service.key}.title`)}</h3>
                </div>
                <p className="text-muted-foreground mb-4 font-mono text-sm">{t(`supply.services.${service.key}.description`)}</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm font-mono">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>{t(`supply.services.${service.key}.feature1`)}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm font-mono">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>{t(`supply.services.${service.key}.feature2`)}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm font-mono">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>{t(`supply.services.${service.key}.feature3`)}</span>
                  </li>
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('supply.page.partnersTitle')}</h2>
            <p className="text-xl text-muted-foreground font-mono">{t('supply.page.partnersSubtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partners.map((partner, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Factory className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t(`supply.partners.${partner.key}.name`)}</h3>
                <p className="text-sm text-muted-foreground mb-1 font-mono">{t(`supply.partners.${partner.key}.category`)}</p>
                <p className="text-xs text-primary font-mono font-bold">{t(`supply.partners.${partner.key}.capacity`)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('supply.page.ctaTitle')}</h2>
          <p className="text-xl text-muted-foreground mb-8 font-mono">
            {t('supply.page.ctaSubtitle')}
          </p>
          {isAuthenticated ? (
            <Link href="/launch">
              <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
                {t('supply.page.ctaButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
                {t('supply.page.ctaButton')}
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
