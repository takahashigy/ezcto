import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Upload, Trash2, Edit, ArrowLeft, Users, Gift, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function AdminWhitelist() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  
  // Form states
  const [newAddress, setNewAddress] = useState("");
  const [newFreeGenerations, setNewFreeGenerations] = useState(1);
  const [newNote, setNewNote] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [parsedEntries, setParsedEntries] = useState<Array<{ walletAddress: string; freeGenerations: number }>>([]);

  // Queries
  const { data: adminCheck } = trpc.admin.isAdmin.useQuery();
  const { data: whitelistData, isLoading, refetch } = trpc.admin.getWhitelist.useQuery(
    { limit: 100, offset: 0 },
    { enabled: adminCheck?.isAdmin }
  );

  // Mutations
  const addMutation = trpc.admin.addToWhitelist.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Address added to whitelist" });
      setIsAddDialogOpen(false);
      setNewAddress("");
      setNewFreeGenerations(1);
      setNewNote("");
      refetch();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkImportMutation = trpc.admin.bulkImportWhitelist.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Import Complete",
        description: `Added: ${result.added}, Updated: ${result.updated}, Failed: ${result.failed}`,
      });
      setIsBulkDialogOpen(false);
      setBulkInput("");
      setParsedEntries([]);
      refetch();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const parseMutation = trpc.admin.parseWhitelistInput.useMutation({
    onSuccess: (result) => {
      setParsedEntries(result.entries);
      toast({ title: "Parsed", description: `Found ${result.count} valid addresses` });
    },
  });

  const updateMutation = trpc.admin.updateWhitelistEntry.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Entry updated" });
      setIsEditDialogOpen(false);
      setEditingEntry(null);
      refetch();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = trpc.admin.deleteWhitelistEntry.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Entry deleted" });
      refetch();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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

  const handleParseInput = () => {
    if (bulkInput.trim()) {
      parseMutation.mutate({ text: bulkInput });
    }
  };

  const handleBulkImport = () => {
    if (parsedEntries.length > 0) {
      bulkImportMutation.mutate({ entries: parsedEntries });
    }
  };

  const formatAddress = (address: string) => {
    if (address.length > 20) {
      return `${address.slice(0, 8)}...${address.slice(-6)}`;
    }
    return address;
  };

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
            <h1 className="text-xl font-bold text-[#2d5a27]">Admin: Whitelist Management</h1>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/80 border-[#2d5a27]/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-[#2d5a27]/10">
                  <Users className="w-6 h-6 text-[#2d5a27]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Whitelisted</p>
                  <p className="text-2xl font-bold text-[#2d5a27]">{whitelistData?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-[#2d5a27]/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-[#2d5a27]/10">
                  <Gift className="w-6 h-6 text-[#2d5a27]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Free Generations</p>
                  <p className="text-2xl font-bold text-[#2d5a27]">
                    {whitelistData?.entries.reduce((acc, e) => acc + e.freeGenerations, 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-[#2d5a27]/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-[#2d5a27]/10">
                  <CheckCircle className="w-6 h-6 text-[#2d5a27]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Used Generations</p>
                  <p className="text-2xl font-bold text-[#2d5a27]">
                    {whitelistData?.entries.reduce((acc, e) => acc + e.usedGenerations, 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2d5a27] hover:bg-[#1e3d1a]">
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Whitelist</DialogTitle>
                <DialogDescription>Add a wallet address to the whitelist with free generation credits.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Wallet Address</Label>
                  <Input
                    placeholder="0x... or Solana address"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Free Generations</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newFreeGenerations}
                    onChange={(e) => setNewFreeGenerations(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Note (Optional)</Label>
                  <Input
                    placeholder="e.g., Early supporter, KOL, etc."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button
                  className="bg-[#2d5a27] hover:bg-[#1e3d1a]"
                  onClick={() => addMutation.mutate({
                    walletAddress: newAddress,
                    freeGenerations: newFreeGenerations,
                    note: newNote || undefined,
                  })}
                  disabled={!newAddress || addMutation.isPending}
                >
                  {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#2d5a27]/30">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Import Addresses</DialogTitle>
                <DialogDescription>
                  Paste addresses (one per line) or CSV format (address,freeGenerations).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  placeholder={`0xAddress1\n0xAddress2,5\n0xAddress3,3`}
                  rows={8}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                />
                <Button variant="outline" onClick={handleParseInput} disabled={!bulkInput.trim()}>
                  Parse Input
                </Button>
                {parsedEntries.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/50 max-h-48 overflow-y-auto">
                    <p className="text-sm font-medium mb-2">Preview ({parsedEntries.length} addresses):</p>
                    <div className="space-y-1 text-sm">
                      {parsedEntries.slice(0, 10).map((entry, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="font-mono">{formatAddress(entry.walletAddress)}</span>
                          <span className="text-muted-foreground">{entry.freeGenerations} free</span>
                        </div>
                      ))}
                      {parsedEntries.length > 10 && (
                        <p className="text-muted-foreground">...and {parsedEntries.length - 10} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsBulkDialogOpen(false);
                  setBulkInput("");
                  setParsedEntries([]);
                }}>Cancel</Button>
                <Button
                  className="bg-[#2d5a27] hover:bg-[#1e3d1a]"
                  onClick={handleBulkImport}
                  disabled={parsedEntries.length === 0 || bulkImportMutation.isPending}
                >
                  {bulkImportMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Import {parsedEntries.length} Addresses
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Whitelist Table */}
        <Card className="bg-white/80 border-[#2d5a27]/20">
          <CardHeader>
            <CardTitle>Whitelist Entries</CardTitle>
            <CardDescription>Manage wallet addresses with free generation credits.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#2d5a27]" />
              </div>
            ) : whitelistData?.entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No whitelist entries yet. Add addresses to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>Free</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whitelistData?.entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">
                        {formatAddress(entry.walletAddress)}
                      </TableCell>
                      <TableCell>{entry.freeGenerations}</TableCell>
                      <TableCell>{entry.usedGenerations}</TableCell>
                      <TableCell>
                        <Badge variant={entry.freeGenerations - entry.usedGenerations > 0 ? "default" : "secondary"}>
                          {entry.freeGenerations - entry.usedGenerations}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.isActive ? "default" : "destructive"}>
                          {entry.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {entry.note || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingEntry(entry);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this entry?")) {
                                deleteMutation.mutate({ id: entry.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Whitelist Entry</DialogTitle>
              <DialogDescription>
                Update the whitelist entry for {editingEntry && formatAddress(editingEntry.walletAddress)}
              </DialogDescription>
            </DialogHeader>
            {editingEntry && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Free Generations</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingEntry.freeGenerations}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry,
                      freeGenerations: parseInt(e.target.value) || 0,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Used Generations</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingEntry.usedGenerations}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry,
                      usedGenerations: parseInt(e.target.value) || 0,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Input
                    value={editingEntry.note || ""}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry,
                      note: e.target.value,
                    })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingEntry.isActive}
                    onCheckedChange={(checked) => setEditingEntry({
                      ...editingEntry,
                      isActive: checked,
                    })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingEntry(null);
              }}>Cancel</Button>
              <Button
                className="bg-[#2d5a27] hover:bg-[#1e3d1a]"
                onClick={() => updateMutation.mutate({
                  id: editingEntry.id,
                  freeGenerations: editingEntry.freeGenerations,
                  usedGenerations: editingEntry.usedGenerations,
                  note: editingEntry.note || undefined,
                  isActive: editingEntry.isActive,
                })}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
