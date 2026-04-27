"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Settings2,
  Shield,
  Puzzle,
  UserCog,
  Save,
  AlertTriangle,
  Check,
  Plus,
  Trash2,
  Mail,
  Globe,
  Bell,
  Eye,
  Sliders,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  comingSoon: boolean;
}

const INTEGRATIONS: Integration[] = [
  { id: "docusign", name: "DocuSign", description: "E-signature and agreement cloud", icon: "📝", connected: false, comingSoon: true },
  { id: "gdrive", name: "Google Drive", description: "Cloud storage and collaboration", icon: "📁", connected: false, comingSoon: true },
  { id: "notion", name: "Notion", description: "Knowledge base and documentation", icon: "📓", connected: false, comingSoon: true },
  { id: "slack", name: "Slack", description: "Team messaging and notifications", icon: "💬", connected: false, comingSoon: true },
  { id: "hubspot", name: "HubSpot", description: "CRM and deal management", icon: "🔄", connected: false, comingSoon: true },
];

const RISK_LEVELS = [
  { value: 0, label: "Conservative", description: "Flag all potential risks, strictest analysis" },
  { value: 1, label: "Moderate", description: "Balanced approach, standard risk thresholds" },
  { value: 2, label: "Aggressive", description: "Only flag high-severity risks" },
];

const PREFERRED_CLAUSES = [
  "Payment Terms", "Termination", "Liability", "Indemnification",
  "Confidentiality", "IP Rights", "Dispute Resolution", "Force Majeure",
  "Data Protection", "Non-Compete",
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // Profile state
  const [profileName, setProfileName] = useState(session?.user?.name ?? "");
  const [profileJurisdiction, setProfileJurisdiction] = useState("US");

  // Preferences state
  const [defaultView, setDefaultView] = useState("legal");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(true);

  // Risk Profile state
  const [riskTolerance, setRiskTolerance] = useState(1);
  const [selectedClauses, setSelectedClauses] = useState<string[]>(["Payment Terms", "Liability", "Termination"]);
  const [voiceProfile, setVoiceProfile] = useState("corporate");

  // Admin state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [managedUsers] = useState([
    { id: "1", email: "admin@clauseai.com", name: "Admin User", role: "admin" },
    { id: "2", email: "user@clauseai.com", name: "Regular User", role: "user" },
  ]);

  useEffect(() => {
    if (session?.user?.name) setProfileName(session.user.name);
  }, [session]);

  async function handleSave(section: string) {
    setSaving(section);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(null);
    setSaved(section);
    setTimeout(() => setSaved(null), 2000);
  }

  function toggleClause(clause: string) {
    setSelectedClauses((prev) =>
      prev.includes(clause) ? prev.filter((c) => c !== clause) : [...prev, clause]
    );
  }

  const SaveButton = ({ section }: { section: string }) => (
    <Button
      className="gap-2 bg-blue-600 hover:bg-blue-700"
      disabled={saving === section}
      onClick={() => handleSave(section)}
    >
      {saving === section ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
      ) : saved === section ? (
        <Check className="h-4 w-4 text-green-400" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {saving === section ? "Saving..." : saved === section ? "Saved!" : "Save Changes"}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account, preferences, and integrations.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/60 border border-border p-1 flex-wrap h-auto">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-muted">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 data-[state=active]:bg-muted">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2 data-[state=active]:bg-muted">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Risk Profile</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2 data-[state=active]:bg-muted">
            <Puzzle className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="gap-2 data-[state=active]:bg-muted">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="glass-card p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Profile Information</h3>
              <p className="text-sm text-muted-foreground">Update your personal details and jurisdiction preference.</p>
            </div>

            <Separator className="bg-muted" />

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="border-border bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  Email
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input
                  id="email"
                  value={session?.user?.email ?? ""}
                  readOnly
                  className="border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label>Jurisdiction Preference</Label>
                <Select value={profileJurisdiction} onValueChange={setProfileJurisdiction}>
                  <SelectTrigger className="border-border bg-muted/50">
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="IN">India</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={(session?.user as any)?.role ?? "user"}
                  readOnly
                  className="border-border bg-muted/50 text-muted-foreground cursor-not-allowed capitalize"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <SaveButton section="profile" />
            </div>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <div className="glass-card p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Preferences</h3>
              <p className="text-sm text-muted-foreground">Configure your default view and notification settings.</p>
            </div>

            <Separator className="bg-muted" />

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  Default Dashboard View
                </Label>
                <Select value={defaultView} onValueChange={setDefaultView}>
                  <SelectTrigger className="max-w-xs border-border bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cxo">CXO View</SelectItem>
                    <SelectItem value="legal">Legal View</SelectItem>
                    <SelectItem value="client">Client View</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {defaultView === "cxo" && "High-level metrics and executive summaries"}
                  {defaultView === "legal" && "Detailed clause analysis and risk breakdown"}
                  {defaultView === "client" && "Simplified view with key action items"}
                </p>
              </div>

              <Separator className="bg-muted" />

              <div className="space-y-1 mb-4">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Notifications
                </Label>
                <p className="text-xs text-muted-foreground">Choose which notifications you receive.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                  <div>
                    <p className="text-sm font-medium">Risk Alerts</p>
                    <p className="text-xs text-muted-foreground">Get notified when high-risk clauses are detected</p>
                  </div>
                  <Switch checked={riskAlerts} onCheckedChange={setRiskAlerts} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                  <div>
                    <p className="text-sm font-medium">Weekly Digest</p>
                    <p className="text-xs text-muted-foreground">Summary of contract activity every Monday</p>
                  </div>
                  <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                  <div>
                    <p className="text-sm font-medium">Analysis Complete</p>
                    <p className="text-xs text-muted-foreground">Notify when contract analysis finishes</p>
                  </div>
                  <Switch checked={analysisComplete} onCheckedChange={setAnalysisComplete} />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <SaveButton section="preferences" />
            </div>
          </div>
        </TabsContent>

        {/* Risk Profile Tab */}
        <TabsContent value="risk">
          <div className="glass-card p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Risk Profile</h3>
              <p className="text-sm text-muted-foreground">Customize how Clause AI evaluates and flags risks for you.</p>
            </div>

            <Separator className="bg-muted" />

            {/* Risk Tolerance */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-muted-foreground" />
                Risk Tolerance
              </Label>
              <div className="space-y-3">
                <div className="relative px-1">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={riskTolerance}
                    onChange={(e) => setRiskTolerance(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-blue-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-400 [&::-webkit-slider-thumb]:shadow-lg"
                  />
                  <div className="flex justify-between mt-2">
                    {RISK_LEVELS.map((level) => (
                      <span
                        key={level.value}
                        className={cn(
                          "text-xs transition-colors",
                          riskTolerance === level.value ? "text-blue-400 font-medium" : "text-muted-foreground"
                        )}
                      >
                        {level.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <p className="text-sm text-foreground font-medium">
                    {RISK_LEVELS[riskTolerance].label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {RISK_LEVELS[riskTolerance].description}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-muted" />

            {/* Preferred Clauses */}
            <div className="space-y-3">
              <Label>Preferred Clause Focus Areas</Label>
              <p className="text-xs text-muted-foreground">
                Select which clause types to prioritize during analysis.
              </p>
              <div className="flex flex-wrap gap-2">
                {PREFERRED_CLAUSES.map((clause) => (
                  <button
                    key={clause}
                    onClick={() => toggleClause(clause)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-all",
                      selectedClauses.includes(clause)
                        ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                        : "border-border bg-muted/50 text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    {clause}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-muted" />

            {/* Voice Profile */}
            <div className="space-y-2">
              <Label>AI Voice Profile</Label>
              <p className="text-xs text-muted-foreground">
                How should Clause AI communicate findings to you?
              </p>
              <div className="grid gap-3 sm:grid-cols-3 mt-2">
                {[
                  { value: "corporate", label: "Corporate", desc: "Formal, precise legal language" },
                  { value: "concise", label: "Concise", desc: "Brief, action-oriented summaries" },
                  { value: "educational", label: "Educational", desc: "Detailed explanations with context" },
                ].map((voice) => (
                  <button
                    key={voice.value}
                    onClick={() => setVoiceProfile(voice.value)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition-all",
                      voiceProfile === voice.value
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-border bg-muted/50 hover:bg-muted/60"
                    )}
                  >
                    <p className={cn(
                      "text-sm font-medium",
                      voiceProfile === voice.value ? "text-blue-400" : "text-foreground"
                    )}>
                      {voice.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{voice.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <SaveButton section="risk" />
            </div>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="glass-card p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Integrations</h3>
              <p className="text-sm text-muted-foreground">Connect Clause AI with your existing tools and workflows.</p>
            </div>

            <Separator className="bg-muted" />

            <div className="grid gap-4 sm:grid-cols-2">
              {INTEGRATIONS.map((integration) => (
                <div
                  key={integration.id}
                  className="rounded-lg border border-border bg-muted/50 p-5 flex items-start justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/60 text-2xl">
                      {integration.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{integration.name}</p>
                        {integration.comingSoon && (
                          <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/30">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={integration.comingSoon}
                    className="shrink-0 border-border text-muted-foreground"
                  >
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Admin Tab */}
        {isAdmin && (
          <TabsContent value="admin">
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">User Management</h3>
                <p className="text-sm text-muted-foreground">Add, remove, and manage users in your organization.</p>
              </div>

              <Separator className="bg-muted" />

              {/* Add User Form */}
              <div className="rounded-lg border border-border bg-muted/50 p-5 space-y-4">
                <h4 className="text-sm font-medium">Add New User</h4>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <Input
                      placeholder="user@company.com"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="border-border bg-muted/50"
                    />
                  </div>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger className="w-[130px] border-border bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    disabled={!newUserEmail.trim()}
                    onClick={() => {
                      setNewUserEmail("");
                      handleSave("admin");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add User
                  </Button>
                </div>
              </div>

              {/* User List */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Current Users</h4>
                {managedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                        <User className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                        className={user.role === "admin" ? "bg-blue-600" : ""}
                      >
                        {user.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        disabled={user.email === session?.user?.email}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
