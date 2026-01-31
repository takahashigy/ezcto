import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface StepProgress {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  data?: any;
  error?: string;
}

interface GenerationProgress {
  currentStep: string;
  steps: StepProgress[];
  progress: {
    current: number;
    total: number;
    message: string;
  };
}

interface GenerationPreviewProps {
  projectId: number;
  onComplete?: () => void;
}

const STEP_LABELS: Record<string, string> = {
  analysis: "Analyzing Project",
  images: "Generating Images",
  website: "Building Website",
  deployment: "Deploying Assets",
};

const STEP_DESCRIPTIONS: Record<string, string> = {
  analysis: "Claude Haiku is analyzing your project and creating a brand strategy...",
  images: "Nanobanana is generating 8 high-quality images (PayDex Banner, X Banner, Logo, etc.)...",
  website: "Claude Opus is building your website with all generated assets...",
  deployment: "Saving all assets to the database and preparing for preview...",
};

export function GenerationPreview({ projectId, onComplete }: GenerationPreviewProps) {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Poll for generation progress
  const { data: historyData } = trpc.projects.getHistory.useQuery(
    { projectId },
    {
      enabled: isPolling,
      refetchInterval: 2000, // Poll every 2 seconds
    }
  );

  useEffect(() => {
    if (historyData && historyData.length > 0) {
      const latestHistory = historyData[0];
      const metadata = latestHistory.metadata as GenerationProgress;
      
      if (metadata) {
        setProgress(metadata);
        
        // Stop polling if generation is completed or failed
        if (latestHistory.status === 'completed' || latestHistory.status === 'failed') {
          setIsPolling(false);
          if (latestHistory.status === 'completed' && onComplete) {
            onComplete();
          }
        }
      }
    }
  }, [historyData, onComplete]);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStepStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'in_progress':
        return 'In Progress...';
      default:
        return 'Pending';
    }
  };

  if (!progress) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Generation Progress</CardTitle>
          <CardDescription>Initializing generation...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generation Progress</CardTitle>
        <CardDescription>{progress.progress.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progress.progress.current}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress.progress.current}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {progress.steps.map((step, index) => (
            <div key={step.step} className="flex items-start gap-3">
              <div className="mt-0.5">{getStepIcon(step.status)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {STEP_LABELS[step.step] || step.step}
                  </h4>
                  <span className="text-sm text-muted-foreground">
                    {getStepStatusText(step.status)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {STEP_DESCRIPTIONS[step.step] || "Processing..."}
                </p>
                {step.data && step.step === 'images' && step.data.count && (
                  <p className="text-xs text-muted-foreground">
                    Generated {step.data.count} images
                  </p>
                )}
                {step.error && (
                  <p className="text-sm text-destructive">{step.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Current Step Details */}
        {progress.currentStep && (
          <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Current Step:</p>
            <p className="text-sm text-muted-foreground">
              {STEP_LABELS[progress.currentStep] || progress.currentStep}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
