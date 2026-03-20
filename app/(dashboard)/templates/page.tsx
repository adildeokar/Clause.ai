"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BookTemplate,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Clock,
  Globe,
  FileText,
  Eye,
  Sparkles,
  X,
  ChevronRight,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  jurisdiction: string;
  content: string;
  fields: TemplateField[];
  createdAt: string;
}

interface TemplateField {
  name: string;
  label: string;
  type: "text" | "date" | "number" | "select";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

const CATEGORIES = [
  "All",
  "Service Agreement",
  "NDA",
  "Employment Contract",
  "Software License",
  "Partnership Agreement",
  "Lease Agreement",
  "Consulting Agreement",
] as const;

const JURISDICTIONS = ["All", "US", "IN", "UK"] as const;

const JURISDICTION_LABELS: Record<string, string> = {
  US: "United States",
  IN: "India",
  UK: "United Kingdom",
};

const MOCK_TEMPLATES: Template[] = [
  {
    id: "t1",
    name: "Standard NDA",
    description: "Mutual non-disclosure agreement suitable for business discussions, partnerships, and preliminary negotiations.",
    category: "NDA",
    jurisdiction: "US",
    content: "MUTUAL NON-DISCLOSURE AGREEMENT\n\nThis Mutual Non-Disclosure Agreement (\"Agreement\") is entered into as of {{effective_date}} by and between {{party_a_name}} (\"Party A\") and {{party_b_name}} (\"Party B\").\n\n1. CONFIDENTIAL INFORMATION\nEach party may disclose confidential information to the other party...\n\n2. OBLIGATIONS\nThe receiving party shall hold confidential information in strict confidence...\n\n3. TERM\nThis Agreement shall remain in effect for {{term_years}} year(s) from the Effective Date.",
    fields: [
      { name: "effective_date", label: "Effective Date", type: "date", required: true },
      { name: "party_a_name", label: "Party A Name", type: "text", required: true, placeholder: "Your Company Name" },
      { name: "party_b_name", label: "Party B Name", type: "text", required: true, placeholder: "Other Party Name" },
      { name: "term_years", label: "Term (Years)", type: "number", required: true, placeholder: "2" },
    ],
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "t2",
    name: "Master Service Agreement",
    description: "Comprehensive service agreement framework covering deliverables, payment terms, IP rights, and dispute resolution.",
    category: "Service Agreement",
    jurisdiction: "US",
    content: "MASTER SERVICE AGREEMENT\n\nThis Master Service Agreement (\"MSA\") is entered into by {{client_name}} (\"Client\") and {{provider_name}} (\"Provider\") as of {{start_date}}.\n\n1. SERVICES\nProvider shall perform the services described in each Statement of Work...\n\n2. COMPENSATION\nClient shall pay Provider as specified in the applicable SOW...",
    fields: [
      { name: "client_name", label: "Client Name", type: "text", required: true },
      { name: "provider_name", label: "Provider Name", type: "text", required: true },
      { name: "start_date", label: "Start Date", type: "date", required: true },
    ],
    createdAt: "2025-01-20T10:00:00Z",
  },
  {
    id: "t3",
    name: "Employment Agreement",
    description: "Standard employment contract covering role, compensation, benefits, termination, and post-employment restrictions.",
    category: "Employment Contract",
    jurisdiction: "IN",
    content: "EMPLOYMENT AGREEMENT\n\nThis Employment Agreement is made on {{joining_date}} between {{company_name}} (\"Employer\") and {{employee_name}} (\"Employee\").\n\n1. POSITION\nEmployee shall serve as {{position}} reporting to {{reporting_to}}...",
    fields: [
      { name: "company_name", label: "Company Name", type: "text", required: true },
      { name: "employee_name", label: "Employee Name", type: "text", required: true },
      { name: "joining_date", label: "Joining Date", type: "date", required: true },
      { name: "position", label: "Position/Title", type: "text", required: true },
      { name: "reporting_to", label: "Reporting Manager", type: "text", required: false },
    ],
    createdAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "t4",
    name: "Software License Agreement",
    description: "End-user or enterprise software license agreement with usage rights, restrictions, and SLA terms.",
    category: "Software License",
    jurisdiction: "US",
    content: "SOFTWARE LICENSE AGREEMENT\n\nThis Software License Agreement (\"Agreement\") is between {{licensor_name}} (\"Licensor\") and {{licensee_name}} (\"Licensee\").\n\n1. LICENSE GRANT\nLicensor grants Licensee a non-exclusive license to use {{software_name}}...",
    fields: [
      { name: "licensor_name", label: "Licensor Name", type: "text", required: true },
      { name: "licensee_name", label: "Licensee Name", type: "text", required: true },
      { name: "software_name", label: "Software Name", type: "text", required: true },
    ],
    createdAt: "2025-02-10T10:00:00Z",
  },
  {
    id: "t5",
    name: "Consulting Agreement (UK)",
    description: "Professional consulting services agreement compliant with UK law, covering scope, fees, and liability.",
    category: "Consulting Agreement",
    jurisdiction: "UK",
    content: "CONSULTING AGREEMENT\n\nThis Consulting Agreement is made on {{effective_date}} between {{client_name}} (\"Client\") and {{consultant_name}} (\"Consultant\").\n\n1. ENGAGEMENT\nClient hereby engages Consultant to provide consulting services as described herein...",
    fields: [
      { name: "client_name", label: "Client Name", type: "text", required: true },
      { name: "consultant_name", label: "Consultant Name", type: "text", required: true },
      { name: "effective_date", label: "Effective Date", type: "date", required: true },
    ],
    createdAt: "2025-02-15T10:00:00Z",
  },
  {
    id: "t6",
    name: "Partnership Agreement",
    description: "General partnership agreement defining roles, profit-sharing, decision-making, and dissolution terms.",
    category: "Partnership Agreement",
    jurisdiction: "IN",
    content: "PARTNERSHIP AGREEMENT\n\nThis Partnership Agreement is entered into on {{date}} among the following partners: {{partner_names}}.\n\n1. BUSINESS PURPOSE\nThe partnership shall conduct business as {{business_name}}...",
    fields: [
      { name: "partner_names", label: "Partner Names", type: "text", required: true, placeholder: "Partner 1, Partner 2" },
      { name: "business_name", label: "Business Name", type: "text", required: true },
      { name: "date", label: "Agreement Date", type: "date", required: true },
    ],
    createdAt: "2025-02-20T10:00:00Z",
  },
  {
    id: "t7",
    name: "Residential Lease Agreement",
    description: "Standard residential property lease covering rent, security deposit, maintenance, and tenant obligations.",
    category: "Lease Agreement",
    jurisdiction: "US",
    content: "RESIDENTIAL LEASE AGREEMENT\n\nThis Lease Agreement is made on {{lease_date}} between {{landlord_name}} (\"Landlord\") and {{tenant_name}} (\"Tenant\").\n\n1. PROPERTY\nLandlord leases to Tenant the property at {{property_address}}...",
    fields: [
      { name: "landlord_name", label: "Landlord Name", type: "text", required: true },
      { name: "tenant_name", label: "Tenant Name", type: "text", required: true },
      { name: "lease_date", label: "Lease Date", type: "date", required: true },
      { name: "property_address", label: "Property Address", type: "text", required: true },
    ],
    createdAt: "2025-03-01T10:00:00Z",
  },
  {
    id: "t8",
    name: "NDA (India)",
    description: "Non-disclosure agreement compliant with Indian Contract Act 1872, suitable for domestic and cross-border use.",
    category: "NDA",
    jurisdiction: "IN",
    content: "NON-DISCLOSURE AGREEMENT\n\nThis Agreement is made under the Indian Contract Act 1872 on {{date}} between {{disclosing_party}} and {{receiving_party}}...",
    fields: [
      { name: "disclosing_party", label: "Disclosing Party", type: "text", required: true },
      { name: "receiving_party", label: "Receiving Party", type: "text", required: true },
      { name: "date", label: "Agreement Date", type: "date", required: true },
    ],
    createdAt: "2025-03-05T10:00:00Z",
  },
];

function TemplateCardSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="h-5 w-40 rounded bg-white/[0.06] mb-3" />
      <div className="h-3 w-full rounded bg-white/[0.06] mb-2" />
      <div className="h-3 w-2/3 rounded bg-white/[0.06] mb-4" />
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
        <div className="h-5 w-12 rounded-full bg-white/[0.06]" />
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setTemplates(data.map((t: any) => ({
              ...t,
              fields: t.fields ?? MOCK_TEMPLATES.find((m) => m.category === t.category)?.fields ?? [],
            })));
          } else {
            setTemplates(MOCK_TEMPLATES);
          }
        } else {
          setTemplates(MOCK_TEMPLATES);
        }
      } catch {
        setTemplates(MOCK_TEMPLATES);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
      const matchesJurisdiction = jurisdictionFilter === "All" || t.jurisdiction === jurisdictionFilter;
      return matchesSearch && matchesCategory && matchesJurisdiction;
    });
  }, [templates, search, categoryFilter, jurisdictionFilter]);

  const debouncedSearch = useMemo(() => {
    let timer: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => setSearch(value), 300);
    };
  }, []);

  function openTemplate(template: Template) {
    setSelectedTemplate(template);
    setFieldValues({});
    setGeneratedContract(null);
  }

  async function handleGenerate() {
    if (!selectedTemplate) return;

    const missing = selectedTemplate.fields
      .filter((f) => f.required && !fieldValues[f.name]?.trim())
      .map((f) => f.label);

    if (missing.length > 0) return;

    setGenerating(true);
    try {
      const res = await fetch(`/api/templates/${selectedTemplate.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: fieldValues }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedContract(data.content ?? data.generatedContent ?? "");
      } else {
        let filled = selectedTemplate.content;
        Object.entries(fieldValues).forEach(([key, value]) => {
          filled = filled.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || `[${key}]`);
        });
        setGeneratedContract(filled);
      }
    } catch {
      let filled = selectedTemplate.content;
      Object.entries(fieldValues).forEach(([key, value]) => {
        filled = filled.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || `[${key}]`);
      });
      setGeneratedContract(filled);
    } finally {
      setGenerating(false);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Templates</h2>
          <p className="text-muted-foreground">
            Browse and generate contracts from pre-built legal templates.
          </p>
        </div>
        {isAdmin && (
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9 border-white/[0.08] bg-white/[0.02]"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] border-white/[0.08] bg-white/[0.02]">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
            <SelectTrigger className="w-[150px] border-white/[0.08] bg-white/[0.02]">
              <Globe className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Jurisdiction" />
            </SelectTrigger>
            <SelectContent>
              {JURISDICTIONS.map((j) => (
                <SelectItem key={j} value={j}>
                  {j === "All" ? "All Jurisdictions" : JURISDICTION_LABELS[j] ?? j}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] mb-4">
            <BookTemplate className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No templates found</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => openTemplate(template)}
              className="glass-card p-5 text-left transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.12] group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                    <FileText className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </p>
                    <Badge variant="outline" className="text-xs text-muted-foreground mt-1">
                      {template.category}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                {template.description}
              </p>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    template.jurisdiction === "US" && "text-blue-400 border-blue-500/30",
                    template.jurisdiction === "IN" && "text-orange-400 border-orange-500/30",
                    template.jurisdiction === "UK" && "text-purple-400 border-purple-500/30"
                  )}
                >
                  <Globe className="h-3 w-3 mr-1" />
                  {template.jurisdiction}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {template.fields.length} fields
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="glass-card border-white/[0.08] max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {/* Template Preview */}
              {!generatedContract && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    Template Preview
                  </h4>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                      {selectedTemplate?.content}
                    </pre>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              {!generatedContract && selectedTemplate?.fields && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Fill in the details</h4>
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label className="text-sm">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </Label>
                      <Input
                        type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                        placeholder={field.placeholder}
                        className="border-white/[0.08] bg-white/[0.02]"
                        value={fieldValues[field.name] ?? ""}
                        onChange={(e) =>
                          setFieldValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Generated Contract */}
              {generatedContract && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    Generated Contract
                  </h4>
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                      {generatedContract}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
            {generatedContract ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1 border-white/[0.08]"
                  onClick={() => setGeneratedContract(null)}
                >
                  Edit Fields
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContract);
                  }}
                >
                  Copy to Clipboard
                </Button>
              </>
            ) : (
              <Button
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={generating}
                onClick={handleGenerate}
              >
                {generating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {generating ? "Generating..." : "Generate Contract"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
