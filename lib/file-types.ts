/** Upload formats and limits, shared by the upload page and the server. */

export const TEXT_EXTENSIONS = ["pdf", "docx", "doc", "odt", "rtf", "txt", "md", "html", "htm"] as const;
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;
export const SUPPORTED_EXTENSIONS = [...TEXT_EXTENSIONS, ...IMAGE_EXTENSIONS] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

/** Vercel rejects request bodies above 4.5 MB before they reach the app. */
export const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "4.5 MB";

export const ACCEPT_ATTRIBUTE = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function isSupportedExtension(ext: string): ext is SupportedExtension {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}

export function isImageExtension(ext: string) {
  return (IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}
