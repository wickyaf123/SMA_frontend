import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Send, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Mail,
  Phone,
  Building,
  MapPin,
  Plus,
  Upload,
  Loader2,
  Users,
  MessageSquare,
  Eye,
  Edit,
  ExternalLink,
  Columns,
  Clock,
  BarChart3,
  Reply,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  useContacts, 
  useCreateContact, 
  useUpdateContact, 
  useDeleteContact,
  useSendSms,
  useImportApollo,
  useImportStatus,
  useCampaigns,
  useEnrollContacts,
  useContactReplies,
  useContactActivity,
  useContactMessages,
} from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { 
  Contact, 
  ContactStatus, 
  EmailValidationStatus,
  PhoneValidationStatus,
  CreateContactInput,
  ApolloImportInput,
} from "@/types/api";
import { 
  contactStatusLabels, 
  contactStatusColors, 
  sourceLabels 
} from "@/types/api";

type SortField = "fullName" | "company" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

// Column visibility configuration
type ColumnKey = "contact" | "company" | "validation" | "status" | "source" | "added" | "lastReply" | "campaign" | "dataQuality" | "lastContacted";

const defaultColumnVisibility: Record<ColumnKey, boolean> = {
  contact: true,
  company: true,
  validation: true,
  status: true,
  source: true,
  added: true,
  lastReply: true,
  campaign: true,
  dataQuality: true,
  lastContacted: true,
};

export const Leads = () => {
  // UI State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [replyFilter, setReplyFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [columnVisibility, setColumnVisibility] = useState<Record<ColumnKey, boolean>>(defaultColumnVisibility);
  const itemsPerPage = 10;

  // Modal states
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isApolloImportOpen, setIsApolloImportOpen] = useState(false);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Form states
  const [newContact, setNewContact] = useState<CreateContactInput>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    title: "",
    city: "",
    state: "",
    country: "United States",
  });
  
  const [apolloFilters, setApolloFilters] = useState<ApolloImportInput>({
    industry: undefined,
    personTitles: [],
    organizationLocations: [],
    enrichLimit: 50,
  });

  const [smsMessage, setSmsMessage] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [enrollmentOptions, setEnrollmentOptions] = useState({
    skipIfInWorkspace: false,
    skipIfInCampaign: false,
  });

  // API Hooks
  const { data: contactsData, isLoading, error } = useContacts({
    search: search || undefined,
    status: statusFilter !== "all" ? [statusFilter as ContactStatus] : undefined,
    hasReplied: replyFilter === "all" ? undefined : replyFilter === "replied",
    page: currentPage,
    limit: itemsPerPage,
    sort: sortField,
    order: sortDirection,
  });

  const { data: campaignsData } = useCampaigns({ status: "ACTIVE" });
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const sendSms = useSendSms();
  const importApollo = useImportApollo();
  const enrollContacts = useEnrollContacts();
  
  // Poll import status
  const { data: importStatus } = useImportStatus(importJobId || "", {
    enabled: !!importJobId,
    refetchInterval: 2000,
  });

  // Contact detail data (fetched when detail modal is open)
  const { data: repliesData, isLoading: repliesLoading } = useContactReplies(
    selectedContact?.id || "", 
    { enabled: isDetailOpen && !!selectedContact }
  );
  const { data: activityData, isLoading: activityLoading } = useContactActivity(
    selectedContact?.id || "", 
    50,
    { enabled: isDetailOpen && !!selectedContact }
  );
  const { data: messagesData, isLoading: messagesLoading } = useContactMessages(
    selectedContact?.id || "", 
    { enabled: isDetailOpen && !!selectedContact }
  );

  const contacts = contactsData?.data || [];
  const pagination = contactsData?.pagination;
  const campaigns = campaignsData?.data || [];

  // Filter by source (client-side since backend might not support it)
  const filteredContacts = useMemo(() => {
    if (sourceFilter === "all") return contacts;
    return contacts.filter((c) => c.source?.toLowerCase() === sourceFilter.toLowerCase());
  }, [contacts, sourceFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleCreateContact = async () => {
    if (!newContact.email) return;
    await createContact.mutateAsync(newContact);
    setIsAddLeadOpen(false);
    setNewContact({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      title: "",
      city: "",
      state: "",
      country: "United States",
    });
  };

  const handleApolloImport = async () => {
    const result = await importApollo.mutateAsync(apolloFilters);
    setImportJobId(result.data.id);
    setIsApolloImportOpen(false);
  };

  const handleSendSms = async () => {
    if (!selectedContact || !smsMessage) return;
    await sendSms.mutateAsync({
      contactId: selectedContact.id,
      data: { message: smsMessage },
    });
    setIsSmsOpen(false);
    setSmsMessage("");
  };

  const handleEnroll = async () => {
    if (!selectedCampaignId || selectedIds.size === 0) return;
    await enrollContacts.mutateAsync({
      campaignId: selectedCampaignId,
      data: { 
        contactIds: Array.from(selectedIds),
        options: enrollmentOptions,
      },
    });
    setIsEnrollOpen(false);
    setSelectedIds(new Set());
    // Reset options to defaults
    setEnrollmentOptions({
      skipIfInWorkspace: false,
      skipIfInCampaign: false,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      await deleteContact.mutateAsync(id);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.size} contacts?`)) {
      for (const id of selectedIds) {
        await deleteContact.mutateAsync(id);
      }
      setSelectedIds(new Set());
    }
  };

  const handleExport = async () => {
    try {
      const csv = await api.contacts.export({
        status: statusFilter !== "all" ? [statusFilter as ContactStatus] : undefined,
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Failed to load contacts</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4 animate-fade-in">
      {/* Import Progress Banner */}
      {importJobId && importStatus?.data && importStatus.data.status === "PROCESSING" && (
        <div className="flex items-center gap-3 p-4 bg-info/10 border border-info/20 rounded-xl animate-fade-in">
          <Loader2 className="w-5 h-5 animate-spin text-info" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Importing contacts...</p>
            <p className="text-sm text-muted-foreground">
              {importStatus.data.processedRecords} / {importStatus.data.totalRecords} processed
              {importStatus.data.successCount > 0 && ` • ${importStatus.data.successCount} added`}
              {importStatus.data.duplicateCount > 0 && ` • ${importStatus.data.duplicateCount} duplicates`}
            </p>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Filters */}
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-40 bg-card">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="VALIDATED">Validated</SelectItem>
              <SelectItem value="IN_SEQUENCE">In Sequence</SelectItem>
              <SelectItem value="REPLIED">Replied</SelectItem>
              <SelectItem value="BOUNCED">Bounced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-36 bg-card">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="apollo">Apollo</SelectItem>
              <SelectItem value="csv">CSV Import</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="google_maps">Google Maps</SelectItem>
              <SelectItem value="hunter">Hunter.io</SelectItem>
            </SelectContent>
          </Select>

          <Select value={replyFilter} onValueChange={(v) => { setReplyFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-36 bg-card">
              <Reply className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Replies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contacts</SelectItem>
              <SelectItem value="replied">Has Replied</SelectItem>
              <SelectItem value="not-replied">No Reply</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="w-4 h-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={columnVisibility.lastReply}
                onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, lastReply: checked }))}
              >
                Last Reply
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.campaign}
                onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, campaign: checked }))}
              >
                Campaign
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.dataQuality}
                onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, dataQuality: checked }))}
              >
                Data Quality
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.lastContacted}
                onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, lastContacted: checked }))}
              >
                Last Contacted
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={columnVisibility.validation}
                onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, validation: checked }))}
              >
                Validation
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.source}
                onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, source: checked }))}
              >
                Source
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.added}
                onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, added: checked }))}
              >
                Added Date
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsApolloImportOpen(true)}>
                Import from Apollo
              </DropdownMenuItem>
              <DropdownMenuItem>
                Import from CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Manually add a contact to your database.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newContact.firstName || ""}
                      onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newContact.lastName || ""}
                      onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newContact.phone || ""}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="+1 555 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={newContact.title || ""}
                    onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={newContact.city || ""}
                      onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={newContact.state || ""}
                      onChange={(e) => setNewContact({ ...newContact, state: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddLeadOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateContact} disabled={createContact.isPending || !newContact.email}>
                  {createContact.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Lead
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Apollo Import Dialog */}
      <Dialog open={isApolloImportOpen} onOpenChange={setIsApolloImportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import from Apollo</DialogTitle>
            <DialogDescription>
              Search and import contacts from Apollo.io
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select
                value={apolloFilters.industry || ""}
                onValueChange={(v) => setApolloFilters({ ...apolloFilters, industry: v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="SOLAR">Solar</SelectItem>
                  <SelectItem value="ROOFING">Roofing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Job Titles (comma separated)</Label>
              <Input
                value={apolloFilters.personTitles?.join(", ") || ""}
                onChange={(e) => setApolloFilters({ 
                  ...apolloFilters, 
                  personTitles: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                })}
                placeholder="e.g., Owner, CEO, President"
              />
            </div>
            <div className="space-y-2">
              <Label>Locations (comma separated)</Label>
              <Input
                value={apolloFilters.organizationLocations?.join(", ") || ""}
                onChange={(e) => setApolloFilters({ 
                  ...apolloFilters, 
                  organizationLocations: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                })}
                placeholder="e.g., California, Texas"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Contacts to Import</Label>
              <Input
                type="number"
                value={apolloFilters.enrichLimit || 50}
                onChange={(e) => setApolloFilters({ ...apolloFilters, enrichLimit: parseInt(e.target.value) })}
                min={1}
                max={200}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApolloImportOpen(false)}>Cancel</Button>
            <Button onClick={handleApolloImport} disabled={importApollo.isPending}>
              {importApollo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Start Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SMS Dialog */}
      <Dialog open={isSmsOpen} onOpenChange={setIsSmsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send SMS</DialogTitle>
            <DialogDescription>
              Send a message to {selectedContact?.fullName || selectedContact?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="Type your message..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {smsMessage.length} characters • {Math.ceil(smsMessage.length / 160)} segment(s)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSmsOpen(false)}>Cancel</Button>
            <Button onClick={handleSendSms} disabled={sendSms.isPending || !smsMessage}>
              {sendSms.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll in Campaign</DialogTitle>
            <DialogDescription>
              Add {selectedIds.size} contact(s) to a campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Campaign</Label>
              {campaigns.length === 0 ? (
                <div className="p-4 text-center rounded-lg bg-muted/30 border border-border">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Send className="w-8 h-8 opacity-50" />
                    <div>
                      <p className="font-medium text-foreground mb-1">No active campaigns found</p>
                      <p className="text-sm">Create and activate a campaign in the Outreach tab first.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name} ({campaign.channel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {campaigns.length > 0 && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                <Label className="text-sm font-medium">Enrollment Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipWorkspace"
                      checked={enrollmentOptions.skipIfInWorkspace}
                      onCheckedChange={(checked) =>
                        setEnrollmentOptions({
                          ...enrollmentOptions,
                          skipIfInWorkspace: checked === true,
                        })
                      }
                    />
                    <label
                      htmlFor="skipWorkspace"
                      className="text-sm text-muted-foreground cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Skip if already in workspace
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipCampaign"
                      checked={enrollmentOptions.skipIfInCampaign}
                      onCheckedChange={(checked) =>
                        setEnrollmentOptions({
                          ...enrollmentOptions,
                          skipIfInCampaign: checked === true,
                        })
                      }
                    />
                    <label
                      htmlFor="skipCampaign"
                      className="text-sm text-muted-foreground cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Skip if already in this campaign
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Tip: Leave unchecked to ensure contacts are enrolled even if they exist elsewhere
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleEnroll} 
              disabled={enrollContacts.isPending || !selectedCampaignId || campaigns.length === 0}
            >
              {enrollContacts.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enroll Contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedContact?.fullName || "Contact Details"}
              {selectedContact?.hasReplied && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-node-reply/15 text-node-reply">
                  {selectedContact.repliedChannel === 'EMAIL' && <Mail className="w-3 h-3" />}
                  {selectedContact.repliedChannel === 'SMS' && <Phone className="w-3 h-3" />}
                  Replied
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="replies" className="gap-1">
                  Replies
                  {repliesData?.data && repliesData.data.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-node-reply/20">{repliesData.data.length}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="messages">GHL Messages</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedContact.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedContact.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Title</p>
                      <p className="font-medium">{selectedContact.title || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {[selectedContact.city, selectedContact.state, selectedContact.country]
                          .filter(Boolean)
                          .join(", ") || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded text-xs font-medium",
                        contactStatusColors[selectedContact.status]
                      )}>
                        {contactStatusLabels[selectedContact.status]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="font-medium">{sourceLabels[selectedContact.source || ""] || selectedContact.source}</p>
                    </div>
                  </div>
                  {selectedContact.company && (
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Company</p>
                      <p className="font-medium">{selectedContact.company.name}</p>
                      {selectedContact.company.industry && (
                        <p className="text-sm text-muted-foreground">{selectedContact.company.industry}</p>
                      )}
                      {selectedContact.company.website && (
                        <a 
                          href={selectedContact.company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {selectedContact.company.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                  {selectedContact.linkedinUrl && (
                    <a 
                      href={selectedContact.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View LinkedIn Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedContact.ghlContactId && (
                    <a 
                      href={`https://app.gohighlevel.com/v2/location/${import.meta.env.VITE_GHL_LOCATION_ID || ''}/conversations?contact_id=${selectedContact.ghlContactId}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-500 hover:underline flex items-center gap-1"
                    >
                      Open in GoHighLevel
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </TabsContent>

              {/* Replies Tab */}
              <TabsContent value="replies" className="mt-4">
                <ScrollArea className="h-[350px]">
                  {repliesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : repliesData?.data && repliesData.data.length > 0 ? (
                    <div className="space-y-3">
                      {repliesData.data.map((reply) => (
                        <div key={reply.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {reply.channel === 'EMAIL' && <Mail className="w-4 h-4 text-blue-500" />}
                              {reply.channel === 'SMS' && <Phone className="w-4 h-4 text-emerald-500" />}
                              <span className="text-sm font-medium">{reply.channel} Reply</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.receivedAt).toLocaleString()}
                            </span>
                          </div>
                          {reply.subject && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Subject: {reply.subject}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{reply.content || "No content"}</p>
                          {reply.fromAddress && (
                            <p className="text-xs text-muted-foreground mt-2">From: {reply.fromAddress}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No replies yet</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="mt-4">
                <ScrollArea className="h-[350px]">
                  {activityLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activityData?.data && activityData.data.length > 0 ? (
                    <div className="space-y-2">
                      {activityData.data.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-muted/20 rounded-lg">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-2",
                            activity.action.includes('sent') ? 'bg-blue-500' :
                            activity.action.includes('reply') ? 'bg-emerald-500' :
                            activity.action.includes('enroll') ? 'bg-primary' :
                            'bg-muted-foreground'
                          )} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium capitalize">{activity.action.replace(/_/g, ' ')}</span>
                              {activity.channel && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-muted">{activity.channel}</span>
                              )}
                            </div>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No activity logged</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* GHL Messages Tab */}
              <TabsContent value="messages" className="mt-4">
                <ScrollArea className="h-[350px]">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !messagesData?.data?.synced ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Building className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Contact not synced to GoHighLevel</p>
                      <p className="text-xs mt-1">Sync this contact to GHL to see messages</p>
                    </div>
                  ) : messagesData?.data?.messages && messagesData.data.messages.length > 0 ? (
                    <div className="space-y-3">
                      {messagesData.data.messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={cn(
                            "p-3 rounded-lg max-w-[80%]",
                            message.direction === 'outbound' 
                              ? "bg-primary/10 ml-auto" 
                              : "bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-xs font-medium",
                              message.direction === 'outbound' ? "text-primary" : "text-emerald-500"
                            )}>
                              {message.direction === 'outbound' ? 'Sent' : 'Received'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {message.type}
                            </span>
                          </div>
                          {message.subject && (
                            <p className="text-xs text-muted-foreground mb-1">Subject: {message.subject}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.body || "No content"}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(message.dateAdded).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No messages in GHL</p>
                      {messagesData?.data?.error && (
                        <p className="text-xs text-destructive mt-1">{messagesData.data.error}</p>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-fade-in">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEnrollOpen(true)}>
              <Send className="w-4 h-4 mr-2" />
              Add to Campaign
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No contacts found</p>
            <p className="text-sm">Import contacts or add them manually to get started</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-4 w-12">
                  <Checkbox
                      checked={selectedIds.size === filteredContacts.length && filteredContacts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left">
                  <button
                      onClick={() => handleSort("fullName")}
                    className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Contact
                      <SortIcon field="fullName" />
                  </button>
                </th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Company
                </th>
                {columnVisibility.validation && (
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Validation
                  </th>
                )}
                <th className="p-4 text-left">
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Status
                    <SortIcon field="status" />
                  </button>
                </th>
                {columnVisibility.lastReply && (
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Last Reply
                  </th>
                )}
                {columnVisibility.campaign && (
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Campaign
                  </th>
                )}
                {columnVisibility.dataQuality && (
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Data Quality
                  </th>
                )}
                {columnVisibility.lastContacted && (
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Last Contacted
                  </th>
                )}
                {columnVisibility.source && (
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Source
                  </th>
                )}
                {columnVisibility.added && (
                  <th className="p-4 text-left">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      Added
                      <SortIcon field="createdAt" />
                    </button>
                  </th>
                )}
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
                {filteredContacts.map((contact) => (
                <tr
                    key={contact.id}
                  className={cn(
                    "border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors",
                      selectedIds.has(contact.id) && "bg-primary/5",
                      contact.hasReplied && "border-l-2 border-l-node-reply"
                  )}
                >
                  <td className="p-4">
                    <Checkbox
                        checked={selectedIds.has(contact.id)}
                        onCheckedChange={() => handleSelectOne(contact.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {contact.fullName || `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unknown"}
                        </span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                          {contact.email}
                      </div>
                        {contact.phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                            {contact.phoneFormatted || contact.phone}
                      </div>
                        )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                        {contact.company ? (
                          <>
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium text-foreground">{contact.company.name}</span>
                      </div>
                            <span className="text-sm text-muted-foreground">{contact.title}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                        {(contact.city || contact.state) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                            {[contact.city, contact.state].filter(Boolean).join(", ")}
                      </div>
                        )}
                    </div>
                  </td>
                  {columnVisibility.validation && (
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                            contact.emailValidationStatus === "VALID" 
                              ? "bg-success/15 text-success" 
                              : contact.emailValidationStatus === "INVALID"
                                ? "bg-destructive/15 text-destructive"
                                : contact.emailValidationStatus === "PENDING"
                                  ? "bg-amber-500/15 text-amber-600"
                                  : "bg-muted text-muted-foreground"
                        )}>
                            {contact.emailValidationStatus === "VALID" ? <Check className="w-3 h-3" /> : 
                             contact.emailValidationStatus === "INVALID" ? <X className="w-3 h-3" /> :
                             contact.emailValidationStatus === "PENDING" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          Email
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                            contact.phoneValidationStatus === "VALID_MOBILE" 
                              ? "bg-success/15 text-success" 
                              : contact.phoneValidationStatus === "INVALID"
                                ? "bg-destructive/15 text-destructive"
                                : contact.phoneValidationStatus === "PENDING"
                                  ? "bg-amber-500/15 text-amber-600"
                                  : "bg-muted text-muted-foreground"
                        )}>
                            {contact.phoneValidationStatus === "VALID_MOBILE" ? <Check className="w-3 h-3" /> : 
                             contact.phoneValidationStatus === "INVALID" ? <X className="w-3 h-3" /> :
                             contact.phoneValidationStatus === "PENDING" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          Phone
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        contactStatusColors[contact.status]
                    )}>
                        {contact.hasReplied && contact.repliedChannel === 'EMAIL' && <Mail className="w-3 h-3" />}
                        {contact.hasReplied && contact.repliedChannel === 'SMS' && <Phone className="w-3 h-3" />}
                        {contact.hasReplied && contact.repliedChannel === 'LINKEDIN' && <ExternalLink className="w-3 h-3" />}
                        {contactStatusLabels[contact.status]}
                        {contact._count && contact._count.replies > 1 && (
                          <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">
                            {contact._count.replies}
                          </span>
                        )}
                    </span>
                  </td>
                  {columnVisibility.lastReply && (
                    <td className="p-4">
                      {contact.hasReplied ? (
                        <div className="flex items-center gap-2 text-sm">
                          <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                            "bg-node-reply/15 text-node-reply"
                          )}>
                            {contact.repliedChannel === 'EMAIL' && <Mail className="w-3 h-3" />}
                            {contact.repliedChannel === 'SMS' && <Phone className="w-3 h-3" />}
                            {contact.repliedChannel === 'LINKEDIN' && <ExternalLink className="w-3 h-3" />}
                            {contact.repliedChannel}
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {contact.repliedAt ? new Date(contact.repliedAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                  )}
                  {columnVisibility.campaign && (
                    <td className="p-4">
                      {contact.campaignEnrollments && contact.campaignEnrollments.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {contact.campaignEnrollments.map((enrollment) => (
                            <span 
                              key={enrollment.id} 
                              className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium truncate max-w-[120px]",
                                enrollment.campaign?.channel === 'EMAIL' 
                                  ? "bg-blue-500/15 text-blue-500"
                                  : enrollment.campaign?.channel === 'SMS'
                                    ? "bg-emerald-500/15 text-emerald-500"
                                    : "bg-primary/15 text-primary"
                              )}
                              title={enrollment.campaign?.name}
                            >
                              {enrollment.campaign?.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not enrolled</span>
                      )}
                    </td>
                  )}
                  {columnVisibility.dataQuality && (
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              contact.dataQuality >= 80 ? "bg-success" :
                              contact.dataQuality >= 50 ? "bg-warning" : "bg-destructive"
                            )}
                            style={{ width: `${contact.dataQuality}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{contact.dataQuality}%</span>
                      </div>
                    </td>
                  )}
                  {columnVisibility.lastContacted && (
                    <td className="p-4">
                      {contact.lastContactedAt ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(contact.lastContactedAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </td>
                  )}
                  {columnVisibility.source && (
                    <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {sourceLabels[contact.source || ""] || contact.source || "—"}
                      </span>
                    </td>
                  )}
                  {columnVisibility.added && (
                    <td className="p-4 text-sm text-muted-foreground">
                        {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                  )}
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border border-border shadow-lg">
                          <DropdownMenuItem onClick={() => { setSelectedContact(contact); setIsDetailOpen(true); }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedIds(new Set([contact.id])); setIsEnrollOpen(true); }}>
                            <Send className="w-4 h-4 mr-2" />
                            Add to Campaign
                          </DropdownMenuItem>
                          {contact.phone && (
                            <DropdownMenuItem onClick={() => { setSelectedContact(contact); setIsSmsOpen(true); }}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Send SMS
                            </DropdownMenuItem>
                          )}
                        <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(contact.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8"
              >
                {page}
              </Button>
            ))}
              {pagination.totalPages > 5 && <span className="text-muted-foreground">...</span>}
            <Button
              variant="outline"
              size="sm"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
