import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { ExternalLink, Download, Sparkles, Eye, X } from "lucide-react";
import { useState } from "react";

const templates = [
  {
    id: "retro-gaming",
    name: "Terminal Hacker",
    description: "黑客终端风格，绿色矩阵代码，赛博朋克科技感",
    适用场景: "技术/黑客/AI主题Meme",
    colors: ["#000000", "#00FF00", "#00FF41", "#0A0E27"],
    fonts: "Courier New, Monospace",
    thumbnail: "/templates/retro-gaming-thumb.png",
    demoUrl: "/templates/retro-gaming.html",
  },
  {
    id: "cyberpunk",
    name: "Comic Book",
    description: "卡通漫画风格，手绘装饰元素，鲜艳配色",
    适用场景: "表情包/文化meme/社区驱动项目",
    colors: ["#00BFFF", "#FFD700", "#FF6B9D", "#FFFFFF"],
    fonts: "Bangers, Luckiest Guy",
    thumbnail: "/templates/cyberpunk-thumb.png",
    demoUrl: "/templates/cyberpunk.html",
  },
  {
    id: "minimalist",
    name: "Wojak Style",
    description: "天蓝色背景，手绘装饰元素，漫画字体，完整复刻Wojak网站",
    适用场景: "表情包/情绪 meme/社区文化项目",
    colors: ["#00BFFF", "#FFD700", "#FFFFFF", "#000000"],
    fonts: "Bangers, Luckiest Guy, Roboto",
    thumbnail: "/templates/minimalist-thumb.png",
    demoUrl: "/templates/minimalist.html",
  },
  {
    id: "internet-meme",
    name: "Labubu Style",
    description: "深色背景+白色画布，虚线网格系统，像素艺术+滚动条动画",
    适用场景: "可爱/萌系/卡通风格项目",
    colors: ["#0A0E1A", "#FFFFFF", "#FFD700", "#00BFFF"],
    fonts: "Press Start 2P, Roboto",
    thumbnail: "/templates/internet-meme-thumb.png",
    demoUrl: "/templates/internet-meme.html",
  },
];

const comingSoonTemplates = [
  { name: "Vaporwave", description: "蒸汽波美学" },
  { name: "Brutalism", description: "粗野主义设计" },
  { name: "Glassmorphism", description: "玻璃拟态风格" },
];

export default function Templates() {
  const { isAuthenticated } = useAuth();
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#d1c9b8]">
      {/* Header */}
      <header className="border-b-2 border-[#00ff41]/30 bg-[#d1c9b8]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/EZ.png" alt="EZCTO" className="h-10" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-mono hover:text-[#00ff41] transition-colors">
              首页
            </Link>
            <Link href="/launch" className="text-sm font-mono hover:text-[#00ff41] transition-colors">
              Launch
            </Link>
            <Link href="/dashboard" className="text-sm font-mono hover:text-[#00ff41] transition-colors">
              Dashboard
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="outline" className="font-mono border-2 border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41] hover:text-black">
                  我的项目
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="outline" className="font-mono border-2 border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41] hover:text-black">
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
          <h1 className="text-5xl md:text-7xl font-mono font-bold mb-6 tracking-tight">
            一键生成 · 匹配叙事的<span className="text-[#00ff41]">Meme网站</span>
          </h1>
          <p className="text-xl md:text-2xl font-mono text-gray-700 mb-8 max-w-3xl mx-auto">
            选择风格模版，AI自动生成品牌一致的落地页
            <br />
            支持可视化编辑，一键发布上线
          </p>
          <div className="flex items-center justify-center gap-4 text-sm font-mono text-gray-600">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00ff41]" />
              AI智能生成
            </span>
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#00ff41]" />
              可视化编辑
            </span>
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[#00ff41]" />
              源码下载
            </span>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-16 bg-black/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-mono font-bold mb-12 text-center">
            4种预设风格 · 即刻启动
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="p-6 bg-white/80 backdrop-blur-sm border-2 border-black/10 hover:border-[#00ff41] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,65,0.3)] group"
              >
                {/* Thumbnail - Screenshot preview */}
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden border-2 border-black/10 relative group-hover:border-[#00ff41]/50 transition-colors">
                  <img 
                    src={`/assets/template-preview-${template.id === 'minimalist' ? 'wojak' : template.id === 'internet-meme' ? 'labubu' : template.id}.png`}
                    alt={`${template.name} Preview`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to iframe if image fails to load
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `<iframe src="${template.demoUrl}" class="w-full h-full border-0 pointer-events-none scale-[0.5] origin-top-left" style="width: 200%; height: 200%;" title="${template.name} Preview"></iframe>`;
                      }
                    }}
                  />
                </div>

                {/* Info */}
                <h3 className="text-2xl font-mono font-bold mb-2">{template.name}</h3>
                <p className="text-sm font-mono text-gray-600 mb-3">{template.description}</p>
                <div className="space-y-2 mb-4 text-xs font-mono">
                  <div className="flex items-start gap-2">
                    <span className="text-[#00ff41] font-bold">适用:</span>
                    <span className="text-gray-700">{template.适用场景}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#00ff41] font-bold">字体:</span>
                    <span className="text-gray-700">{template.fonts}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 font-mono border-2 border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41] hover:text-black"
                    onClick={() => setPreviewTemplate(template.demoUrl)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    预览模版
                  </Button>
                  <Link href={`/launch?template=${template.id}`} className="flex-1">
                    <Button className="w-full font-mono bg-[#00ff41] text-black hover:bg-[#00ff41]/80">
                      使用模版
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Coming Soon */}
          <div className="text-center">
            <h3 className="text-2xl font-mono font-bold mb-8 text-gray-700">
              更多模版 · 开发中
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {comingSoonTemplates.map((template, i) => (
                <div
                  key={i}
                  className="p-8 bg-white/40 backdrop-blur-sm border-2 border-dashed border-black/20 rounded-lg"
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-4xl">🚧</span>
                  </div>
                  <h4 className="font-mono font-bold text-lg mb-1">{template.name}</h4>
                  <p className="text-sm font-mono text-gray-500">{template.description}</p>
                  <p className="text-xs font-mono text-[#00ff41] mt-3">Coming Soon</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-mono font-bold mb-6">
            准备好启动你的Meme项目了吗？
          </h2>
          <p className="text-lg font-mono text-gray-700 mb-8 max-w-2xl mx-auto">
            选择一个模版，10分钟内生成完整的品牌资产和落地页
          </p>
          <Link href="/launch">
            <Button size="lg" className="font-mono text-lg px-8 py-6 bg-[#00ff41] text-black hover:bg-[#00ff41]/80 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
              立即开始 Launch
            </Button>
          </Link>
        </div>
      </section>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 bg-[#d1c9b8] border-b-2 border-[#00ff41]/30 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-[#00ff41]" />
                <span className="font-mono font-bold">模版预览</span>
              </div>
              <div className="flex items-center gap-3">
                <a href={previewTemplate} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="font-mono border-2 border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41] hover:text-black">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    新窗口打开
                  </Button>
                </a>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                  className="font-mono hover:bg-[#00ff41]/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <iframe 
              src={previewTemplate} 
              className="w-full h-full border-0"
              title="Template Preview"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 border-t-2 border-[#00ff41]/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-mono text-gray-600">
            © 2026 EZCTO. Powered by AI · Built for Meme Economy
          </p>
        </div>
      </footer>
    </div>
  );
}
