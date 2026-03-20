import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("password", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@clauseai.com" },
    update: {},
    create: {
      email: "admin@clauseai.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "admin",
      jurisdiction: "US",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@clauseai.com" },
    update: {},
    create: {
      email: "user@clauseai.com",
      name: "Demo User",
      passwordHash: userPassword,
      role: "user",
      jurisdiction: "US",
    },
  });

  await prisma.riskProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      riskTolerance: "moderate",
      industry: "Technology",
      voiceProfile: "professional",
    },
  });

  await prisma.riskProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      riskTolerance: "moderate",
      industry: "General",
      voiceProfile: "professional",
    },
  });

  const templates = [
    {
      name: "Non-Disclosure Agreement",
      description:
        "Standard mutual NDA for protecting confidential information shared between parties.",
      category: "NDA",
      jurisdiction: "US",
      content: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of {{effective_date}} by and between:

{{party_a_name}}, a {{party_a_type}} organized under the laws of {{party_a_jurisdiction}} ("Disclosing Party")

and

{{party_b_name}}, a {{party_b_type}} organized under the laws of {{party_b_jurisdiction}} ("Receiving Party")

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by either party to the other party, either directly or indirectly, in writing, orally, or by inspection of tangible objects, that is designated as "Confidential," "Proprietary," or some similar designation, or that should reasonably be understood to be confidential given the nature of the information and circumstances of disclosure.

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party shall: (a) hold the Confidential Information in strict confidence; (b) not disclose the Confidential Information to any third parties without prior written consent; (c) use the Confidential Information solely for the purpose of {{purpose}}; (d) protect the Confidential Information using the same degree of care it uses to protect its own confidential information, but in no event less than reasonable care.

3. EXCLUSIONS
Confidential Information does not include information that: (a) is or becomes publicly known through no fault of the Receiving Party; (b) was known to the Receiving Party prior to disclosure; (c) is independently developed by the Receiving Party; (d) is rightfully received from a third party without restriction.

4. TERM
This Agreement shall remain in effect for {{term_years}} years from the Effective Date. The obligations of confidentiality shall survive termination for a period of {{survival_years}} years.

5. RETURN OF MATERIALS
Upon termination or request, the Receiving Party shall promptly return or destroy all Confidential Information and any copies thereof.

6. GOVERNING LAW
This Agreement shall be governed by the laws of {{governing_law_state}}.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.`,
      fields: JSON.stringify([
        { name: "effective_date", label: "Effective Date", type: "date" },
        { name: "party_a_name", label: "Party A Name", type: "text" },
        { name: "party_a_type", label: "Party A Type", type: "text", placeholder: "e.g., corporation" },
        { name: "party_a_jurisdiction", label: "Party A Jurisdiction", type: "text" },
        { name: "party_b_name", label: "Party B Name", type: "text" },
        { name: "party_b_type", label: "Party B Type", type: "text", placeholder: "e.g., LLC" },
        { name: "party_b_jurisdiction", label: "Party B Jurisdiction", type: "text" },
        { name: "purpose", label: "Purpose of Disclosure", type: "text" },
        { name: "term_years", label: "Term (Years)", type: "number", placeholder: "2" },
        { name: "survival_years", label: "Survival Period (Years)", type: "number", placeholder: "3" },
        { name: "governing_law_state", label: "Governing Law State", type: "text" },
      ]),
    },
    {
      name: "Service Agreement",
      description:
        "Professional services agreement template for B2B engagements.",
      category: "Service Agreement",
      jurisdiction: "US",
      content: `PROFESSIONAL SERVICES AGREEMENT

This Professional Services Agreement ("Agreement") is made effective as of {{effective_date}} by and between:

{{client_name}} ("Client")
and
{{provider_name}} ("Service Provider")

1. SERVICES
Service Provider agrees to perform the following services: {{service_description}}

2. COMPENSATION
Client agrees to pay Service Provider {{payment_amount}} {{payment_frequency}} for the services described herein. Payment shall be due within {{payment_terms}} days of invoice.

3. TERM AND TERMINATION
This Agreement shall commence on {{start_date}} and continue for {{term_months}} months. Either party may terminate this Agreement with {{notice_days}} days written notice.

4. INTELLECTUAL PROPERTY
All work product created under this Agreement shall be the property of {{ip_owner}}.

5. CONFIDENTIALITY
Both parties agree to maintain the confidentiality of all proprietary information exchanged during the course of this engagement.

6. LIABILITY
Service Provider's total liability shall not exceed {{liability_cap}}.

7. GOVERNING LAW
This Agreement shall be governed by the laws of {{governing_law}}.`,
      fields: JSON.stringify([
        { name: "effective_date", label: "Effective Date", type: "date" },
        { name: "client_name", label: "Client Name", type: "text" },
        { name: "provider_name", label: "Service Provider Name", type: "text" },
        { name: "service_description", label: "Service Description", type: "textarea" },
        { name: "payment_amount", label: "Payment Amount", type: "text" },
        { name: "payment_frequency", label: "Payment Frequency", type: "text", placeholder: "e.g., monthly" },
        { name: "payment_terms", label: "Payment Terms (Days)", type: "number", placeholder: "30" },
        { name: "start_date", label: "Start Date", type: "date" },
        { name: "term_months", label: "Term (Months)", type: "number" },
        { name: "notice_days", label: "Notice Period (Days)", type: "number", placeholder: "30" },
        { name: "ip_owner", label: "IP Owner", type: "text", placeholder: "Client or Service Provider" },
        { name: "liability_cap", label: "Liability Cap", type: "text" },
        { name: "governing_law", label: "Governing Law", type: "text" },
      ]),
    },
    {
      name: "Employment Contract",
      description:
        "Standard employment agreement for full-time employees.",
      category: "Employment Contract",
      jurisdiction: "US",
      content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into as of {{effective_date}} by and between:

{{company_name}} ("Employer")
and
{{employee_name}} ("Employee")

1. POSITION AND DUTIES
Employee is hired for the position of {{position_title}}. Employee shall report to {{reporting_to}} and perform duties as reasonably assigned.

2. COMPENSATION
Employee shall receive an annual salary of {{salary}} payable in accordance with Employer's standard payroll practices.

3. BENEFITS
Employee shall be eligible for {{benefits_description}}.

4. TERM
Employment shall commence on {{start_date}}. This is an {{employment_type}} position.

5. TERMINATION
Either party may terminate this Agreement with {{notice_period}} written notice. Employer may terminate immediately for cause.

6. CONFIDENTIALITY
Employee agrees to maintain confidentiality of all proprietary information during and after employment.

7. NON-COMPETE
For a period of {{non_compete_months}} months after termination, Employee shall not engage in competitive activities within {{non_compete_geography}}.

8. GOVERNING LAW
This Agreement shall be governed by the laws of {{governing_law}}.`,
      fields: JSON.stringify([
        { name: "effective_date", label: "Effective Date", type: "date" },
        { name: "company_name", label: "Company Name", type: "text" },
        { name: "employee_name", label: "Employee Name", type: "text" },
        { name: "position_title", label: "Position Title", type: "text" },
        { name: "reporting_to", label: "Reports To", type: "text" },
        { name: "salary", label: "Annual Salary", type: "text" },
        { name: "benefits_description", label: "Benefits", type: "textarea" },
        { name: "start_date", label: "Start Date", type: "date" },
        { name: "employment_type", label: "Employment Type", type: "text", placeholder: "at-will or fixed-term" },
        { name: "notice_period", label: "Notice Period", type: "text", placeholder: "e.g., 2 weeks" },
        { name: "non_compete_months", label: "Non-Compete (Months)", type: "number" },
        { name: "non_compete_geography", label: "Non-Compete Geography", type: "text" },
        { name: "governing_law", label: "Governing Law", type: "text" },
      ]),
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { id: template.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: template.name.toLowerCase().replace(/\s+/g, "-"),
        ...template,
        fields: template.fields ? JSON.parse(template.fields) : undefined,
      },
    });
  }

  console.log("Seeded users:", { admin: admin.email, user: user.email });
  console.log("Seeded templates:", templates.length);
  console.log("Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
