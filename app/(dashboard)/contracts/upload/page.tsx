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
  CheckCircle2,
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
import { Progress } from "@/components/ui/progress";

const JURISDICTIONS = [
  { value: "US", label: "United States" },
  { value: "IN", label: "India" },
  { value: "UK", label: "United Kingdom" },
];

const CONTRACT_TYPES = [
  "Service Agreement",
  "Non-Disclosure Agreement",
  "Employment Contract",
  "Software License Agreement",
  "Partnership Agreement",
  "Lease Agreement",
  "Sales Agreement",
  "Consulting Agreement",
  "Master Service Agreement",
  "Statement of Work",
  "Terms of Service",
  "Privacy Policy",
  "Vendor Agreement",
  "Distribution Agreement",
  "Joint Venture Agreement",
];

const ACCEPTED_TYPES: Record<string, { label: string; color: string }> = {
  "application/pdf": { label: "PDF", color: "text-red-400 bg-red-500/10" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    label: "DOCX",
    color: "text-blue-400 bg-blue-500/10",
  },
  "application/msword": {
    label: "DOC",
    color: "text-blue-400 bg-blue-500/10",
  },
  "text/plain": { label: "TXT", color: "text-green-400 bg-green-500/10" },
};

const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(",") + ",.pdf,.docx,.doc,.txt";

function getFileTypeInfo(file: File) {
  const byMime = ACCEPTED_TYPES[file.type];
  if (byMime) return byMime;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return { label: "PDF", color: "text-red-400 bg-red-500/10" };
  if (ext === "docx" || ext === "doc") return { label: ext.toUpperCase(), color: "text-blue-400 bg-blue-500/10" };
  if (ext === "txt") return { label: "TXT", color: "text-green-400 bg-green-500/10" };
  return { label: ext?.toUpperCase() ?? "FILE", color: "text-muted-foreground bg-white/[0.06]" };
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [jurisdiction, setJurisdiction] = useState("US");
  const [contractType, setContractType] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    if (!title) {
      const name = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(name.charAt(0).toUpperCase() + name.slice(1));
    }

    if (selectedFile.type === "text/plain" || selectedFile.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setPreview(text.slice(0, 2000));
      };
      reader.readAsText(selectedFile);
    } else {
      setPreview(null);
    }
  }, [title]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFile(selectedFile);
    },
    [handleFile]
  );

  const removeFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("jurisdiction", jurisdiction);
      if (contractType) formData.append("contractType", contractType);

      const res = await fetch("/api/contracts", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      setProgress(100);
      const contract = await res.json();

      setTimeout(() => {
        router.push(`/contracts/${contract.id}`);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contracts
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Upload Contract</h2>
        <p className="text-muted-foreground mt-1">
          Upload a contract document for AI-powered analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drop Zone */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
            dragActive
              ? "border-blue-500 bg-blue-500/5"
              : file
                ? "border-green-500/30 bg-green-500/5"
                : "border-white/[0.1] hover:border-white/[0.2] bg-white/[0.02]"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${getFileTypeInfo(file).color}`}
                  >
                    <File className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getFileTypeInfo(file).label} &middot;{" "}
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={removeFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 mb-4">
                <Upload className="h-7 w-7 text-blue-400" />
              </div>
              <p className="text-sm font-medium mb-1">
                Drag & drop your contract here
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                or click to browse files
              </p>
              <div className="flex items-center gap-3 mb-4">
                {[
                  { label: "PDF", color: "text-red-400 bg-red-500/10" },
                  { label: "DOCX", color: "text-blue-400 bg-blue-500/10" },
                  { label: "DOC", color: "text-blue-400 bg-blue-500/10" },
                  { label: "TXT", color: "text-green-400 bg-green-500/10" },
                ].map(({ label, color }) => (
                  <span
                    key={label}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${color}`}
                  >
                    <FileText className="h-3 w-3" />
                    {label}
                  </span>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/[0.08]"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_STRING}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={handleFileInput}
            disabled={uploading}
          />
        </div>

        {/* Text Preview */}
        {preview && (
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Text Preview
            </h3>
            <div className="max-h-48 overflow-y-auto rounded-lg bg-white/[0.02] p-3">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {preview}
                {preview.length >= 2000 && (
                  <span className="text-blue-400">... (truncated)</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="glass-card p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Contract Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Software License Agreement — Acme Corp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-white/[0.08] bg-white/[0.02]"
              disabled={uploading}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Jurisdiction</Label>
              <Select
                value={jurisdiction}
                onValueChange={setJurisdiction}
                disabled={uploading}
              >
                <SelectTrigger className="border-white/[0.08] bg-white/[0.02]">
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Contract Type</Label>
              <Select
                value={contractType}
                onValueChange={setContractType}
                disabled={uploading}
              >
                <SelectTrigger className="border-white/[0.08] bg-white/[0.02]">
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

        {/* Upload Progress */}
        {uploading && (
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {progress >= 100 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                )}
                <span className="text-sm font-medium">
                  {progress >= 100
                    ? "Upload complete! Redirecting..."
                    : "Uploading and processing..."}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 bg-white/[0.06]"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/contracts">
            <Button type="button" variant="ghost" disabled={uploading}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="gap-2 bg-blue-600 hover:bg-blue-700 min-w-[160px]"
            disabled={uploading || !file}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload & Analyze
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
