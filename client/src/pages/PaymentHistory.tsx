import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Receipt } from "lucide-react";
import { useLocation } from "wouter";
import { PAYMENT_CONFIG } from "../../../shared/paymentConfig";

export default function PaymentHistory() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: paidProjects, isLoading } = trpc.projects.getPaidProjects.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to view your payment history</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      generating: "secondary",
      completed: "default",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const getBlockchainExplorerUrl = (txHash: string, currency: string) => {
    if (currency === "USDT") {
      // BSC
      return `https://bscscan.com/tx/${txHash}`;
    } else if (currency === "USDC") {
      // Solana
      return `https://solscan.io/tx/${txHash}`;
    }
    return "#";
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Payment History</h1>
          <p className="text-muted-foreground">
            View all your paid projects and transaction details
          </p>
        </div>

        {/* Projects List */}
        {!paidProjects || paidProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Payment History</h3>
              <p className="text-muted-foreground mb-6">
                You haven't made any payments yet. Create your first project to get started!
              </p>
              <Button onClick={() => setLocation("/launch")}>
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paidProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{project.name}</CardTitle>
                      <CardDescription className="text-base">
                        {project.ticker && <span className="font-mono font-semibold">${project.ticker}</span>}
                        {project.ticker && project.description && " • "}
                        {project.description}
                      </CardDescription>
                    </div>
                    {getStatusBadge(project.status || "draft")}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Payment Amount */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Amount</p>
                      <p className="text-lg font-semibold font-mono">
                        {project.paymentAmount || "N/A"} {project.paymentCurrency || ""}
                      </p>
                    </div>

                    {/* Payment Date */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Paid At</p>
                      <p className="text-sm">{formatDate(project.paidAt)}</p>
                    </div>

                    {/* Deployment URL */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Website</p>
                      {project.deploymentUrl ? (
                        <a
                          href={project.deploymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {project.subdomain}.ezcto.fun
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not deployed yet</p>
                      )}
                    </div>

                    {/* Transaction Hash */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Transaction</p>
                      {project.paymentTxHash && project.paymentCurrency ? (
                        <a
                          href={getBlockchainExplorerUrl(project.paymentTxHash, project.paymentCurrency)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {project.paymentTxHash.slice(0, 8)}...{project.paymentTxHash.slice(-6)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">N/A</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/launch/preview?projectId=${project.id}`)}
                    >
                      View Details
                    </Button>
                    {project.deploymentUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(project.deploymentUrl!, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Visit Website
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
