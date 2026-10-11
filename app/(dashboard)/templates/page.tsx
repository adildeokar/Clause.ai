"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookTemplate,
  Check,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  Filter,
  Globe,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { JurisdictionSelect } from "@/components/app/jurisdiction-select";
import { useWorkingJurisdiction } from "@/components/layout/jurisdiction-context";
import {
  JURISDICTIONS,
  JURISDICTION_CODES,
  jurisdictionName,
  type JurisdictionCode,
} from "@/config/jurisdictions";

interface TemplateField {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  jurisdiction: string;
  content: string;
  fields: TemplateField[];
}

interface Generated {
  contractId: string;
  text: string;
  notes: string[];
}

function TemplateCardSkeleton() {
  return (
    <div className="glass-card animate-pulse p-5">
      <div className="mb-3 h-5 w-40 rounded bg-muted" />
      <div className="mb-2 h-3 w-full rounded bg-muted" />
      <div className="mb-4 h-3 w-2/3 rounded bg-muted" />
      <div className="h-5 w-16 rounded-full bg-muted" />
    </div>
  );
}

export default function TemplatesPage() {
  const { jurisdiction: workingJurisdiction } = useWorkingJurisdiction();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("All");

  const [selected, setSelected] = useState<Template | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [targetJurisdiction, setTargetJurisdiction] = useState<JurisdictionCode>(workingJurisdiction);
  const [useLocalLanguage, setUseLocalLanguage] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [copied, setCopied] = useState(false);

  const targetLanguage = JURISDICTIONS[targetJurisdiction].language;

  function openTemplate(template: Template) {
    setSelected(template);
    setFieldValues({});
    setTargetJurisdiction(workingJurisdiction);
    setUseLocalLanguage(false);
    setGenerated(null);
    setGenerateError(null);
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/templates");
        if (!res.ok) throw new Error("Failed to load templates");
        const data: any[] = await res.json();
        const loaded: Template[] = data.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? "",
          category: t.category,
          jurisdiction: t.jurisdiction,
          content: t.content ?? "",
          fields: Array.isArray(t.fields) ? t.fields : [],
        }));
        setTemplates(loaded);

        // The dashboard carousel links here with ?generate=<templateId>.
        const requestedId = new URLSearchParams(window.location.search).get("generate");
        const requested = loaded.find((t) => t.id === requestedId);
        if (requested) openTemplate(requested);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load templates");
      } finally {
        setLoading(false);
      }
    }
    load();
    // Runs once on mount; openTemplate only reads the initial working jurisdiction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(templates.map((t) => t.category))).sort()],
    [templates]
  );

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter(
      (t) =>
        (!query || t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)) &&
        (categoryFilter === "All" || t.category === categoryFilter) &&
        (jurisdictionFilter === "All" || t.jurisdiction === jurisdictionFilter)
    );
  }, [templates, search, categoryFilter, jurisdictionFilter]);

  async function handleGenerate() {
    if (!selected) return;
    const missing = selected.fields.filter((f) => f.required && !fieldValues[f.name]?.trim());
    if (missing.length > 0) {
      setGenerateError(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch(`/api/templates/${selected.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fieldValues,
          jurisdiction: targetJurisdiction,
          useLocalLanguage: useLocalLanguage && targetLanguage !== "English",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Generation failed. Please try again.");
      setGenerated({ contractId: data.contract.id, text: data.contract.text, notes: data.notes ?? [] });
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-lg text-muted-foreground">{loadError}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-medium leading-tight tracking-[-0.08px] text-black">Rule Book</h1>
        <p className="mt-1 text-base text-[#868686]">
          Generate contracts from templates, adapted to the law of any supported jurisdiction.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="border-border bg-muted/50 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[190px] border-border bg-muted/50">
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
            <SelectTrigger className="w-[190px] border-border bg-muted/50">
              <Globe className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Jurisdiction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Jurisdictions</SelectItem>
              {JURISDICTION_CODES.map((code) => (
                <SelectItem key={code} value={code}>
                  {jurisdictionName(code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
            <BookTemplate className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No templates found</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {templates.length ? "Try adjusting your search or filters." : "No templates have been added yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => openTemplate(template)}
              className="glass-card group p-5 text-left transition-all duration-200 hover:border-[#66A689] hover:bg-[#F4F7F6]"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E5F0EB]">
                    <FileText className="h-5 w-5 text-[#006A3B]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold transition-colors group-hover:text-[#006A3B]">
                      {template.name}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs text-muted-foreground">
                      {template.category}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mb-4 line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Globe className="mr-1 h-3 w-3" />
                  {jurisdictionName(template.jurisdiction)} base
                </Badge>
                <span className="text-xs text-muted-foreground">{template.fields.length} fields</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.description}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {generated ? (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-[#006A3B]" />
                    Generated for {jurisdictionName(targetJurisdiction)}
                  </h4>
                  {generated.notes.length > 0 && (
                    <ul className="space-y-1 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                      {generated.notes.map((note, i) => (
                        <li key={i} className="text-xs text-[#9F6402]">
                          • {note}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="rounded-lg border border-[#66A689]/20 bg-[#F4F7F6] p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                      {generated.text}
                    </pre>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-sm font-medium">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      Template Preview
                    </h4>
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-muted/50 p-4">
                      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
                        {selected?.content}
                      </pre>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Generate for</Label>
                      <JurisdictionSelect value={targetJurisdiction} onChange={setTargetJurisdiction} />
                    </div>
                    {targetLanguage !== "English" && (
                      <div className="flex items-center justify-between gap-3 sm:pt-7">
                        <Label htmlFor="local-language" className="text-sm">
                          Draft in {targetLanguage}
                        </Label>
                        <Switch
                          id="local-language"
                          checked={useLocalLanguage}
                          onCheckedChange={setUseLocalLanguage}
                        />
                      </div>
                    )}
                  </div>

                  {selected && selected.fields.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Fill in the details</h4>
                      {selected.fields.map((field) => (
                        <div key={field.name} className="space-y-2">
                          <Label htmlFor={`field-${field.name}`} className="text-sm">
                            {field.label}
                            {field.required && <span className="ml-1 text-red-500">*</span>}
                          </Label>
                          {field.type === "textarea" ? (
                            <Textarea
                              id={`field-${field.name}`}
                              placeholder={field.placeholder}
                              className="min-h-[80px] border-border bg-muted/50"
                              value={fieldValues[field.name] ?? ""}
                              onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                            />
                          ) : (
                            <Input
                              id={`field-${field.name}`}
                              type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                              placeholder={field.placeholder}
                              className="border-border bg-muted/50"
                              value={fieldValues[field.name] ?? ""}
                              onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                            />
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        Leave anything blank and it will be marked [TO BE COMPLETED].
                      </p>
                    </div>
                  )}
                </>
              )}

              {generateError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-sm text-red-600">{generateError}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex flex-wrap gap-3 border-t border-border pt-4">
            {generated ? (
              <>
                <Button variant="outline" className="flex-1 border-border" onClick={() => setGenerated(null)}>
                  Edit Fields
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-border"
                  onClick={() => {
                    navigator.clipboard.writeText(generated.text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button asChild className="flex-1 bg-[#006A3B] hover:bg-[#005a32]">
                  <Link href={`/contracts/${generated.contractId}?analyze=1`}>Open & Analyze</Link>
                </Button>
              </>
            ) : (
              <Button
                className="w-full gap-2 bg-[#006A3B] hover:bg-[#005a32]"
                disabled={generating}
                onClick={handleGenerate}
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Generating… this takes about 20 seconds" : "Generate Contract"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
