import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Clock, CheckCircle2, XCircle, Image, FileText, Globe, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export function GenerationHistorySection() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  
  const { data: history, isLoading } = trpc.projects.getHistory.useQuery({ limit: 10 });
  const utils = trpc.useUtils();
  const deleteHistoryMutation = trpc.projects.deleteHistory.useMutation({
    onSuccess: () => {
      toast.success("Generation history deleted successfully");
      utils.projects.getHistory.invalidate();
      setDeleteDialogOpen(false);
      setSelectedHistoryId(null);
    },
    onError: (error) => {
      toast.error("Failed to delete history", {
        description: error.message,
      });
    },
  });

  const handleDeleteClick = (id: number) => {
    setSelectedHistoryId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedHistoryId) {
      deleteHistoryMutation.mutate({ id: selectedHistoryId });
    }
  };

  if (isLoading) {
    return (
      <Card className="module-card">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground font-mono text-sm">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="module-card">
        <CardContent className="py-12 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No generation history yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {history.map((record: any) => {
        const durationSeconds = record.durationMs ? Math.round(record.durationMs / 1000) : null;
        const statusIcon = {
          completed: <CheckCircle2 className="w-5 h-5 text-primary" />,
          generating: <Loader2 className="w-5 h-5 animate-spin text-accent" />,
          failed: <XCircle className="w-5 h-5 text-destructive" />,
          pending: <Clock className="w-5 h-5 text-muted-foreground" />,
        }[record.status as 'completed' | 'generating' | 'failed' | 'pending'] || <Clock className="w-5 h-5 text-muted-foreground" />;

        const assetsCount = record.assetsGenerated
          ? Object.values(record.assetsGenerated).filter(Boolean).length
          : 0;

        return (
          <Card key={record.id} className="module-card hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon}
                  <div>
                    <CardTitle className="text-lg">
                      Project #{record.projectId}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">
                      {new Date(record.startTime).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 text-xs font-mono font-bold border-2 ${
                    record.status === 'completed' ? 'border-primary bg-primary/10 text-primary' :
                    record.status === 'generating' ? 'border-accent bg-accent/10 text-accent' :
                    record.status === 'failed' ? 'border-destructive bg-destructive/10 text-destructive' :
                    'border-border bg-muted text-muted-foreground'
                  }`}>
                    {record.status.toUpperCase()}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(record.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Duration</div>
                  <div className="font-mono font-bold">
                    {durationSeconds !== null ? `${durationSeconds}s` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Assets Generated</div>
                  <div className="font-mono font-bold flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    {assetsCount}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Status</div>
                  <div className="font-mono font-bold">
                    {record.status === 'failed' && record.errorMessage
                      ? 'Error'
                      : record.status === 'completed'
                      ? 'Success'
                      : 'In Progress'}
                  </div>
                </div>
              </div>

              {record.status === 'failed' && record.errorMessage && (
                <div className="mt-4 p-3 bg-destructive/10 border-2 border-destructive rounded-md">
                  <p className="text-sm text-destructive font-mono">{record.errorMessage}</p>
                </div>
              )}

              {record.assetsGenerated && record.status === 'completed' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {record.assetsGenerated.logo && (
                    <div className="px-2 py-1 bg-primary/10 border border-primary rounded text-xs font-mono">
                      <Image className="w-3 h-3 inline mr-1" />
                      Logo
                    </div>
                  )}
                  {record.assetsGenerated.banner && (
                    <div className="px-2 py-1 bg-primary/10 border border-primary rounded text-xs font-mono">
                      <Image className="w-3 h-3 inline mr-1" />
                      Banner
                    </div>
                  )}
                  {record.assetsGenerated.pfp && (
                    <div className="px-2 py-1 bg-primary/10 border border-primary rounded text-xs font-mono">
                      <Image className="w-3 h-3 inline mr-1" />
                      PFP
                    </div>
                  )}
                  {record.assetsGenerated.poster && (
                    <div className="px-2 py-1 bg-primary/10 border border-primary rounded text-xs font-mono">
                      <Image className="w-3 h-3 inline mr-1" />
                      Poster
                    </div>
                  )}
                  {record.assetsGenerated.narrative && (
                    <div className="px-2 py-1 bg-accent/10 border border-accent rounded text-xs font-mono">
                      <FileText className="w-3 h-3 inline mr-1" />
                      Narrative
                    </div>
                  )}
                  {record.assetsGenerated.website && (
                    <div className="px-2 py-1 bg-accent/10 border border-accent rounded text-xs font-mono">
                      <Globe className="w-3 h-3 inline mr-1" />
                      Website
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Generation History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this generation history record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteHistoryMutation.isPending}
            >
              {deleteHistoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
