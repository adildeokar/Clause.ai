/**
 * Single source of truth for supported jurisdictions. Everything that lists,
 * labels, validates or prompts with a jurisdiction reads from here.
 */
export const JURISDICTIONS = {
  US: {
    code: "US",
    name: "United States",
    legalSystem: "Common law",
    language: "English",
    keyLaws:
      "UCC Article 2 (sale of goods); state contract law and choice-of-law rules; unconscionability doctrine; FTC Act and state consumer-protection statutes; state limits on non-competes (e.g. California B&P Code §16600).",
  },
  IN: {
    code: "IN",
    name: "India",
    legalSystem: "Common law (Indian Contract Act 1872)",
    language: "English",
    keyLaws:
      "Indian Contract Act 1872 (s.27 voids restraints of trade, s.73-74 damages and penalties, s.124 indemnity); Specific Relief Act 1963; Arbitration and Conciliation Act 1996; Consumer Protection Act 2019; DPDP Act 2023; state stamp duty.",
  },
  UK: {
    code: "UK",
    name: "United Kingdom",
    legalSystem: "Common law (English law)",
    language: "English",
    keyLaws:
      "Unfair Contract Terms Act 1977; Consumer Rights Act 2015; UK GDPR and Data Protection Act 2018; Late Payment of Commercial Debts (Interest) Act 1998; penalty doctrine (Cavendish v Makdessi); restraint-of-trade doctrine.",
  },
  FR: {
    code: "FR",
    name: "France",
    legalSystem: "Civil law (Code civil, 2016 contract-law reform)",
    language: "French",
    keyLaws:
      "Code civil: good faith (art. 1104), significant imbalance in adhesion contracts deemed unwritten (art. 1171), hardship/imprévision (art. 1195), penalty clauses adjustable by the judge (art. 1231-5); Code de commerce L442-1 (significant imbalance and abrupt termination of established commercial relations); Code de la consommation L212-1 (unfair terms); Code du travail (non-competes require financial compensation); GDPR and Loi Informatique et Libertés (CNIL); Loi Toubon (French-language requirement for employment and consumer contracts).",
  },
  BR: {
    code: "BR",
    name: "Brazil",
    legalSystem: "Civil law (Código Civil 2002)",
    language: "Portuguese",
    keyLaws:
      "Código Civil (Lei 10.406/2002): social function of contracts (art. 421), objective good faith (art. 422), adhesion contracts read in favour of the adherent and waivers of inherent rights void (arts. 423-424), penalty clause capped at the principal obligation (art. 412); Código de Defesa do Consumidor (Lei 8.078/1990, art. 51 abusive clauses void); CLT labour protections (non-competes need time/territory limits and compensation); LGPD (Lei 13.709/2018); Lei de Arbitragem (Lei 9.307/1996).",
  },
} as const;

export type JurisdictionCode = keyof typeof JURISDICTIONS;

export const JURISDICTION_CODES = Object.keys(JURISDICTIONS) as JurisdictionCode[];

export const DEFAULT_JURISDICTION: JurisdictionCode = "US";

export function isJurisdictionCode(value: unknown): value is JurisdictionCode {
  return typeof value === "string" && value in JURISDICTIONS;
}

/** Returns `value` if it is a supported code, otherwise `fallback`. */
export function toJurisdictionCode(
  value: unknown,
  fallback: JurisdictionCode = DEFAULT_JURISDICTION
): JurisdictionCode {
  return isJurisdictionCode(value) ? value : fallback;
}

export function jurisdictionName(code: string): string {
  return isJurisdictionCode(code) ? JURISDICTIONS[code].name : code;
}

/** Compact legal context injected into AI prompts. */
export function jurisdictionContext(code: string): string {
  const j = JURISDICTIONS[toJurisdictionCode(code)];
  return `Jurisdiction: ${j.name} — ${j.legalSystem}. Key law: ${j.keyLaws}`;
}

export const CONTRACT_TYPES = [
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
] as const;
