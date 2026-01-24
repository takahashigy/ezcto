import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { ShoppingCart, TrendingUp, Award, Users, Star, ArrowRight, ExternalLink } from "lucide-react";

export default function Store() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: ShoppingCart,
      title: "官方商城",
      description: "统一的品牌商城，展示所有Meme IP商品",
      benefits: ["统一流量入口", "品牌背书", "交叉销售"]
    },
    {
      icon: TrendingUp,
      title: "热销榜单",
      description: "实时更新的销售排行榜，发现价值标准",
      benefits: ["数据透明", "趋势预测", "投资参考"]
    },
    {
      icon: Award,
      title: "质量认证",
      description: "严格的商品质量把关，保证用户体验",
      benefits: ["质量保证", "退换无忧", "信誉保障"]
    },
    {
      icon: Users,
      title: "社区驱动",
      description: "用户评价和反馈驱动商品优化",
      benefits: ["真实评价", "社区共建", "持续改进"]
    }
  ];

  const topProducts = [
    {
      name: "Wojak毛绒玩具",
      sales: "10,000+",
      rating: 4.8,
      price: "$29.99",
      image: "🧸"
    },
    {
      name: "Pepe限量T恤",
      sales: "8,500+",
      rating: 4.9,
      price: "$39.99",
      image: "👕"
    },
    {
      name: "Doge马克杯",
      sales: "7,200+",
      rating: 4.7,
      price: "$19.99",
      image: "☕"
    },
    {
      name: "Labubu手办",
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
              首页
            </Link>
            <Link href="/templates" className="text-sm font-mono hover:text-primary transition-colors">
              Templates
            </Link>
            <Link href="/supply" className="text-sm font-mono hover:text-primary transition-colors">
              供应链
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
              EZSTORE官方商城
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-mono font-bold mb-6 tracking-tight">
            <span className="text-primary">热销榜</span>即<span className="text-primary">价值发现标准</span>
          </h1>
          <p className="text-xl md:text-2xl font-mono text-muted-foreground mb-8 max-w-3xl mx-auto">
            统一的品牌商城，实时销售数据，透明的价值标准
            <br />
            从商品热度预测项目潜力，吸引顶级流量破圈
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80" disabled>
              即将上线
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="font-mono text-lg px-8 py-6 border-2 border-primary text-primary hover:bg-primary hover:text-black" disabled>
              <ExternalLink className="mr-2 h-5 w-5" />
              预览商城
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">为什么选择EZSTORE？</h2>
            <p className="text-xl text-muted-foreground font-mono">统一流量入口，透明价值标准</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:border-primary">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground mb-4 font-mono text-sm">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm font-mono">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>{benefit}</span>
                    </li>
                  ))}
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">热销榜 TOP 4</h2>
            <p className="text-xl text-muted-foreground font-mono">实时销售数据，透明价值标准</p>
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
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground font-mono">销量: {product.sales}</span>
                  <span className="text-lg font-bold text-primary">{product.price}</span>
                </div>
                <Button className="w-full font-mono bg-primary text-black hover:bg-primary/80" disabled>
                  即将上线
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
            <h2 className="text-4xl md:text-5xl font-bold mb-6">热销榜 = 价值发现标准</h2>
            <p className="text-xl text-muted-foreground mb-8 font-mono">
              通过实时销售数据，EZSTORE的热销榜成为Meme项目价值的透明标准。
              <br />
              高销量商品背后的IP往往具有更强的社区共识和商业潜力，
              <br />
              吸引顶级明星流量，实现终极破圈。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">100K+</div>
                <p className="text-sm font-mono text-muted-foreground">月活用户</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">$2M+</div>
                <p className="text-sm font-mono text-muted-foreground">月GMV</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <p className="text-sm font-mono text-muted-foreground">入驻品牌</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">准备好在EZSTORE上架你的商品了吗？</h2>
          <p className="text-xl text-muted-foreground mb-8 font-mono">
            立即开始，让你的Meme IP在官方商城闪耀
          </p>
          {isAuthenticated ? (
            <Link href="/launch">
              <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
                立即入驻
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="font-mono text-lg px-8 py-6 bg-primary text-black hover:bg-primary/80 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
                立即入驻
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
