import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings as SettingsIcon, Clock, 
  Save, Plus, Trash2, Play, Pause, RefreshCw,
  Linkedin, Zap, AlertCircle, Loader2, Moon, Sun,
  MessageSquare, Check, Edit2, Star, X, Search, MapPin, Building2, Users, DollarSign,
  Power, Mail, Phone, StopCircle, PlayCircle, AlertTriangle, ShieldAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings, useToggleLinkedIn, useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useSetDefaultTemplate, useScraperSettings, useUpdateApifySettings, useUpdateApolloSettings, usePipelineControls, useUpdatePipelineControls, useEmergencyStop, useResumePipeline, useScheduleTemplates, useScheduleSettings, useApplyScheduleTemplate, useUpdateSchedules, useTriggerScheduledJob } from "@/hooks/useApi";
import type { MessageTemplate, ApifyScraperSettings, ApolloScraperSettings, PipelineControlSettings, ScheduleTemplate, ScheduleSettings } from "@/types/api";

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

export const Settings = () => {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(true);
  
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
    query: 'HVAC companies',
    location: 'United States',
    maxResults: 50,
    minRating: 0,
    requirePhone: true,
    requireWebsite: false,
    skipClosed: true,
  });
  
  const [apolloForm, setApolloForm] = useState<ApolloScraperSettings>({
    industry: 'HVAC',
    personTitles: ['Owner', 'CEO', 'President', 'COO', 'General Manager'],
    locations: ['United States'],
    excludeLocations: [],
    employeesMin: null,
    employeesMax: null,
    revenueMin: null,
    revenueMax: null,
    enrichLimit: 100,
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
    setIsDarkMode(!isDarkMode);
    // In a real implementation, this would update the theme
    document.documentElement.classList.toggle('dark', !isDarkMode);
    toast({
      title: `Theme changed`,
      description: `Switched to ${!isDarkMode ? 'dark' : 'light'} mode.`
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
                                value={customCrons[key as keyof typeof customCrons] || scheduleSettings[key as keyof ScheduleSettings] || ''}
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
                  Configure how Track A scrapes businesses from Google Maps
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
                        <Label htmlFor="apifyQuery">Search Query</Label>
                        <Input
                          id="apifyQuery"
                          placeholder="e.g., HVAC companies"
                          value={apifyForm.query}
                          onChange={(e) => setApifyForm({ ...apifyForm, query: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Business type to search for</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apifyLocation">Location</Label>
                        <Input
                          id="apifyLocation"
                          placeholder="e.g., United States"
                          value={apifyForm.location}
                          onChange={(e) => setApifyForm({ ...apifyForm, location: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Geographic area to search</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="apifyMaxResults">Max Results</Label>
                        <Input
                          id="apifyMaxResults"
                          type="number"
                          min="1"
                          max="1000"
                          value={apifyForm.maxResults}
                          onChange={(e) => setApifyForm({ ...apifyForm, maxResults: parseInt(e.target.value) || 50 })}
                        />
                        <p className="text-xs text-muted-foreground">Results per run (max 1000)</p>
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
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Filters</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                          <div>
                            <p className="text-sm font-medium">Require Phone</p>
                            <p className="text-xs text-muted-foreground">Only include businesses with phone</p>
                          </div>
                          <Switch
                            checked={apifyForm.requirePhone}
                            onCheckedChange={(checked) => setApifyForm({ ...apifyForm, requirePhone: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                          <div>
                            <p className="text-sm font-medium">Require Website</p>
                            <p className="text-xs text-muted-foreground">Only include businesses with website</p>
                          </div>
                          <Switch
                            checked={apifyForm.requireWebsite}
                            onCheckedChange={(checked) => setApifyForm({ ...apifyForm, requireWebsite: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                          <div>
                            <p className="text-sm font-medium">Skip Closed</p>
                            <p className="text-xs text-muted-foreground">Exclude permanently closed businesses</p>
                          </div>
                          <Switch
                            checked={apifyForm.skipClosed}
                            onCheckedChange={(checked) => setApifyForm({ ...apifyForm, skipClosed: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={() => updateApifySettings.mutate(apifyForm)} 
                        disabled={updateApifySettings.isPending}
                        className="gap-2"
                      >
                        {updateApifySettings.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Apify Settings
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
                  Configure how Track B enriches leads from Apollo.io
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
                        <Label htmlFor="apolloIndustry">Industry</Label>
                        <Input
                          id="apolloIndustry"
                          placeholder="e.g., HVAC"
                          value={apolloForm.industry}
                          onChange={(e) => setApolloForm({ ...apolloForm, industry: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Target industry keyword</p>
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
                        <p className="text-xs text-muted-foreground">Max contacts per run</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apolloPersonTitles">Person Titles</Label>
                      <Input
                        id="apolloPersonTitles"
                        placeholder="Owner, CEO, President, COO"
                        value={apolloForm.personTitles.join(', ')}
                        onChange={(e) => setApolloForm({ 
                          ...apolloForm, 
                          personTitles: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                        })}
                      />
                      <p className="text-xs text-muted-foreground">Comma-separated list of job titles to target</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apolloLocations">Locations</Label>
                      <Input
                        id="apolloLocations"
                        placeholder="United States"
                        value={apolloForm.locations.join(', ')}
                        onChange={(e) => setApolloForm({ 
                          ...apolloForm, 
                          locations: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                        })}
                      />
                      <p className="text-xs text-muted-foreground">Comma-separated list of locations (countries, states, cities)</p>
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
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={() => updateApolloSettings.mutate(apolloForm)} 
                        disabled={updateApolloSettings.isPending}
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
