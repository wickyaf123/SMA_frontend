import { useState } from "react";
import { 
  Mail, 
  Smartphone, 
  Linkedin, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  TestTube,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ChannelCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  connected: boolean;
  children: React.ReactNode;
}

const ChannelCard = ({ title, description, icon: Icon, iconColor, connected, children }: ChannelCardProps) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <div className="p-5 border-b border-border">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconColor)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
          connected ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
        )}>
          {connected ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {connected ? "Connected" : "Not Connected"}
        </div>
      </div>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

const PasswordInput = ({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

export const Channels = () => {
  // Email state
  const [emailConfig, setEmailConfig] = useState({
    host: "",
    port: "587",
    username: "",
    password: "",
    fromName: "",
    fromEmail: "",
    enabled: true,
  });
  const [emailTesting, setEmailTesting] = useState(false);

  // SMS state
  const [smsConfig, setSmsConfig] = useState({
    accountSid: "",
    authToken: "",
    fromNumber: "",
    enabled: true,
  });
  const [smsTesting, setSmsTesting] = useState(false);

  // LinkedIn state
  const [linkedinConfig, setLinkedinConfig] = useState({
    apiKey: "",
    phantomId: "",
    dailyLimit: "50",
    enabled: true,
  });
  const [linkedinTesting, setLinkedinTesting] = useState(false);

  const handleTestConnection = async (channel: string, setTesting: (v: boolean) => void) => {
    setTesting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTesting(false);
  };

  return (
    <div className="flex-1 overflow-auto p-6 animate-fade-in">
      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="email" className="data-[state=active]:bg-card gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="data-[state=active]:bg-card gap-2">
            <Smartphone className="w-4 h-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="data-[state=active]:bg-card gap-2">
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </TabsTrigger>
        </TabsList>

        {/* Email Configuration */}
        <TabsContent value="email" className="mt-6">
          <ChannelCard
            title="Email (SMTP)"
            description="Configure your SMTP server for sending outbound emails"
            icon={Mail}
            iconColor="bg-node-outreach"
            connected={!!emailConfig.host && !!emailConfig.username}
          >
            <div className="space-y-6">
              {/* Enable toggle */}
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Enable Email Channel</p>
                  <p className="text-sm text-muted-foreground">Allow sending emails through this SMTP server</p>
                </div>
                <Switch
                  checked={emailConfig.enabled}
                  onCheckedChange={(checked) => setEmailConfig({ ...emailConfig, enabled: checked })}
                />
              </div>

              {/* SMTP Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={emailConfig.host}
                    onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    value={emailConfig.port}
                    onChange={(e) => setEmailConfig({ ...emailConfig, port: e.target.value })}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input
                    id="smtp-username"
                    value={emailConfig.username}
                    onChange={(e) => setEmailConfig({ ...emailConfig, username: e.target.value })}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password / App Password</Label>
                  <PasswordInput
                    id="smtp-password"
                    value={emailConfig.password}
                    onChange={(v) => setEmailConfig({ ...emailConfig, password: v })}
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {/* Sender Info */}
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-foreground mb-4">Sender Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-name">From Name</Label>
                    <Input
                      id="from-name"
                      value={emailConfig.fromName}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-email">From Email</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={emailConfig.fromEmail}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                      placeholder="john@company.com"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection("email", setEmailTesting)}
                  disabled={emailTesting}
                >
                  {emailTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                  Test Connection
                </Button>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </div>
          </ChannelCard>
        </TabsContent>

        {/* SMS Configuration */}
        <TabsContent value="sms" className="mt-6">
          <ChannelCard
            title="SMS (Twilio)"
            description="Configure Twilio for SMS outreach and phone validation"
            icon={Smartphone}
            iconColor="bg-node-validation"
            connected={!!smsConfig.accountSid && !!smsConfig.authToken}
          >
            <div className="space-y-6">
              {/* Enable toggle */}
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Enable SMS Channel</p>
                  <p className="text-sm text-muted-foreground">Allow sending SMS messages through Twilio</p>
                </div>
                <Switch
                  checked={smsConfig.enabled}
                  onCheckedChange={(checked) => setSmsConfig({ ...smsConfig, enabled: checked })}
                />
              </div>

              {/* Twilio Credentials */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="twilio-sid">Account SID</Label>
                  <Input
                    id="twilio-sid"
                    value={smsConfig.accountSid}
                    onChange={(e) => setSmsConfig({ ...smsConfig, accountSid: e.target.value })}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground">Found in your Twilio Console Dashboard</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilio-token">Auth Token</Label>
                  <PasswordInput
                    id="twilio-token"
                    value={smsConfig.authToken}
                    onChange={(v) => setSmsConfig({ ...smsConfig, authToken: v })}
                    placeholder="••••••••••••••••••••••••••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilio-number">From Phone Number</Label>
                  <Input
                    id="twilio-number"
                    value={smsConfig.fromNumber}
                    onChange={(e) => setSmsConfig({ ...smsConfig, fromNumber: e.target.value })}
                    placeholder="+1234567890"
                  />
                  <p className="text-xs text-muted-foreground">Your Twilio phone number in E.164 format</p>
                </div>
              </div>

              {/* Rate Limits Info */}
              <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                <p className="text-sm text-info font-medium">Rate Limiting Active</p>
                <p className="text-xs text-info/80 mt-1">
                  SMS messages are automatically rate-limited to comply with carrier regulations and sent only during recipient business hours.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection("sms", setSmsTesting)}
                  disabled={smsTesting}
                >
                  {smsTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                  Test Connection
                </Button>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </div>
          </ChannelCard>
        </TabsContent>

        {/* LinkedIn Configuration */}
        <TabsContent value="linkedin" className="mt-6">
          <ChannelCard
            title="LinkedIn (PhantomBuster)"
            description="Configure PhantomBuster for LinkedIn automation"
            icon={Linkedin}
            iconColor="bg-node-ingestion"
            connected={!!linkedinConfig.apiKey && !!linkedinConfig.phantomId}
          >
            <div className="space-y-6">
              {/* Enable toggle */}
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Enable LinkedIn Channel</p>
                  <p className="text-sm text-muted-foreground">Allow LinkedIn outreach via PhantomBuster</p>
                </div>
                <Switch
                  checked={linkedinConfig.enabled}
                  onCheckedChange={(checked) => setLinkedinConfig({ ...linkedinConfig, enabled: checked })}
                />
              </div>

              {/* PhantomBuster Credentials */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phantom-api">API Key</Label>
                  <PasswordInput
                    id="phantom-api"
                    value={linkedinConfig.apiKey}
                    onChange={(v) => setLinkedinConfig({ ...linkedinConfig, apiKey: v })}
                    placeholder="••••••••••••••••••••••••••••••••"
                  />
                  <p className="text-xs text-muted-foreground">Found in PhantomBuster Settings → API</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phantom-id">Phantom ID</Label>
                  <Input
                    id="phantom-id"
                    value={linkedinConfig.phantomId}
                    onChange={(e) => setLinkedinConfig({ ...linkedinConfig, phantomId: e.target.value })}
                    placeholder="123456789"
                  />
                  <p className="text-xs text-muted-foreground">The ID of your LinkedIn Network Booster phantom</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-limit">Daily Action Limit</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    value={linkedinConfig.dailyLimit}
                    onChange={(e) => setLinkedinConfig({ ...linkedinConfig, dailyLimit: e.target.value })}
                    placeholder="50"
                  />
                  <p className="text-xs text-muted-foreground">Maximum LinkedIn actions per day (recommended: 30-50)</p>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning font-medium">Safety Measures Active</p>
                <p className="text-xs text-warning/80 mt-1">
                  LinkedIn automation includes randomized delays and automatic shutdown on checkpoint detection to protect your account.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection("linkedin", setLinkedinTesting)}
                  disabled={linkedinTesting}
                >
                  {linkedinTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                  Test Connection
                </Button>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </div>
          </ChannelCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};
