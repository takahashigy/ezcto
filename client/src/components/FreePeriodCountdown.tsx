import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Sparkles, Rocket } from "lucide-react";
import { Link } from "wouter";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function FreePeriodCountdown() {
  const { data: freePeriodStatus, isLoading } = trpc.admin.getFreePeriodStatus.useQuery(undefined, {
    refetchInterval: 60000, // Refetch every minute to check if still active
  });
  
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!freePeriodStatus?.active || !freePeriodStatus.endTime) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const remaining = freePeriodStatus.endTime! - Date.now();
      
      if (remaining <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
        hours: Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((remaining % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [freePeriodStatus?.active, freePeriodStatus?.endTime]);

  // Don't render anything if loading, not active, or time has expired
  if (isLoading || !freePeriodStatus?.active || !timeLeft) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-[#1a472a] via-[#2d5a27] to-[#4a8f40] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-yellow-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="container relative z-10 py-6 md:py-8">
        <div className="flex flex-col items-center text-center">
          {/* Title with sparkle icon */}
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 animate-pulse" />
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
              {freePeriodStatus.title || "限时免费活动"}
            </h2>
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 animate-pulse" />
          </div>
          
          {/* Subtitle */}
          <p className="text-white/80 text-sm md:text-base mb-4 md:mb-6">
            {freePeriodStatus.subtitle || "全平台免费生成网站"}
          </p>

          {/* Countdown Timer - Large and prominent */}
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-4 md:mb-6">
            {/* Days */}
            <div className="flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 md:px-6 md:py-4 min-w-[60px] md:min-w-[100px]">
                <span className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tabular-nums">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
              </div>
              <span className="text-white/60 text-xs md:text-sm mt-1 md:mt-2">天</span>
            </div>

            <span className="text-2xl md:text-4xl text-white/60 font-light">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 md:px-6 md:py-4 min-w-[60px] md:min-w-[100px]">
                <span className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tabular-nums">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
              </div>
              <span className="text-white/60 text-xs md:text-sm mt-1 md:mt-2">时</span>
            </div>

            <span className="text-2xl md:text-4xl text-white/60 font-light">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 md:px-6 md:py-4 min-w-[60px] md:min-w-[100px]">
                <span className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tabular-nums">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
              </div>
              <span className="text-white/60 text-xs md:text-sm mt-1 md:mt-2">分</span>
            </div>

            <span className="text-2xl md:text-4xl text-white/60 font-light">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 md:px-6 md:py-4 min-w-[60px] md:min-w-[100px]">
                <span className="text-3xl md:text-5xl lg:text-6xl font-bold text-yellow-400 tabular-nums animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
              <span className="text-white/60 text-xs md:text-sm mt-1 md:mt-2">秒</span>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/launch">
            <button className="group flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-[#1a472a] font-bold px-6 py-3 md:px-8 md:py-4 rounded-full text-base md:text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-400/30">
              <Rocket className="w-5 h-5 group-hover:animate-bounce" />
              立即免费创建
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
