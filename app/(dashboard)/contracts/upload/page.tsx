"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  File,
  X,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JurisdictionSelect } from "@/components/app/jurisdiction-select";
import { useWorkingJurisdiction } from "@/components/layout/jurisdiction-context";
import { CONTRACT_TYPES, type JurisdictionCode } from "@/config/jurisdictions";
import {
  ACCEPT_ATTRIBUTE,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  SUPPORTED_EXTENSIONS,
  getExtension,
  isImageExtension,
  isSupportedExtension,
} from "@/lib/file-types";
import { cn } from "@/lib/utils";

const FORMAT_CHIPS = [
  { label: "PDF", color: "text-red-500 bg-red-500/10" },
  { label: "Word", color: "text-[#006A3B] bg-[#E5F0EB]" },
  { label: "ODT · RTF · TXT · MD · HTML", color: "text-[#4B4B4B] bg-[#F4F7F6]" },
  { label: "Scans & photos", color: "text-purple-500 bg-purple-500/10" },
];

function fileBadge(ext: string) {
  if (ext === "pdf") return { label: "PDF", color: "text-red-500 bg-red-500/10" };
  if (["docx", "doc", "odt"].includes(ext)) return { label: ext.toUpperCase(), color: "text-[#006A3B] bg-[#E5F0EB]" };
  if (isImageExtension(ext)) return { label: "IMAGE", color: "text-purple-500 bg-purple-500/10" };
  return { label: ext.toUpperCase(), color: "text-[#4B4B4B] bg-[#F4F7F6]" };
}

function titleFromFileName(name: string) {
  const base = name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { jurisdiction: workingJurisdiction } = useWorkingJurisdiction();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [jurisdiction, setJurisdiction] = useState<JurisdictionCode | null>(null);
  const [contractType, setContractType] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveJurisdiction = jurisdiction ?? workingJurisdiction;
  const ext = file ? getExtension(file.name) : "";
  const needsOcr = isImageExtension(ext) || ext === "pdf";

  const selectFile = useCallback((selected: File) => {
    const selectedExt = getExtension(selected.name);
    if (!isSupportedExtension(selectedExt)) {
      setError(
        `".${selectedExt || "?"}" files aren't supported. Use: ${SUPPORTED_EXTENSIONS.join(", ")}.`
      );
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      setError(`This file is ${(selected.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_LABEL}.`);
      return;
    }
    setError(null);
    setFile(selected);
    setTitle((current) => current || titleFromFileName(selected.name));
  }, []);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }

  function handleDrop(e: React.DragEvent) {
    handleDrag(e);
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) selectFile(dropped);
  }

  function removeFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError("Please select a file to upload.");
    if (!title.trim()) return setError("Please enter a title.");

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("jurisdiction", effectiveJurisdiction);
      if (contractType) formData.append("contractType", contractType);

      const res = await fetch("/api/contracts", { method: "POST", body: formData });
      if (res.status === 413) throw new Error(`This file is too large. The limit is ${MAX_UPLOAD_LABEL}.`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed. Please try again.");

      // The contract page starts the analysis and opens the document chat.
      router.push(`/contracts/${data.id}?analyze=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/contracts"
          className="mb-4 inline-flex items-center gap-1 text-sm text-[#868686] transition-colors hover:text-[#006A3B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Repository
        </Link>
        <h1 className="text-[32px] font-medium leading-tight tracking-[-0.08px] text-black">
          Upload Contract
        </h1>
        <p className="mt-1 text-base text-[#868686]">
          Upload any contract, NDA or terms — we extract the clauses, analyze the risk and let you chat with it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={cn(
            "relative rounded-xl border-2 border-dashed transition-all duration-200",
            dragActive
              ? "border-[#66A689] bg-[#F4F7F6]"
              : file
                ? "border-green-500/30 bg-green-500/5"
                : "border-border bg-muted/50 hover:border-primary/40"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center justify-between p-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", fileBadge(ext).color)}>
                  <File className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fileBadge(ext).label} &middot; {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative z-10 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={removeFile}
                disabled={uploading}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E5F0EB]">
                <Upload className="h-7 w-7 text-[#006A3B]" />
              </div>
              <p className="mb-1 text-sm font-medium">Drag & drop your document here</p>
              <p className="mb-4 text-xs text-muted-foreground">
                or click to browse — up to {MAX_UPLOAD_LABEL}
              </p>
              <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                {FORMAT_CHIPS.map(({ label, color }) => (
                  <span
                    key={label}
                    className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium", color)}
                  >
                    <FileText className="h-3 w-3" />
                    {label}
                  </span>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="border-border">
                Browse Files
              </Button>
            </div>
          )}
          {!file && (
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
              disabled={uploading}
              aria-label="Choose a document"
            />
          )}
        </div>

        <div className="glass-card space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Contract Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Software License Agreement — Acme Corp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-border bg-muted/50"
              disabled={uploading}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Jurisdiction</Label>
              <JurisdictionSelect
                value={effectiveJurisdiction}
                onChange={setJurisdiction}
                disabled={uploading}
                className="border-border bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Contract Type</Label>
              <Select value={contractType} onValueChange={setContractType} disabled={uploading}>
                <SelectTrigger className="border-border bg-muted/50">
                  <SelectValue placeholder="Select type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {uploading && (
          <div className="glass-card flex items-center gap-3 p-5">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#006A3B]" />
            <div>
              <p className="text-sm font-medium">Reading your document…</p>
              <p className="text-xs text-muted-foreground">
                {needsOcr
                  ? "Scanned pages and photos are read with OCR, which can take up to a minute."
                  : "Extracting text and splitting it into clauses."}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" disabled={uploading} asChild>
            <Link href="/contracts">Cancel</Link>
          </Button>
          <Button
            type="submit"
            className="min-w-[160px] gap-2 bg-[#006A3B] hover:bg-[#005a32]"
            disabled={uploading || !file}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload & Analyze"}
          </Button>
        </div>
      </form>
    </div>
  );
}
