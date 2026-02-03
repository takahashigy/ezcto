import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Clock, Calendar, Sparkles, Timer } from "lucide-react";
import { Link } from "wouter";

export default function AdminFreePeriod() {
  const { toast } = useToast();
  
  // Form states
  const [enabled, setEnabled] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("限时免费活动");
  const [subtitle, setSubtitle] = useState("全平台免费生成网站");
  const [hasChanges, setHasChanges] = useState(false);

  // Queries
  const { data: adminCheck } = trpc.admin.isAdmin.useQuery();
  const { data: currentSetting, isLoading, refetch } = trpc.admin.getFreePeriodSetting.useQuery(
    undefined,
    { enabled: adminCheck?.isAdmin }
  );

  // Mutation
  const saveMutation = trpc.admin.setFreePeriodSetting.useMutation({
    onSuccess: () => {
      toast({ title: "保存成功", description: "免费活动设置已更新" });
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    },
  });

  // Load current settings
  useEffect(() => {
    if (currentSetting) {
      setEnabled(currentSetting.enabled);
      setTitle(currentSetting.title || "限时免费活动");
      setSubtitle(currentSetting.subtitle || "全平台免费生成网站");
      
      if (currentSetting.endTime) {
        const date = new Date(currentSetting.endTime);
        setEndDate(date.toISOString().split('T')[0]);
        setEndTime(date.toTimeString().slice(0, 5));
      }
    }
  }, [currentSetting]);

  // Track changes
  useEffect(() => {
    if (!currentSetting) return;
    
    const currentEndTime = currentSetting.endTime;
    const newEndTime = endDate && endTime 
      ? new Date(`${endDate}T${endTime}`).getTime()
      : 0;
    
    const changed = 
      enabled !== currentSetting.enabled ||
      title !== (currentSetting.title || "限时免费活动") ||
      subtitle !== (currentSetting.subtitle || "全平台免费生成网站") ||
      newEndTime !== currentEndTime;
    
    setHasChanges(changed);
  }, [enabled, endDate, endTime, title, subtitle, currentSetting]);

  const handleSave = () => {
    if (!endDate || !endTime) {
      toast({ title: "错误", description: "请设置结束时间", variant: "destructive" });
      return;
    }

    const endTimeMs = new Date(`${endDate}T${endTime}`).getTime();
    
    if (enabled && endTimeMs <= Date.now()) {
      toast({ title: "错误", description: "结束时间必须在未来", variant: "destructive" });
      return;
    }

    saveMutation.mutate({
      enabled,
      endTime: endTimeMs,
      title,
      subtitle,
    });
  };

  // Calculate remaining time for preview
  const getRemainingTime = () => {
    if (!endDate || !endTime) return null;
    
    const endTimeMs = new Date(`${endDate}T${endTime}`).getTime();
    const remaining = endTimeMs - Date.now();
    
    if (remaining <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, expired: false };
  };

  const remaining = getRemainingTime();

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8e4dc]">
      {/* Header */}
      <div className="border-b border-[#2d5a27]/20 bg-[#e8e4dc]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-[#2d5a27]">Admin: 免费活动设置</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/whitelist">
              <Button variant="outline" size="sm" className="border-[#2d5a27]/30">
                白名单管理
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-4xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#2d5a27]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preview Card */}
            {enabled && remaining && !remaining.expired && (
              <Card className="bg-gradient-to-r from-[#2d5a27] to-[#4a8f40] text-white overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5" />
                    倒计时预览效果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <h3 className="text-2xl font-bold mb-1">{title}</h3>
                    <p className="text-white/80 mb-4">{subtitle}</p>
                    <div className="flex justify-center gap-4">
                      <div className="bg-white/20 rounded-lg px-4 py-3 min-w-[80px]">
                        <div className="text-3xl font-bold">{remaining.days}</div>
                        <div className="text-xs text-white/70">天</div>
                      </div>
                      <div className="bg-white/20 rounded-lg px-4 py-3 min-w-[80px]">
                        <div className="text-3xl font-bold">{String(remaining.hours).padStart(2, '0')}</div>
                        <div className="text-xs text-white/70">时</div>
                      </div>
                      <div className="bg-white/20 rounded-lg px-4 py-3 min-w-[80px]">
                        <div className="text-3xl font-bold">{String(remaining.minutes).padStart(2, '0')}</div>
                        <div className="text-xs text-white/70">分</div>
                      </div>
                      <div className="bg-white/20 rounded-lg px-4 py-3 min-w-[80px]">
                        <div className="text-3xl font-bold">{String(remaining.seconds).padStart(2, '0')}</div>
                        <div className="text-xs text-white/70">秒</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Settings Card */}
            <Card className="bg-white/80 border-[#2d5a27]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2d5a27]">
                  <Timer className="w-5 h-5" />
                  免费活动设置
                </CardTitle>
                <CardDescription>
                  设置全平台免费活动，活动期间所有用户可以免费生成网站
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable Switch */}
                <div className="flex items-center justify-between p-4 bg-[#2d5a27]/5 rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">启用免费活动</Label>
                    <p className="text-sm text-muted-foreground">
                      开启后，首页将显示倒计时横幅，用户可免费生成
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={setEnabled}
                    className="data-[state=checked]:bg-[#2d5a27]"
                  />
                </div>

                {/* Title & Subtitle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>活动标题</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="限时免费活动"
                      className="border-[#2d5a27]/30 focus:border-[#2d5a27]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>活动副标题</Label>
                    <Input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="全平台免费生成网站"
                      className="border-[#2d5a27]/30 focus:border-[#2d5a27]"
                    />
                  </div>
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    活动结束时间
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border-[#2d5a27]/30 focus:border-[#2d5a27]"
                    />
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="border-[#2d5a27]/30 focus:border-[#2d5a27]"
                    />
                  </div>
                  {remaining?.expired && (
                    <p className="text-sm text-red-500">⚠️ 设置的时间已过期</p>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges || saveMutation.isPending}
                    className="bg-[#2d5a27] hover:bg-[#1e3d1a] min-w-[120px]"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      "保存设置"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">功能说明</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>启用后，首页 Hero 区域上方将显示醒目的倒计时横幅</li>
                      <li>活动期间，所有用户（包括未登录用户）可以免费生成网站</li>
                      <li>活动结束后，倒计时横幅自动隐藏，恢复正常收费</li>
                      <li>白名单用户不受活动影响，始终可以使用免费额度</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
