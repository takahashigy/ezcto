import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Palette, Layout, Sparkles, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectAnalysis {
  narrativeType: "community" | "tech" | "culture" | "gaming";
  layoutStyle: "minimal" | "playful" | "cyberpunk" | "retro";
  colorPalette: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  vibe: "friendly" | "edgy" | "mysterious" | "energetic";
  targetAudience: string;
}

interface WebsitePreviewProps {
  analysis: ProjectAnalysis;
  previewHtml: string | null;
  isLoadingPreview: boolean;
  onAnalysisChange: (analysis: ProjectAnalysis) => void;
  onGeneratePreview: () => void;
  onConfirmGenerate: () => void;
  isGenerating: boolean;
}

const layoutStyleLabels = {
  minimal: "简约风格",
  playful: "趣味风格",
  cyberpunk: "赛博朋克",
  retro: "复古风格",
};

const narrativeTypeLabels = {
  community: "社区驱动",
  tech: "技术创新",
  culture: "文化梗",
  gaming: "游戏化",
};

export function WebsitePreview({
  analysis,
  previewHtml,
  isLoadingPreview,
  onAnalysisChange,
  onGeneratePreview,
  onConfirmGenerate,
  isGenerating,
}: WebsitePreviewProps) {
  const [localAnalysis, setLocalAnalysis] = useState<ProjectAnalysis>(analysis);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalAnalysis(analysis);
  }, [analysis]);

  const handleColorChange = (key: keyof ProjectAnalysis["colorPalette"], value: string) => {
    const newAnalysis = {
      ...localAnalysis,
      colorPalette: {
        ...localAnalysis.colorPalette,
        [key]: value,
      },
    };
    setLocalAnalysis(newAnalysis);
    setHasChanges(true);
  };

  const handleLayoutStyleChange = (value: string) => {
    const newAnalysis = {
      ...localAnalysis,
      layoutStyle: value as ProjectAnalysis["layoutStyle"],
    };
    setLocalAnalysis(newAnalysis);
    setHasChanges(true);
  };

  const handleApplyChanges = () => {
    onAnalysisChange(localAnalysis);
    onGeneratePreview();
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Results */}
      <Card className="bg-white/90 border-2 border-[#2d3e2d]">
        <CardHeader>
          <CardTitle className="text-xl text-[#2d3e2d] flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI 分析结果
          </CardTitle>
          <CardDescription>
            AI 已经分析了您的项目，以下是推荐的设计方案
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Narrative Type */}
          <div className="p-4 bg-white/50 rounded-lg border border-[#2d3e2d]/20">
            <div className="text-sm font-semibold text-[#2d3e2d] mb-1">叙事类型</div>
            <div className="text-lg font-bold text-[#2d3e2d]">
              {narrativeTypeLabels[localAnalysis.narrativeType]}
            </div>
            <div className="text-sm text-[#2d3e2d]/60 mt-1">
              目标受众: {localAnalysis.targetAudience}
            </div>
          </div>

          {/* Layout Style Selector */}
          <div className="space-y-2">
            <Label className="text-[#2d3e2d] font-semibold flex items-center gap-2">
              <Layout className="w-4 h-4" />
              布局风格
            </Label>
            <Select
              value={localAnalysis.layoutStyle}
              onValueChange={handleLayoutStyleChange}
            >
              <SelectTrigger className="border-2 border-[#2d3e2d]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">
                  {layoutStyleLabels.minimal} - 简洁优雅
                </SelectItem>
                <SelectItem value="playful">
                  {layoutStyleLabels.playful} - 有趣活泼
                </SelectItem>
                <SelectItem value="cyberpunk">
                  {layoutStyleLabels.cyberpunk} - 未来科技
                </SelectItem>
                <SelectItem value="retro">
                  {layoutStyleLabels.retro} - 怀旧复古
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Palette Editor */}
          <div className="space-y-3">
            <Label className="text-[#2d3e2d] font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4" />
              配色方案
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(localAnalysis.colorPalette).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-sm text-[#2d3e2d] capitalize">
                    {key === "primary" && "主色"}
                    {key === "secondary" && "辅色"}
                    {key === "background" && "背景"}
                    {key === "text" && "文字"}
                    {key === "accent" && "强调"}
                  </Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) =>
                        handleColorChange(
                          key as keyof ProjectAnalysis["colorPalette"],
                          e.target.value
                        )
                      }
                      className="w-12 h-10 rounded border-2 border-[#2d3e2d] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        handleColorChange(
                          key as keyof ProjectAnalysis["colorPalette"],
                          e.target.value
                        )
                      }
                      className="flex-1 px-3 py-2 border-2 border-[#2d3e2d] rounded font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Apply Changes Button */}
          {hasChanges && (
            <Button
              onClick={handleApplyChanges}
              disabled={isLoadingPreview}
              className="w-full bg-[#2d3e2d] hover:bg-[#3d4e3d]"
            >
              {isLoadingPreview ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  更新预览中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  应用更改并更新预览
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Preview iframe */}
      <Card className="bg-white/90 border-2 border-[#2d3e2d]">
        <CardHeader>
          <CardTitle className="text-xl text-[#2d3e2d]">网站预览</CardTitle>
          <CardDescription>
            这是您网站的实时预览。调整配色和风格后点击"应用更改"查看效果
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPreview ? (
            <div className="flex items-center justify-center h-96 bg-white/50 rounded-lg border-2 border-[#2d3e2d]/20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#2d3e2d] mx-auto mb-4" />
                <p className="text-[#2d3e2d] font-semibold">生成预览中...</p>
                <p className="text-sm text-[#2d3e2d]/60 mt-1">
                  这可能需要几秒钟
                </p>
              </div>
            </div>
          ) : previewHtml ? (
            <div className="relative">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[600px] border-2 border-[#2d3e2d] rounded-lg bg-white"
                title="Website Preview"
                sandbox="allow-same-origin"
              />
              <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  💡 <strong>提示:</strong> 这是您网站的预览版本。满意后点击下方"确认生成"按钮，我们将生成完整版本（包含优化的Banner和资产）并部署到云端。
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-white/50 rounded-lg border-2 border-[#2d3e2d]/20">
              <p className="text-[#2d3e2d]/60">等待生成预览...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Generate Button */}
      {previewHtml && !isLoadingPreview && (
        <div className="flex gap-4">
          <Button
            onClick={onConfirmGenerate}
            disabled={isGenerating}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                确认生成完整网站
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
