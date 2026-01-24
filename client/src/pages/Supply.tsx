import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Package, Truck, Factory, ShoppingBag, CheckCircle, ArrowRight } from "lucide-react";

export default function Supply() {
  const { isAuthenticated } = useAuth();

  const services = [
    {
      icon: Factory,
      title: "定制生产",
      description: "连接全球优质工厂，支持小批量定制生产",
      features: ["MOQ低至50件", "7-15天交付", "质量保证"]
    },
    {
      icon: Package,
      title: "包装设计",
      description: "专业包装设计团队，打造独特品牌体验",
      features: ["3D效果图", "环保材料", "品牌定制"]
    },
    {
      icon: Truck,
      title: "物流配送",
      description: "全球物流网络，快速可靠的配送服务",
      features: ["全球配送", "实时追踪", "保险保障"]
    },
    {
      icon: ShoppingBag,
      title: "库存管理",
      description: "智能库存系统，优化成本降低风险",
      features: ["零库存风险", "按需生产", "数据分析"]
    }
  ];

  const partners = [
    { name: "优质工厂A", category: "毛绒玩具", capacity: "月产10万件" },
    { name: "优质工厂B", category: "服装印花", capacity: "月产5万件" },
    { name: "优质工厂C", category: "周边配件", capacity: "月产20万件" },
    { name: "优质工厂D", category: "包装印刷", capacity: "月产50万件" }
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
              首页
            </Link>
            <Link href="/templates" className="text-sm font-mono hover:text-primary transition-colors">
              Templates
            </Link>
            <Link href="/store" className="text-sm font-mono hover:text-primary transition-colors">
              EZSTORE
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="outline" className="font-mono border-2 border-primary text-primary hover:bg-primary hover:text-black">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="outline" className="font-mono border-2 border-primary text-primary hover:bg-primary hover:text-black">
                  登录
                </Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 scanline opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-block px-4 py-2 border-2 border-primary bg-primary/10 mb-6">
            <span className="text-sm font-mono font-bold uppercase tracking-wider">
              IP实体化供应链
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-mono font-bold mb-6 tracking-tight">
            从<span className="text-primary">数字共识</span>到<span className="text-primary">物理信仰</span>
          </h1>
          <p className="text-xl md:text-2xl font-mono text-muted-foreground mb-8 max-w-3xl mx-auto">
            连接全球优质供应链，将你的Meme IP转化为实体商品
            <br />
            小批量定制 · 快速交付 · 零库存风险
          </p>
          <div className="flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/launch">
                <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80">
                  开始定制
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80">
                  开始定制
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">一站式供应链服务</h2>
            <p className="text-xl text-muted-foreground font-mono">从设计到交付，全程无忧</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:border-primary">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <service.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">{service.title}</h3>
                </div>
                <p className="text-muted-foreground mb-4 font-mono text-sm">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm font-mono">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">合作工厂网络</h2>
            <p className="text-xl text-muted-foreground font-mono">严选全球优质制造商</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partners.map((partner, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Factory className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{partner.name}</h3>
                <p className="text-sm text-muted-foreground mb-1 font-mono">{partner.category}</p>
                <p className="text-xs text-primary font-mono font-bold">{partner.capacity}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">准备好将你的IP实体化了吗？</h2>
          <p className="text-xl text-muted-foreground mb-8 font-mono">
            立即开始，让你的Meme从屏幕走向现实
          </p>
          {isAuthenticated ? (
            <Link href="/launch">
              <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
                立即开始定制
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
                立即开始定制
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
            © 2026 EZCTO. Powered by Manus.
          </p>
        </div>
      </footer>
    </div>
  );
}
