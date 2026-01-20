import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Settings as SettingsIcon, Clock, 
  Save, Plus, Trash2, Play, Pause, RefreshCw,
  Linkedin, Zap, AlertCircle, Loader2, Moon, Sun,
  MessageSquare, Check, Edit2, Star, X, Search, MapPin, Building2, Users, DollarSign,
  Power, Mail, Phone, StopCircle, PlayCircle, AlertTriangle, ShieldAlert,
  Route, ArrowUpDown, GripVertical, TestTube, Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings, useToggleLinkedIn, useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useSetDefaultTemplate, useScraperSettings, useUpdateApifySettings, useUpdateApolloSettings, usePipelineControls, useUpdatePipelineControls, useEmergencyStop, useResumePipeline, useScheduleTemplates, useScheduleSettings, useApplyScheduleTemplate, useUpdateSchedules, useTriggerScheduledJob, useRoutingRules, useRoutingFilterOptions, useCreateRoutingRule, useUpdateRoutingRule, useDeleteRoutingRule, useReorderRoutingRules, useTestRouting, useCampaigns, useSyncFromInstantly, useExampleContacts } from "@/hooks/useApi";
import type { MessageTemplate, ApifyScraperSettings, ApolloScraperSettings, PipelineControlSettings, ScheduleTemplate, ScheduleSettings, CampaignRoutingRule, CreateRoutingRuleInput, UpdateRoutingRuleInput, RoutingMatchMode } from "@/types/api";

// Job definitions - these map to pipeline control settings
const jobDefinitions = [
  {
    id: "scrape",
    name: "Google Maps Scraper",
    schedule: "0 0 * * *",
    description: "Scrape businesses from Google Maps via Apify",
    settingKey: "scrapeJobEnabled" as const,
  },
  {
    id: "enrich",
    name: "Hunter.io Enrichment",
    schedule: "0 1 * * *",
    description: "Enrich Track A contacts with email data",
    settingKey: "enrichJobEnabled" as const,
  },
  {
    id: "merge",
    name: "Data Merge",
    schedule: "0 2 * * *",
    description: "Merge and deduplicate contacts from all sources",
    settingKey: "mergeJobEnabled" as const,
  },
  {
    id: "validate",
    name: "Email/Phone Validation",
    schedule: "0 3 * * *",
    description: "Validate new contacts via NeverBounce and Twilio",
    settingKey: "validateJobEnabled" as const,
  },
  {
    id: "enroll",
    name: "Auto-Enrollment",
    schedule: "0 4 * * *",
    description: "Enroll validated contacts into campaigns",
    settingKey: "enrollJobEnabled" as const,
  }
];

// ==================== ROUTING RULES TAB COMPONENT ====================

const RoutingRulesTab = () => {
  const { toast } = useToast();
  
  // API hooks
  const { data: rulesData, isLoading: rulesLoading } = useRoutingRules();
  const { data: filterOptionsData } = useRoutingFilterOptions();
  const { data: campaignsData, refetch: refetchCampaigns } = useCampaigns({ channel: 'EMAIL' });
  const { data: exampleContactsData } = useExampleContacts(10);
  
  const createRule = useCreateRoutingRule();
  const updateRule = useUpdateRoutingRule();
  const deleteRule = useDeleteRoutingRule();
  const reorderRules = useReorderRoutingRules();
  const testRouting = useTestRouting();
  const syncFromInstantly = useSyncFromInstantly();
  
  const rules = rulesData?.data || [];
  const filterOptions = filterOptionsData?.data;
  const campaigns = campaignsData?.data || [];
  const exampleContacts = exampleContactsData?.data || [];
  
  // Track if we've already synced this session
  const [hasSynced, setHasSynced] = useState(false);
  
  // Local state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<CampaignRoutingRule | null>(null);
  const [testContactId, setTestContactId] = useState('');
  const [showExampleDropdown, setShowExampleDropdown] = useState(false);
  
  // Form state for create/edit
  const [formData, setFormData] = useState<CreateRoutingRuleInput>({
    name: '',
    description: '',
    priority: 50,
    isActive: true,
    matchMode: 'ALL',
    sourceFilter: [],
    industryFilter: [],
    stateFilter: [],
    countryFilter: [],
    tagsFilter: [],
    employeesMinFilter: null,
    employeesMaxFilter: null,
    campaignId: '',
  });
  
  // Auto-sync campaigns from Instantly when dialog opens (once per session)
  const syncCampaignsIfNeeded = async () => {
    if (!hasSynced && !syncFromInstantly.isPending) {
      try {
        await syncFromInstantly.mutateAsync();
        setHasSynced(true);
        // Refetch campaigns after sync
        await refetchCampaigns();
      } catch (error) {
        // Error is already handled by the hook toast
        console.error('Failed to sync campaigns:', error);
      }
    }
  };
  
  // Reset form when dialog opens/closes
  const openCreateDialog = () => {
    // Sync campaigns when opening the dialog
    syncCampaignsIfNeeded();
    
    setFormData({
      name: '',
      description: '',
      priority: 50,
      isActive: true,
      matchMode: 'ALL',
      sourceFilter: [],
      industryFilter: [],
      stateFilter: [],
      countryFilter: [],
      tagsFilter: [],
      employeesMinFilter: null,
      employeesMaxFilter: null,
      campaignId: campaigns[0]?.id || '',
    });
    setShowCreateDialog(true);
  };
  
  const openEditDialog = (rule: CampaignRoutingRule) => {
    // Sync campaigns when opening the dialog
    syncCampaignsIfNeeded();
    
    setFormData({
      name: rule.name,
      description: rule.description || '',
      priority: rule.priority,
      isActive: rule.isActive,
      matchMode: rule.matchMode,
      sourceFilter: rule.sourceFilter,
      industryFilter: rule.industryFilter,
      stateFilter: rule.stateFilter,
      countryFilter: rule.countryFilter,
      tagsFilter: rule.tagsFilter,
      employeesMinFilter: rule.employeesMinFilter,
      employeesMaxFilter: rule.employeesMaxFilter,
      campaignId: rule.campaignId,
    });
    setEditingRule(rule);
  };
  
  // Manual sync handler
  const handleManualSync = async () => {
    try {
      await syncFromInstantly.mutateAsync();
      setHasSynced(true);
      // Refetch campaigns after sync
      await refetchCampaigns();
    } catch (error) {
      // Error is already handled by the hook toast
      console.error('Failed to sync campaigns:', error);
    }
  };
  
  const handleCreateRule = async () => {
    if (!formData.name || !formData.campaignId) {
      toast({
        title: 'Missing fields',
        description: 'Name and target campaign are required',
        variant: 'destructive',
      });
      return;
    }
    await createRule.mutateAsync(formData);
    setShowCreateDialog(false);
  };
  
  const handleUpdateRule = async () => {
    if (!editingRule) return;
    await updateRule.mutateAsync({ id: editingRule.id, data: formData });
    setEditingRule(null);
  };
  
  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this routing rule?')) return;
    await deleteRule.mutateAsync(id);
  };
  
  const handleTestRouting = async () => {
    if (!testContactId) {
      toast({
        title: 'Missing contact ID',
        description: 'Enter a contact ID to test routing',
        variant: 'destructive',
      });
      return;
    }
    await testRouting.mutateAsync(testContactId);
  };
  
  const moveRule = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= rules.length) return;
    
    const newOrder = [...rules];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    await reorderRules.mutateAsync(newOrder.map(r => r.id));
  };
  
  // Helper to format filter summary
  const getFilterSummary = (rule: CampaignRoutingRule): string => {
    const parts: string[] = [];
    if (rule.sourceFilter.length > 0) parts.push(`Source: ${rule.sourceFilter.join(', ')}`);
    if (rule.industryFilter.length > 0) parts.push(`Industry: ${rule.industryFilter.join(', ')}`);
    if (rule.stateFilter.length > 0) parts.push(`State: ${rule.stateFilter.join(', ')}`);
    if (rule.countryFilter.length > 0) parts.push(`Country: ${rule.countryFilter.join(', ')}`);
    if (rule.tagsFilter.length > 0) parts.push(`Tags: ${rule.tagsFilter.join(', ')}`);
    if (rule.employeesMinFilter) parts.push(`Min employees: ${rule.employeesMinFilter}`);
    if (rule.employeesMaxFilter) parts.push(`Max employees: ${rule.employeesMaxFilter}`);
    return parts.length > 0 ? parts.join(' • ') : 'No filters (matches all)';
  };
  
  // Multi-select helper component with custom value support
  const MultiSelect = ({ 
    label, 
    options, 
    selected, 
    onChange 
  }: { 
    label: string; 
    options: string[]; 
    selected: string[]; 
    onChange: (values: string[]) => void;
  }) => {
    const [customValue, setCustomValue] = useState('');
    
    const addCustomValue = () => {
      const trimmedValue = customValue.trim();
      if (trimmedValue && !selected.includes(trimmedValue)) {
        onChange([...selected, trimmedValue]);
        setCustomValue('');
      }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomValue();
      }
    };
    
    return (
      <div className="space-y-2">
        <Label className="text-sm">{label}</Label>
        <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-muted/30 min-h-[40px]">
          {selected.map(value => (
            <Badge key={value} variant="secondary" className="gap-1">
              {value}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onChange(selected.filter(v => v !== value))}
              />
            </Badge>
          ))}
          
          {/* Predefined options dropdown */}
          <Select
            value=""
            onValueChange={(value) => {
              if (value && !selected.includes(value)) {
                onChange([...selected, value]);
              }
            }}
          >
            <SelectTrigger className="w-auto h-6 border-0 bg-transparent text-xs">
              <Plus className="w-3 h-3" />
            </SelectTrigger>
            <SelectContent>
              {options.filter(o => !selected.includes(o)).map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Custom value input */}
        <div className="flex gap-2">
          <Input
            placeholder="Type custom value..."
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-8 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomValue}
            disabled={!customValue.trim()}
            className="h-8"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5 text-primary" />
                Campaign Routing Rules
              </CardTitle>
              <CardDescription>
                Route leads to different Instantly campaigns based on source, location, industry, and more
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              New Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Info banner */}
          <div className="p-4 bg-info/10 border border-info/20 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-info mt-0.5" />
              <div>
                <p className="font-medium text-foreground">How Routing Works</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Rules are evaluated in order of priority (highest first). The first matching rule determines 
                  which campaign a lead is enrolled in. If no rule matches, the fallback behavior is applied.
                </p>
              </div>
            </div>
          </div>
          
          {/* Rules list */}
          {rulesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No routing rules yet</p>
              <p className="text-sm">Create your first rule to start routing leads to different campaigns</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, index) => (
                <div 
                  key={rule.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    rule.isActive 
                      ? 'bg-muted/30 border-border hover:bg-muted/50' 
                      : 'bg-muted/10 border-border/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Drag handle / priority controls */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveRule(index, 'up')}
                        disabled={index === 0 || reorderRules.isPending}
                      >
                        <ArrowUpDown className="w-3 h-3 rotate-180" />
                      </Button>
                      <span className="text-xs text-muted-foreground font-mono">
                        #{index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveRule(index, 'down')}
                        disabled={index === rules.length - 1 || reorderRules.isPending}
                      >
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {/* Rule content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <Badge variant={rule.matchMode === 'ALL' ? 'default' : 'outline'} className="text-xs">
                          {rule.matchMode === 'ALL' ? 'Match ALL' : 'Match ANY'}
                        </Badge>
                        {!rule.isActive && (
                          <Badge variant="secondary" className="text-xs">Disabled</Badge>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Filter className="w-3 h-3" />
                        <span className="truncate">{getFilterSummary(rule)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Mail className="w-3 h-3 text-primary" />
                        <span className="text-sm font-medium">
                          → {rule.campaign?.name || 'Unknown Campaign'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => 
                          updateRule.mutate({ id: rule.id, data: { isActive: checked } })
                        }
                        disabled={updateRule.isPending}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(rule)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={deleteRule.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Test Routing */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-warning" />
            Test Routing
          </CardTitle>
          <CardDescription>
            Enter a contact ID or select an example contact to see which campaign they would be routed to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          <div className="flex gap-4">
              <div className="flex-1 relative">
            <Input
              placeholder="Enter contact ID..."
              value={testContactId}
              onChange={(e) => setTestContactId(e.target.value)}
                  onFocus={() => setShowExampleDropdown(true)}
                />
                
                {/* Example Contacts Dropdown */}
                {showExampleDropdown && exampleContacts.length > 0 && (
                  <div className="absolute z-50 w-full bottom-full mb-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 text-xs text-muted-foreground border-b">
                      Example Contacts
                    </div>
                    {exampleContacts.map((contact: any) => (
                      <button
                        key={contact.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex flex-col gap-1"
                        onClick={() => {
                          setTestContactId(contact.id);
                          setShowExampleDropdown(false);
                        }}
                      >
                        <div className="font-medium">{contact.label}</div>
                        <div className="text-xs text-muted-foreground flex gap-2 flex-wrap">
                          {contact.source && <span>Source: {contact.source}</span>}
                          {contact.industry && <span>• Industry: {contact.industry}</span>}
                          {contact.tags.length > 0 && <span>• Tags: {contact.tags.join(', ')}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
            <Button 
              onClick={handleTestRouting}
              disabled={testRouting.isPending || !testContactId}
            >
              {testRouting.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Test
            </Button>
            </div>
            
            {/* Close dropdown when clicking outside */}
            {showExampleDropdown && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowExampleDropdown(false)}
              />
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingRule} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingRule(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Routing Rule' : 'Create Routing Rule'}
            </DialogTitle>
            <DialogDescription>
              Define filters to route leads to a specific campaign
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Rule Name *</Label>
                <Input
                  id="ruleName"
                  placeholder="e.g., Apollo High-Value"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruleCampaign">Target Campaign *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.campaignId}
                    onValueChange={(value) => setFormData({ ...formData, campaignId: value })}
                  >
                    <SelectTrigger className="flex-1" id="ruleCampaign">
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.length === 0 ? (
                        <div className="py-4 px-2 text-center text-sm text-muted-foreground">
                          No campaigns found. Click sync to load from Instantly.
                        </div>
                      ) : (
                        campaigns.map(campaign => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            <span className="flex items-center gap-2">
                              {campaign.name}
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                campaign.status === 'ACTIVE' 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {campaign.status}
                              </span>
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleManualSync}
                    disabled={syncFromInstantly.isPending}
                    title="Sync campaigns from Instantly"
                  >
                    {syncFromInstantly.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {syncFromInstantly.isPending && (
                  <p className="text-xs text-muted-foreground">Syncing campaigns from Instantly...</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ruleDescription">Description</Label>
              <Input
                id="ruleDescription"
                placeholder="When to use this rule..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            {/* Match mode */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <div>
                <p className="font-medium">Match Mode</p>
                <p className="text-sm text-muted-foreground">
                  {formData.matchMode === 'ALL' 
                    ? 'ALL filters must match (AND logic)' 
                    : 'ANY filter can match (OR logic)'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={formData.matchMode === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, matchMode: 'ALL' })}
                >
                  ALL
                </Button>
                <Button
                  variant={formData.matchMode === 'ANY' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, matchMode: 'ANY' })}
                >
                  ANY
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Filters */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <MultiSelect
                  label="Lead Source"
                  options={filterOptions?.sources || ['apollo', 'scraper', 'csv', 'manual']}
                  selected={formData.sourceFilter || []}
                  onChange={(values) => setFormData({ ...formData, sourceFilter: values })}
                />
                
                <MultiSelect
                  label="Industry"
                  options={filterOptions?.industries || []}
                  selected={formData.industryFilter || []}
                  onChange={(values) => setFormData({ ...formData, industryFilter: values })}
                />
                
                <MultiSelect
                  label="State"
                  options={filterOptions?.states || []}
                  selected={formData.stateFilter || []}
                  onChange={(values) => setFormData({ ...formData, stateFilter: values })}
                />
                
                <MultiSelect
                  label="Country"
                  options={filterOptions?.countries || ['United States']}
                  selected={formData.countryFilter || []}
                  onChange={(values) => setFormData({ ...formData, countryFilter: values })}
                />
                
                <MultiSelect
                  label="Tags"
                  options={filterOptions?.tags || []}
                  selected={formData.tagsFilter || []}
                  onChange={(values) => setFormData({ ...formData, tagsFilter: values })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeesMin">Min Employees</Label>
                  <Input
                    id="employeesMin"
                    type="number"
                    placeholder="No minimum"
                    value={formData.employeesMinFilter ?? ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      employeesMinFilter: e.target.value ? parseInt(e.target.value) : null 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeesMax">Max Employees</Label>
                  <Input
                    id="employeesMax"
                    type="number"
                    placeholder="No maximum"
                    value={formData.employeesMaxFilter ?? ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      employeesMaxFilter: e.target.value ? parseInt(e.target.value) : null 
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingRule(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={editingRule ? handleUpdateRule : handleCreateRule}
              disabled={createRule.isPending || updateRule.isPending}
            >
              {(createRule.isPending || updateRule.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingRule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ==================== MAIN SETTINGS COMPONENT ====================

export const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // API hooks
  const { data: settingsData, isLoading: settingsLoading } = useSettings();
  const toggleLinkedIn = useToggleLinkedIn();
  
  // Template hooks
  const { data: templatesData, isLoading: templatesLoading } = useTemplates({ channel: 'SMS', isActive: true });
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const setDefaultTemplate = useSetDefaultTemplate();
  
  const settings = settingsData?.data;
  const templates = templatesData?.data || [];

  const [rateLimits, setRateLimits] = useState({
    emailPerHour: "100",
    smsPerHour: "50",
    linkedinPerDay: "50",
  });

  
  // Template editing state
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', body: '', description: '' });
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  // Scraper settings hooks
  const { data: scraperSettingsData, isLoading: scraperLoading } = useScraperSettings();
  const updateApifySettings = useUpdateApifySettings();
  const updateApolloSettings = useUpdateApolloSettings();

  // Pipeline control hooks
  const { data: pipelineData, isLoading: pipelineControlsLoading } = usePipelineControls();
  const updatePipelineControls = useUpdatePipelineControls();
  const emergencyStop = useEmergencyStop();

  // Schedule hooks
  const { data: scheduleTemplatesData } = useScheduleTemplates();
  const { data: scheduleSettingsData, isLoading: scheduleLoading } = useScheduleSettings();
  const applyScheduleTemplate = useApplyScheduleTemplate();
  const updateSchedules = useUpdateSchedules();
  const triggerJob = useTriggerScheduledJob();
  
  const scheduleTemplates = scheduleTemplatesData?.data?.templates || [];
  const scheduleSettings = scheduleSettingsData?.data;
  const [customMode, setCustomMode] = useState(false);
  const [customCrons, setCustomCrons] = useState({
    scrapeJobCron: '',
    apolloJobCron: '',
    enrichJobCron: '',
    mergeJobCron: '',
    validateJobCron: '',
    enrollJobCron: '',
  });
  const resumePipeline = useResumePipeline();
  const pipelineControls = pipelineData?.data;

  // Local state for scraper forms
  const [apifyForm, setApifyForm] = useState<ApifyScraperSettings>({
    searchTerms: [],
    locations: [],
    industries: [],
    maxResults: 50,
    minRating: 0,
    requirePhone: true,
    requireWebsite: false,
    skipClosed: true,
    language: 'en',
    searchMatching: 'all',
    scrapePlaceDetails: false,
    scrapeContacts: false,
    scrapeReviews: false,
    maxReviews: 0,
    minReviewCount: 0,
  });
  
  const [apolloForm, setApolloForm] = useState<ApolloScraperSettings>({
    industry: '',
    personTitles: [],
    locations: [],
    excludeLocations: [],
    employeesMin: null,
    employeesMax: null,
    revenueMin: null,
    revenueMax: null,
    enrichLimit: 100,
    enrichPhones: true,
    searchKeywords: '',
    personLocations: [],
    personSeniorities: [],
    organizationKeywordTags: [],
    negativeKeywordTags: [],
    technologies: [],
    industryTagIds: [],
    employeeGrowthRate: '',
    fundingStage: '',
    page: 1,
    perPage: 100,
  });

  // Sync scraper settings from API
  useEffect(() => {
    if (scraperSettingsData?.data) {
      const { apify, apollo } = scraperSettingsData.data;
      if (apify) setApifyForm(apify);
      if (apollo) setApolloForm(apollo);
    }
  }, [scraperSettingsData]);

  const handleSave = (section: string) => {
    toast({
      title: "Settings saved",
      description: `${section} settings have been updated successfully.`
    });
  };

  const toggleCronJob = async (settingKey: keyof PipelineControlSettings, enabled: boolean) => {
    try {
      await updatePipelineControls.mutateAsync({ [settingKey]: enabled });
    } catch (error) {
      // Toast is handled by the mutation hook
    }
  };

  const runCronJobNow = async (jobType: string) => {
    toast({
      title: "Job triggered",
      description: `The ${jobType} job has been manually triggered. Check job logs for progress.`
    });
    // TODO: Implement actual API call to trigger jobs manually
    // await api.jobs.trigger(jobType);
  };

  const handleToggleLinkedIn = async (enabled: boolean) => {
    await toggleLinkedIn.mutateAsync(enabled);
  };

  const handleToggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
    toast({
      title: `Theme changed`,
      description: `Switched to ${newTheme} mode.`
    });
  };

  // Template handlers
  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.body) {
      toast({ title: 'Missing fields', description: 'Name and body are required', variant: 'destructive' });
      return;
    }
    await createTemplate.mutateAsync({
      name: newTemplate.name,
      channel: 'SMS',
      body: newTemplate.body,
      description: newTemplate.description || undefined,
      variables: extractVariables(newTemplate.body),
    });
    setNewTemplate({ name: '', body: '', description: '' });
    setShowNewTemplate(false);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    await updateTemplate.mutateAsync({
      id: editingTemplate.id,
      data: {
        name: editingTemplate.name,
        body: editingTemplate.body,
        description: editingTemplate.description || undefined,
        variables: extractVariables(editingTemplate.body),
      },
    });
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    await deleteTemplate.mutateAsync(id);
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultTemplate.mutateAsync(id);
  };

  // Extract variables from template body (e.g., {{firstName}}, {{companyName}})
  const extractVariables = (body: string): string[] => {
    const matches = body.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  };

  const getJobStatusBadge = (enabled: boolean, schedulerEnabled: boolean) => {
    if (!schedulerEnabled) {
      return <Badge variant="outline" className="text-muted-foreground">Scheduler Off</Badge>;
    }
    if (enabled) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Enabled</Badge>;
    }
    return <Badge variant="secondary">Disabled</Badge>;
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <Tabs defaultValue="pipeline" className="space-y-6">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="pipeline" className="gap-2">
            <Power className="w-4 h-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="routing" className="gap-2">
            <Route className="w-4 h-4" />
            Routing
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <SettingsIcon className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="scrapers" className="gap-2">
            <Search className="w-4 h-4" />
            Scrapers
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            SMS Templates
          </TabsTrigger>
          <TabsTrigger value="cron" className="gap-2">
            <Clock className="w-4 h-4" />
            Cron Jobs
          </TabsTrigger>
        </TabsList>

        {/* Pipeline Control Tab */}
        <TabsContent value="pipeline">
          <div className="space-y-6">
            {/* Emergency Stop Banner */}
            {pipelineControls?.lastEmergencyStopAt && !pipelineControls?.pipelineEnabled && (
              <Card className="bg-destructive/10 border-destructive/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <ShieldAlert className="w-8 h-8 text-destructive" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-destructive">Emergency Stop Active</h3>
<p className="text-sm text-muted-foreground">
                      Triggered by {pipelineControls?.lastEmergencyStopBy || 'unknown'} at{' '}
                      {pipelineControls?.lastEmergencyStopAt ? new Date(pipelineControls.lastEmergencyStopAt).toLocaleString() : 'unknown time'}
                    </p>
                    </div>
                    <Button 
                      onClick={() => resumePipeline.mutate()}
                      disabled={resumePipeline.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {resumePipeline.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <PlayCircle className="w-4 h-4 mr-2" />
                      )}
                      Resume All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Master Controls */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Power className="w-5 h-5 text-primary" />
                  Pipeline Master Controls
                </CardTitle>
                <CardDescription>
                  Control the entire automation pipeline with a single switch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {pipelineControlsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Pipeline Master Switch */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${pipelineControls?.pipelineEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
                        <div>
                          <p className="font-medium">Pipeline Status</p>
                          <p className="text-sm text-muted-foreground">
                            {pipelineControls?.pipelineEnabled ? 'Pipeline is running' : 'Pipeline is stopped'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={pipelineControls?.pipelineEnabled ?? false}
                        onCheckedChange={(checked) => updatePipelineControls.mutate({ pipelineEnabled: checked })}
                        disabled={updatePipelineControls.isPending}
                      />
                    </div>

                    {/* Scheduler Switch */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Cron Scheduler</p>
                          <p className="text-sm text-muted-foreground">
                            {pipelineControls?.schedulerEnabled ? 'Automated jobs will run on schedule' : 'No automated jobs will run'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={pipelineControls?.schedulerEnabled ?? false}
                        onCheckedChange={(checked) => updatePipelineControls.mutate({ schedulerEnabled: checked })}
                        disabled={updatePipelineControls.isPending || !pipelineControls?.pipelineEnabled}
                      />
                    </div>

                    {/* Emergency Stop */}
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6 text-destructive" />
                          <div>
                            <p className="font-semibold text-destructive">Emergency Stop</p>
                            <p className="text-sm text-muted-foreground">
                              Immediately stops all outreach and disables the pipeline
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="destructive"
                          onClick={() => emergencyStop.mutate('admin')}
                          disabled={emergencyStop.isPending || !pipelineControls?.pipelineEnabled}
                          className="gap-2"
                        >
                          {emergencyStop.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <StopCircle className="w-4 h-4" />
                          )}
                          EMERGENCY STOP
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Outreach Channel Controls */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-warning" />
                  Outreach Channels
                </CardTitle>
                <CardDescription>
                  Enable or disable individual outreach channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pipelineControlsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Email Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-xs text-muted-foreground">via Instantly</p>
                        </div>
                      </div>
                      <Switch
                        checked={pipelineControls?.emailOutreachEnabled ?? false}
                        onCheckedChange={(checked) => updatePipelineControls.mutate({ emailOutreachEnabled: checked })}
                        disabled={updatePipelineControls.isPending || !pipelineControls?.pipelineEnabled}
                      />
                    </div>

                    {/* SMS Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="font-medium">SMS</p>
                          <p className="text-xs text-muted-foreground">via GoHighLevel</p>
                        </div>
                      </div>
                      <Switch
                        checked={pipelineControls?.smsOutreachEnabled ?? false}
                        onCheckedChange={(checked) => updatePipelineControls.mutate({ smsOutreachEnabled: checked })}
                        disabled={updatePipelineControls.isPending || !pipelineControls?.pipelineEnabled}
                      />
                    </div>

                    {/* LinkedIn Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        <Linkedin className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">LinkedIn</p>
                          <p className="text-xs text-muted-foreground">via PhantomBuster</p>
                        </div>
                      </div>
                      <Switch
                        checked={pipelineControls?.linkedinGloballyEnabled ?? false}
                        onCheckedChange={(checked) => updatePipelineControls.mutate({ linkedinGloballyEnabled: checked })}
                        disabled={updatePipelineControls.isPending || !pipelineControls?.pipelineEnabled}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Individual Job Controls */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Individual Job Controls
                </CardTitle>
                <CardDescription>
                  Enable or disable specific automated jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pipelineControlsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Scrape Job */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div>
                        <p className="font-medium text-sm">Scrape Job</p>
                        <p className="text-xs text-muted-foreground">Google Maps via Apify</p>
                      </div>
                      <Switch
                        checked={pipelineControls?.scrapeJobEnabled ?? false}
                        onCheckedChange={(checked) => updatePipelineControls.mutate({ scrapeJobEnabled: checked })}
                        disabled={updatePipelineControls.isPending || !pipelineControls?.schedulerEnabled}
                      />
                    </div>

                    {/* Apollo Job */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div>
                        <p className="font-medium text-sm">Apollo Job</p>
                        <p className="text-xs text-muted-foreground">Apollo.io Track B scraper</p>
                      </div>
                      <Switch
                        checked={pipelineControls?.apolloJobEnabled ?? false}
                        onCheckedChange={(checked) => updatePipelineControls.mutate({ apolloJobEnabled: checked })}
                        disabled={updatePipelineControls.isPending || !pipelineControls?.schedulerEnabled}
                      />
                    </div>

                    {/* Enrich Job */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div>
                        <p className="font-medium text-sm">Enrich Job</p>
                        <p className="text-xs text-muted-foreground">Hunter.io email lookup</p>
                      </div>
                      <Switch
                        checked={pipelineControls?.enrichJobEnabled ?? false}
                        onCheckedChange={(checked) => updatePipelineControls.mutate({ enrichJobEnabled: checked })}
                        disabled={updatePipelineControls.isPending || !pipelineControls?.schedulerEnabled}
                      />
                    </div>

                    {/* Merge Job */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div>
                        <p className="font-medium text-sm">Merge Job</p>
                        <p className="text-xs text-muted-foreground">Deduplicate contacts</p>
                      </div>
                      <Switch
                        checked={pipelineControls?.mergeJobEnabled ?? false}
                        onCheckedChange={(checked) => updatePipelineControls.mutate({ mergeJobEnabled: checked })}
                        disabled={updatePipelineControls.isPending || !pipelineControls?.schedulerEnabled}
                      />
                    </div>

                    {/* Validate Job */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div>
                        <p className="font-medium text-sm">Validate Job</p>
                        <p className="text-xs text-muted-foreground">Email & phone validation</p>
                      </div>
                      <Switch
                        checked={pipelineControls?.validateJobEnabled ?? false}
                        onCheckedChange={(checked) => updatePipelineControls.mutate({ validateJobEnabled: checked })}
                        disabled={updatePipelineControls.isPending || !pipelineControls?.schedulerEnabled}
                      />
                    </div>

                    {/* Enroll Job */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div>
                        <p className="font-medium text-sm">Auto-Enroll Job</p>
                        <p className="text-xs text-muted-foreground">Enroll contacts into campaigns</p>
                      </div>
                      <Switch
                        checked={pipelineControls?.enrollJobEnabled ?? false}
                        onCheckedChange={(checked) => updatePipelineControls.mutate({ enrollJobEnabled: checked })}
                        disabled={updatePipelineControls.isPending || !pipelineControls?.schedulerEnabled}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Templates */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Schedule Templates
                </CardTitle>
                <CardDescription>
                  Choose a pre-built schedule or customize individual job timing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {scheduleLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Current Schedule Info */}
                    {scheduleSettings && (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{scheduleSettings.templateIcon || '📅'}</span>
                          <div>
                            <p className="font-medium">{scheduleSettings.templateName || 'Custom Schedule'}</p>
                            <p className="text-sm text-muted-foreground">
                              {scheduleSettings.targetLeads ? `~${scheduleSettings.targetLeads} leads/day` : 'Custom configuration'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Template Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {scheduleTemplates.map((template) => (
                        <div
                          key={template.id}
                          onClick={() => {
                            if (!applyScheduleTemplate.isPending) {
                              applyScheduleTemplate.mutate(template.id);
                            }
                          }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${
                            scheduleSettings?.scheduleTemplate === template.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{template.icon}</span>
                            <h3 className="font-semibold text-sm">{template.name}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              🎯 {template.targetLeads} leads/day
                            </Badge>
                          </div>
                          {template.estimatedCosts && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <p>Apollo: {template.estimatedCosts.apollo}</p>
                              <p>Apify: {template.estimatedCosts.apify}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Custom Schedule Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                      <div>
                        <p className="font-medium">Custom Schedule</p>
                        <p className="text-sm text-muted-foreground">
                          Set individual cron expressions for each job
                        </p>
                      </div>
                      <Switch
                        checked={customMode || scheduleSettings?.scheduleTemplate === 'custom'}
                        onCheckedChange={setCustomMode}
                      />
                    </div>

                    {/* Custom Cron Inputs */}
                    {(customMode || scheduleSettings?.scheduleTemplate === 'custom') && scheduleSettings && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { key: 'scrapeJobCron', label: 'Scrape Job', desc: scheduleSettings.scheduleDescriptions?.scrape },
                            { key: 'apolloJobCron', label: 'Apollo Job', desc: scheduleSettings.scheduleDescriptions?.apollo },
                            { key: 'enrichJobCron', label: 'Enrich Job', desc: scheduleSettings.scheduleDescriptions?.enrich },
                            { key: 'mergeJobCron', label: 'Merge Job', desc: scheduleSettings.scheduleDescriptions?.merge },
                            { key: 'validateJobCron', label: 'Validate Job', desc: scheduleSettings.scheduleDescriptions?.validate },
                            { key: 'enrollJobCron', label: 'Enroll Job', desc: scheduleSettings.scheduleDescriptions?.enroll },
                          ].map(({ key, label, desc }) => (
                            <div key={key} className="space-y-1">
                              <Label className="text-sm">{label}</Label>
                              <Input
                                value={customCrons[key as keyof typeof customCrons] || (typeof scheduleSettings?.[key as keyof ScheduleSettings] === 'string' ? scheduleSettings[key as keyof ScheduleSettings] as string : '') || ''}
                                onChange={(e) => setCustomCrons(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder="0 6 * * *"
                                className="font-mono text-sm"
                              />
                              <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => {
                            const updates: Record<string, string> = {};
                            Object.entries(customCrons).forEach(([k, v]) => {
                              if (v) updates[k] = v;
                            });
                            if (Object.keys(updates).length > 0) {
                              updateSchedules.mutate(updates);
                            }
                          }}
                          disabled={updateSchedules.isPending}
                          className="w-full"
                        >
                          {updateSchedules.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save Custom Schedule
                        </Button>
                      </div>
                    )}

                    {/* Scheduler Status */}
                    {scheduleSettings?.schedulerStatus && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2 h-2 rounded-full ${scheduleSettings.schedulerStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
                          <p className="font-medium text-sm">
                            Scheduler {scheduleSettings.schedulerStatus.isRunning ? 'Running' : 'Stopped'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {scheduleSettings.schedulerStatus.jobs.map((job) => (
                            <div key={job.name} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground capitalize">{job.name}</span>
                              <span className="font-mono">{job.humanReadable}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Maintenance Mode */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
                <CardDescription>
                  Put the system in maintenance mode to prevent any automated actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <p className="font-medium">Enable Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">
                      {pipelineControls?.maintenanceMode 
                        ? 'System is in maintenance mode' 
                        : 'System is operating normally'}
                    </p>
                  </div>
                  <Switch
                    checked={pipelineControls?.maintenanceMode ?? false}
                    onCheckedChange={(checked) => updatePipelineControls.mutate({ maintenanceMode: checked })}
                    disabled={updatePipelineControls.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Routing Tab */}
        <TabsContent value="routing">
          <RoutingRulesTab />
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="space-y-6">
            {/* LinkedIn Toggle */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Linkedin className="w-5 h-5 text-blue-600" />
                  LinkedIn Automation
              </CardTitle>
                <CardDescription>Control LinkedIn outreach globally across all campaigns</CardDescription>
            </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                    <div>
                    <p className="font-medium">Global LinkedIn Toggle</p>
                    <p className="text-sm text-muted-foreground">
                      {settingsLoading 
                        ? "Loading..." 
                        : settings?.linkedinGloballyEnabled 
                          ? "LinkedIn automation is enabled for all campaigns" 
                          : "LinkedIn automation is disabled globally"}
                    </p>
                  </div>
                  <Switch 
                    checked={settings?.linkedinGloballyEnabled ?? false}
                    onCheckedChange={handleToggleLinkedIn}
                    disabled={settingsLoading || toggleLinkedIn.isPending}
                  />
                </div>

                {toggleLinkedIn.isPending && (
                  <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Updating...</span>
                  </div>
                )}

                <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Safety Note</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Disabling LinkedIn globally will immediately stop all LinkedIn automation across all campaigns. 
                        Individual campaign settings will be preserved but inactive.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rate Limits */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Rate Limits
                </CardTitle>
                <CardDescription>Configure outreach limits to protect deliverability and accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailLimit">Emails per Hour</Label>
                    <Input
                      id="emailLimit"
                      type="number"
                      value={rateLimits.emailPerHour}
                      onChange={(e) => setRateLimits({ ...rateLimits, emailPerHour: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Max emails via Instantly per hour</p>
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="smsLimit">SMS per Hour</Label>
                    <Input
                      id="smsLimit"
                      type="number"
                      value={rateLimits.smsPerHour}
                      onChange={(e) => setRateLimits({ ...rateLimits, smsPerHour: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Max SMS via GoHighLevel per hour</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedinLimit">LinkedIn Actions per Day</Label>
                    <Input
                      id="linkedinLimit"
                      type="number"
                      value={rateLimits.linkedinPerDay}
                      onChange={(e) => setRateLimits({ ...rateLimits, linkedinPerDay: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Max LinkedIn actions per day (recommended: 30-50)</p>
                  </div>
              </div>

              <Separator />
              
              <div className="flex justify-end">
                  <Button onClick={() => handleSave("Rate limits")} className="gap-2">
                  <Save className="w-4 h-4" />
                    Save Rate Limits
                </Button>
              </div>
            </CardContent>
          </Card>

            {/* Theme Toggle */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">
                        {isDarkMode ? "Dark theme is enabled" : "Light theme is enabled"}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={isDarkMode}
                    onCheckedChange={handleToggleTheme}
                  />
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* Scrapers Tab */}
        <TabsContent value="scrapers">
          <div className="space-y-6">
            {/* Apify (Google Maps) Configuration */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  Google Maps Scraper (Apify)
                </CardTitle>
                <CardDescription>
                  Configure how Track A scrapes businesses from Google Maps. All fields are required.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {scraperLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="apifySearchTerms" className="flex items-center gap-2">
                        Search Terms <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
                      </Label>
                      <Textarea
                        id="apifySearchTerms"
                        placeholder="e.g., HVAC contractor, heating and cooling, air conditioning repair (one per line)"
                        rows={3}
                        value={(apifyForm.searchTerms || []).join('\n')}
                        onChange={(e) => setApifyForm({ 
                          ...apifyForm, 
                          searchTerms: e.target.value.split('\n')
                        })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter search terms (one per line). Example: "HVAC contractor", "heating and cooling"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="apifyLocations" className="flex items-center gap-2">
                          Locations <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
                        </Label>
                        <Textarea
                          id="apifyLocations"
                          placeholder="e.g., Denver, CO (one per line)"
                          rows={4}
                          value={(apifyForm.locations || []).join('\n')}
                          onChange={(e) => setApifyForm({ 
                            ...apifyForm, 
                            locations: e.target.value.split('\n')
                          })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Cities, states, or regions (one per line). Example: "Denver, CO", "Austin, TX"
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apifyIndustries" className="flex items-center gap-2">
                          Industries <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
                        </Label>
                        <Textarea
                          id="apifyIndustries"
                          placeholder="e.g., HVAC, SOLAR, ROOFING (one per line)"
                          rows={4}
                          value={(apifyForm.industries || []).join('\n')}
                          onChange={(e) => setApifyForm({ 
                            ...apifyForm, 
                            industries: e.target.value.split('\n')
                          })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Target industries (one per line). Typically: HVAC, SOLAR, ROOFING
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="apifyMaxResults" className="flex items-center gap-2">
                          Max Results <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
                        </Label>
                        <Input
                          id="apifyMaxResults"
                          type="number"
                          min="1"
                          max="1000"
                          value={apifyForm.maxResults}
                          onChange={(e) => setApifyForm({ ...apifyForm, maxResults: parseInt(e.target.value) || 50 })}
                        />
                        <p className="text-xs text-muted-foreground">Results per location (1-1000)</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apifyMinRating">Minimum Rating</Label>
                        <Input
                          id="apifyMinRating"
                          type="number"
                          min="0"
                          max="5"
                          step="0.5"
                          value={apifyForm.minRating}
                          onChange={(e) => setApifyForm({ ...apifyForm, minRating: parseFloat(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground">Min Google rating (0-5)</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apifyLanguage">Language</Label>
                        <Select
                          value={apifyForm.language || 'en'}
                          onValueChange={(value) => setApifyForm({ ...apifyForm, language: value })}
                        >
                          <SelectTrigger id="apifyLanguage">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Search language</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Basic Filters</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                          <div>
                            <p className="text-sm font-medium">Require Phone</p>
                            <p className="text-xs text-muted-foreground">Only with phone number</p>
                          </div>
                          <Switch
                            checked={apifyForm.requirePhone}
                            onCheckedChange={(checked) => setApifyForm({ ...apifyForm, requirePhone: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                          <div>
                            <p className="text-sm font-medium">Require Website</p>
                            <p className="text-xs text-muted-foreground">Only with website</p>
                          </div>
                          <Switch
                            checked={apifyForm.requireWebsite}
                            onCheckedChange={(checked) => setApifyForm({ ...apifyForm, requireWebsite: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                          <div>
                            <p className="text-sm font-medium">Skip Closed</p>
                            <p className="text-xs text-muted-foreground">Exclude closed businesses</p>
                          </div>
                          <Switch
                            checked={apifyForm.skipClosed}
                            onCheckedChange={(checked) => setApifyForm({ ...apifyForm, skipClosed: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Advanced Options</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="apifySearchMatching">Search Matching</Label>
                          <Select
                            value={apifyForm.searchMatching || 'all'}
                            onValueChange={(value: 'all' | 'exact') => setApifyForm({ ...apifyForm, searchMatching: value })}
                          >
                            <SelectTrigger id="apifySearchMatching">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All (broader results)</SelectItem>
                              <SelectItem value="exact">Exact (stricter matching)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apifyMinReviewCount">Min Review Count</Label>
                          <Input
                            id="apifyMinReviewCount"
                            type="number"
                            min="0"
                            value={apifyForm.minReviewCount || 0}
                            onChange={(e) => setApifyForm({ ...apifyForm, minReviewCount: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-xs text-muted-foreground">Minimum number of reviews</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                          <div>
                            <p className="text-sm font-medium">Scrape Place Details</p>
                            <p className="text-xs text-muted-foreground">Full place information</p>
                          </div>
                          <Switch
                            checked={apifyForm.scrapePlaceDetails || false}
                            onCheckedChange={(checked) => setApifyForm({ ...apifyForm, scrapePlaceDetails: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                          <div>
                            <p className="text-sm font-medium">Scrape Contacts</p>
                            <p className="text-xs text-muted-foreground">Extended contact info</p>
                          </div>
                          <Switch
                            checked={apifyForm.scrapeContacts || false}
                            onCheckedChange={(checked) => setApifyForm({ ...apifyForm, scrapeContacts: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                          <div>
                            <p className="text-sm font-medium">Scrape Reviews</p>
                            <p className="text-xs text-muted-foreground">Include reviews</p>
                          </div>
                          <Switch
                            checked={apifyForm.scrapeReviews || false}
                            onCheckedChange={(checked) => setApifyForm({ ...apifyForm, scrapeReviews: checked })}
                          />
                        </div>
                      </div>

                      {apifyForm.scrapeReviews && (
                        <div className="space-y-2">
                          <Label htmlFor="apifyMaxReviews">Max Reviews per Place</Label>
                          <Input
                            id="apifyMaxReviews"
                            type="number"
                            min="0"
                            max="100"
                            value={apifyForm.maxReviews || 0}
                            onChange={(e) => setApifyForm({ ...apifyForm, maxReviews: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-xs text-muted-foreground">Maximum reviews to scrape per location (0-100)</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (scraperSettingsData?.data?.apify) {
                            setApifyForm(scraperSettingsData.data.apify);
                          }
                        }}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reset
                      </Button>
                      <Button 
                        onClick={() => {
                          // Clean up data before saving
                          const cleanedSettings = {
                            ...apifyForm,
                            searchTerms: apifyForm.searchTerms?.map(t => t.trim()).filter(Boolean) || [],
                            locations: apifyForm.locations?.map(t => t.trim()).filter(Boolean) || [],
                            industries: apifyForm.industries?.map(t => t.trim()).filter(Boolean) || [],
                          };
                          updateApifySettings.mutate(cleanedSettings);
                        }} 
                        disabled={updateApifySettings.isPending || !apifyForm.searchTerms?.length || !apifyForm.locations?.length || !apifyForm.industries?.length}
                        className="gap-2"
                      >
                        {updateApifySettings.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Google Maps Settings
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Apollo Configuration */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Apollo Scraper (Track B)
                </CardTitle>
                <CardDescription>
                  Configure how Track B enriches leads from Apollo.io. Required fields must be configured.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {scraperLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="apolloIndustry" className="flex items-center gap-2">
                          Industry <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
                        </Label>
                        <Input
                          id="apolloIndustry"
                          placeholder="e.g., HVAC, SOLAR, or ROOFING"
                          value={apolloForm.industry}
                          onChange={(e) => setApolloForm({ ...apolloForm, industry: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Target industry (HVAC, SOLAR, ROOFING)</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apolloEnrichLimit">Enrich Limit</Label>
                        <Input
                          id="apolloEnrichLimit"
                          type="number"
                          min="1"
                          max="500"
                          value={apolloForm.enrichLimit}
                          onChange={(e) => setApolloForm({ ...apolloForm, enrichLimit: parseInt(e.target.value) || 100 })}
                        />
                        <p className="text-xs text-muted-foreground">Max contacts per run (1-500)</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apolloSearchKeywords" className="flex items-center gap-2">
                        Search Keywords <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
                      </Label>
                      <Input
                        id="apolloSearchKeywords"
                        placeholder="e.g., HVAC OR heating OR air conditioning"
                        value={apolloForm.searchKeywords || ''}
                        onChange={(e) => setApolloForm({ ...apolloForm, searchKeywords: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Organization search keywords (OR operators supported)
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Enrich Phone Numbers</p>
                        <p className="text-sm text-muted-foreground">
                          Costs 8 credits per contact. Disable to conserve Apollo credits.
                        </p>
                      </div>
                      <Switch
                        checked={apolloForm.enrichPhones}
                        onCheckedChange={(checked) => 
                          setApolloForm({ ...apolloForm, enrichPhones: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Person Filters</h4>
                    <div className="space-y-2">
                        <Label htmlFor="apolloPersonTitles" className="flex items-center gap-2">
                          Person Titles <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
                        </Label>
                        <Textarea
                        id="apolloPersonTitles"
                          placeholder="Owner&#10;CEO&#10;President&#10;COO&#10;General Manager"
                          rows={3}
                          value={(apolloForm.personTitles || []).join('\n')}
                        onChange={(e) => setApolloForm({ 
                          ...apolloForm, 
                          personTitles: e.target.value.split('\n')
                        })}
                      />
                        <p className="text-xs text-muted-foreground">Job titles to target (one per line)</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="apolloPersonLocations">Person Locations (Optional)</Label>
                        <Textarea
                          id="apolloPersonLocations"
                          placeholder="United States&#10;California&#10;Texas"
                          rows={3}
                          value={apolloForm.personLocations?.join('\n') || ''}
                          onChange={(e) => setApolloForm({ 
                            ...apolloForm, 
                            personLocations: e.target.value.split('\n')
                          })}
                        />
                        <p className="text-xs text-muted-foreground">Filter by person's location (one per line)</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="apolloPersonSeniorities">Person Seniorities (Optional)</Label>
                        <Textarea
                          id="apolloPersonSeniorities"
                          placeholder="owner&#10;c_suite&#10;vp&#10;director&#10;manager"
                          rows={3}
                          value={apolloForm.personSeniorities?.join('\n') || ''}
                          onChange={(e) => setApolloForm({ 
                            ...apolloForm, 
                            personSeniorities: e.target.value.split('\n')
                          })}
                        />
                        <p className="text-xs text-muted-foreground">Seniority levels (one per line)</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Organization Filters</h4>
                      <div className="space-y-2">
                        <Label htmlFor="apolloLocations" className="flex items-center gap-2">
                          Organization Locations <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
                        </Label>
                        <Textarea
                        id="apolloLocations"
                          placeholder="United States&#10;Texas&#10;California"
                          rows={3}
                          value={(apolloForm.locations || []).join('\n')}
                        onChange={(e) => setApolloForm({ 
                          ...apolloForm, 
                          locations: e.target.value.split('\n')
                        })}
                      />
                        <p className="text-xs text-muted-foreground">Organization locations - one per line (countries, states, cities)</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="apolloExcludeLocations">Exclude Locations (Optional)</Label>
                        <Textarea
                          id="apolloExcludeLocations"
                          placeholder="New York&#10;California"
                          rows={3}
                          value={apolloForm.excludeLocations?.join('\n') || ''}
                          onChange={(e) => setApolloForm({ 
                            ...apolloForm, 
                            excludeLocations: e.target.value.split('\n')
                          })}
                        />
                        <p className="text-xs text-muted-foreground">Locations to exclude (one per line)</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="apolloOrganizationKeywordTags">Positive Keyword Tags</Label>
                          <Textarea
                            id="apolloOrganizationKeywordTags"
                            placeholder="commercial&#10;residential&#10;industrial"
                            rows={3}
                            value={apolloForm.organizationKeywordTags?.join('\n') || ''}
                            onChange={(e) => setApolloForm({ 
                              ...apolloForm, 
                              organizationKeywordTags: e.target.value.split('\n')
                            })}
                          />
                          <p className="text-xs text-muted-foreground">Must-have keywords (one per line)</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apolloNegativeKeywordTags">Negative Keyword Tags</Label>
                          <Textarea
                            id="apolloNegativeKeywordTags"
                            placeholder="supplier&#10;wholesale&#10;distributor"
                            rows={3}
                            value={apolloForm.negativeKeywordTags?.join('\n') || ''}
                            onChange={(e) => setApolloForm({ 
                              ...apolloForm, 
                              negativeKeywordTags: e.target.value.split('\n')
                            })}
                          />
                          <p className="text-xs text-muted-foreground">Keywords to exclude (one per line)</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="apolloTechnologies">Technologies (Optional)</Label>
                        <Textarea
                          id="apolloTechnologies"
                          placeholder="Salesforce&#10;HubSpot&#10;ServiceTitan"
                          rows={3}
                          value={apolloForm.technologies?.join('\n') || ''}
                          onChange={(e) => setApolloForm({ 
                            ...apolloForm, 
                            technologies: e.target.value.split('\n')
                          })}
                        />
                        <p className="text-xs text-muted-foreground">Tech stack filters (one per line)</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Company Size Filters
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="apolloEmployeesMin">Min Employees</Label>
                          <Input
                            id="apolloEmployeesMin"
                            type="number"
                            min="0"
                            placeholder="No minimum"
                            value={apolloForm.employeesMin ?? ''}
                            onChange={(e) => setApolloForm({ 
                              ...apolloForm, 
                              employeesMin: e.target.value ? parseInt(e.target.value) : null 
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apolloEmployeesMax">Max Employees</Label>
                          <Input
                            id="apolloEmployeesMax"
                            type="number"
                            min="0"
                            placeholder="No maximum"
                            value={apolloForm.employeesMax ?? ''}
                            onChange={(e) => setApolloForm({ 
                              ...apolloForm, 
                              employeesMax: e.target.value ? parseInt(e.target.value) : null 
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Revenue Filters (USD)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="apolloRevenueMin">Min Revenue</Label>
                          <Input
                            id="apolloRevenueMin"
                            type="number"
                            min="0"
                            placeholder="No minimum"
                            value={apolloForm.revenueMin ?? ''}
                            onChange={(e) => setApolloForm({ 
                              ...apolloForm, 
                              revenueMin: e.target.value ? parseInt(e.target.value) : null 
                            })}
                          />
                          <p className="text-xs text-muted-foreground">e.g., 1000000 for $1M</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apolloRevenueMax">Max Revenue</Label>
                          <Input
                            id="apolloRevenueMax"
                            type="number"
                            min="0"
                            placeholder="No maximum"
                            value={apolloForm.revenueMax ?? ''}
                            onChange={(e) => setApolloForm({ 
                              ...apolloForm, 
                              revenueMax: e.target.value ? parseInt(e.target.value) : null 
                            })}
                          />
                          <p className="text-xs text-muted-foreground">e.g., 10000000 for $10M</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Additional Filters</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="apolloEmployeeGrowthRate">Employee Growth Rate</Label>
                          <Select
                            value={apolloForm.employeeGrowthRate || undefined}
                            onValueChange={(value) => setApolloForm({ ...apolloForm, employeeGrowthRate: value })}
                          >
                            <SelectTrigger id="apolloEmployeeGrowthRate">
                              <SelectValue placeholder="Any growth rate" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="growing">Growing</SelectItem>
                              <SelectItem value="stable">Stable</SelectItem>
                              <SelectItem value="declining">Declining</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">Optional - leave unselected for any</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apolloFundingStage">Funding Stage</Label>
                          <Select
                            value={apolloForm.fundingStage || undefined}
                            onValueChange={(value) => setApolloForm({ ...apolloForm, fundingStage: value })}
                          >
                            <SelectTrigger id="apolloFundingStage">
                              <SelectValue placeholder="Any funding stage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="seed">Seed</SelectItem>
                              <SelectItem value="series_a">Series A</SelectItem>
                              <SelectItem value="series_b">Series B</SelectItem>
                              <SelectItem value="series_c">Series C+</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">Optional - leave unselected for any</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="apolloPage">Page Number</Label>
                          <Input
                            id="apolloPage"
                            type="number"
                            min="1"
                            value={apolloForm.page || 1}
                            onChange={(e) => setApolloForm({ ...apolloForm, page: parseInt(e.target.value) || 1 })}
                          />
                          <p className="text-xs text-muted-foreground">Starting page (default: 1)</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apolloPerPage">Results Per Page</Label>
                          <Input
                            id="apolloPerPage"
                            type="number"
                            min="1"
                            max="100"
                            value={apolloForm.perPage || 100}
                            onChange={(e) => setApolloForm({ ...apolloForm, perPage: parseInt(e.target.value) || 100 })}
                          />
                          <p className="text-xs text-muted-foreground">Max 100 per page</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (scraperSettingsData?.data?.apollo) {
                            setApolloForm(scraperSettingsData.data.apollo);
                          }
                        }}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reset
                      </Button>
                      <Button 
                        onClick={() => {
                          // Clean up data before saving
                          const cleanedSettings = {
                            ...apolloForm,
                            personTitles: apolloForm.personTitles?.map(t => t.trim()).filter(Boolean) || [],
                            locations: apolloForm.locations?.map(t => t.trim()).filter(Boolean) || [],
                            excludeLocations: apolloForm.excludeLocations?.map(t => t.trim()).filter(Boolean) || [],
                            personLocations: apolloForm.personLocations?.map(t => t.trim()).filter(Boolean) || [],
                            personSeniorities: apolloForm.personSeniorities?.map(t => t.trim()).filter(Boolean) || [],
                            organizationKeywordTags: apolloForm.organizationKeywordTags?.map(t => t.trim()).filter(Boolean) || [],
                            negativeKeywordTags: apolloForm.negativeKeywordTags?.map(t => t.trim()).filter(Boolean) || [],
                            technologies: apolloForm.technologies?.map(t => t.trim()).filter(Boolean) || [],
                            industryTagIds: apolloForm.industryTagIds?.map(t => t.trim()).filter(Boolean) || [],
                          };
                          updateApolloSettings.mutate(cleanedSettings);
                        }} 
                        disabled={updateApolloSettings.isPending || !apolloForm.industry || !apolloForm.locations?.length || !apolloForm.personTitles?.length || !apolloForm.searchKeywords}
                        className="gap-2"
                      >
                        {updateApolloSettings.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Apollo Settings
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Track A: Google Maps</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Best for high-volume local business discovery. Scrapes business name, phone, 
                          website, and location data. Requires Hunter.io for email enrichment.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Track B: Apollo</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Best for high-quality B2B contacts. Returns verified emails, direct dials, 
                          and detailed company data. More accurate but limited by API credits.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="space-y-6">
            <Card className="bg-card/50 border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-node-validation" />
                    SMS Templates
                  </CardTitle>
                  <CardDescription>
                    Create and manage SMS templates with personalization variables
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowNewTemplate(true)} 
                  disabled={showNewTemplate}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </Button>
              </CardHeader>
              <CardContent>
                {/* New Template Form */}
                {showNewTemplate && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">New SMS Template</h4>
                      <Button variant="ghost" size="icon" onClick={() => setShowNewTemplate(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="templateName">Template Name</Label>
                        <Input
                          id="templateName"
                          placeholder="e.g., Initial Outreach"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="templateBody">Message Body</Label>
                        <Textarea
                          id="templateBody"
                          placeholder="Hi {{firstName}}, I noticed {{companyName}} might benefit from..."
                          value={newTemplate.body}
                          onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use {'{{variableName}}'} for personalization. Available: firstName, lastName, companyName, title, city
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="templateDesc">Description (optional)</Label>
                        <Input
                          id="templateDesc"
                          placeholder="When to use this template"
                          value={newTemplate.description}
                          onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewTemplate(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending}>
                        {createTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Template
                      </Button>
                    </div>
                  </div>
                )}

                {/* Templates List */}
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading templates...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No SMS templates yet</p>
                    <p className="text-sm">Create your first template to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {templates.map((template) => (
                      <div 
                        key={template.id} 
                        className={`p-4 rounded-lg border transition-colors ${
                          editingTemplate?.id === template.id 
                            ? 'bg-primary/5 border-primary/30' 
                            : 'bg-muted/30 border-border hover:bg-muted/50'
                        }`}
                      >
                        {editingTemplate?.id === template.id ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <div>
                              <Label>Template Name</Label>
                              <Input
                                value={editingTemplate.name}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Message Body</Label>
                              <Textarea
                                value={editingTemplate.body}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input
                                value={editingTemplate.description || ''}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdateTemplate} disabled={updateTemplate.isPending}>
                                {updateTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{template.name}</h4>
                                  {template.isDefault && (
                                    <Badge className="bg-primary/15 text-primary">
                                      <Star className="w-3 h-3 mr-1" />
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                {template.description && (
                                  <p className="text-sm text-muted-foreground">{template.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {!template.isDefault && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleSetDefault(template.id)}
                                    disabled={setDefaultTemplate.isPending}
                                    title="Set as default"
                                  >
                                    <Star className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setEditingTemplate(template)}
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  disabled={deleteTemplate.isPending}
                                  className="text-destructive hover:text-destructive"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 p-3 bg-background rounded border border-border">
                              <pre className="text-sm whitespace-pre-wrap font-mono">{template.body}</pre>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              {template.variables.length > 0 && (
                                <span>Variables: {template.variables.join(', ')}</span>
                              )}
                              <span>Used: {template.usageCount} times</span>
                              {template.lastUsedAt && (
                                <span>Last used: {new Date(template.lastUsedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Help Info */}
                <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-info mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Using Templates</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Templates are automatically personalized when SMS messages are sent. 
                        The default template is used for automatic outreach. Variables like{' '}
                        <code className="bg-muted px-1 rounded">{'{{firstName}}'}</code> are replaced with actual contact data.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cron Jobs Tab */}
        <TabsContent value="cron">
          <Card className="bg-card/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Scheduled Jobs
                </CardTitle>
                <CardDescription>Automated background tasks for data processing</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Scheduler:</span>
                <Switch
                  checked={pipelineControls?.schedulerEnabled ?? false}
                  onCheckedChange={(checked) => toggleCronJob('schedulerEnabled', checked)}
                  disabled={pipelineControlsLoading || updatePipelineControls.isPending}
                />
              </div>
            </CardHeader>
            <CardContent>
              {pipelineControlsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {jobDefinitions.map((job) => {
                    const isEnabled = pipelineControls?.[job.settingKey] ?? false;
                    return (
                      <div 
                        key={job.id} 
                        className="p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold">{job.name}</h4>
                              {getJobStatusBadge(isEnabled, pipelineControls?.schedulerEnabled ?? false)}
                            </div>
                            <p className="text-sm text-muted-foreground">{job.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="font-mono bg-muted px-2 py-1 rounded">{job.schedule}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => runCronJobNow(job.name)}
                              title="Run now"
                              disabled={!pipelineControls?.schedulerEnabled}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => toggleCronJob(job.settingKey, !isEnabled)}
                              title={isEnabled ? "Disable" : "Enable"}
                              disabled={updatePipelineControls.isPending}
                            >
                              {isEnabled ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-info mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Daily Pipeline Schedule</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Jobs run sequentially starting at midnight: Scrape → Enrich → Merge → Validate → Auto-Enroll.
                      Each job is spaced 1 hour apart. Use the Pipeline tab for emergency stop controls.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
