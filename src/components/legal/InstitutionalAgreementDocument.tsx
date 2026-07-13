import Link from "next/link";
import styles from "./InstitutionalAgreementDocument.module.css";

export interface AgreementDisplayData {
  institutionLegalName?: string | null;
  institutionType?: string | null;
  jurisdiction?: string | null;
  address?: Array<string | null>;
  programName?: string | null;
  specialty?: string | null;
  residentSeats?: number | null;
  facultySeats?: number | null;
  pilotStartDate?: string | Date | null;
  pilotEndDate?: string | Date | null;
  purchaseOrderRequired?: boolean;
  purchaseOrderNumber?: string | null;
  securityReviewRequired?: boolean;
  dataProcessingRequired?: boolean;
  agreementVersion?: string | null;
}

const value = (input?: string | number | null) => input || "To be completed in the order form";
const date = (input?: string | Date | null) => input ? new Date(input).toLocaleDateString("en-CA", { dateStyle: "medium", timeZone: "UTC" }) : "To be scheduled";

export function InstitutionalAgreementDocument({ data = {} }: { data?: AgreementDisplayData }) {
  return <article className={styles.document}>
    <header>
      <div><span>HIPPO MEDICINE INC.</span><h1>Institutional Pilot and Services Agreement</h1></div>
      <dl><div><dt>Version</dt><dd>{data.agreementVersion ?? "2026-07-13"}</dd></div><div><dt>Pilot term</dt><dd>30 days</dd></div></dl>
    </header>

    <p className={styles.notice}>This agreement becomes binding only when completed for a named institution and accepted by an authorized signatory. Institutions should complete their own legal, privacy, security, and procurement review before acceptance.</p>

    <section><h2>Order Form</h2><div className={styles.orderGrid}>
      <Order label="Customer legal name" value={value(data.institutionLegalName)} />
      <Order label="Institution type" value={value(data.institutionType)} />
      <Order label="Jurisdiction" value={value(data.jurisdiction)} />
      <Order label="Program" value={value(data.programName)} />
      <Order label="Specialty" value={value(data.specialty)} />
      <Order label="Address" value={data.address?.filter(Boolean).join(", ") || "To be completed in the order form"} wide />
      <Order label="Pilot start" value={date(data.pilotStartDate)} />
      <Order label="Pilot end" value={date(data.pilotEndDate)} />
      <Order label="Resident seats" value={value(data.residentSeats)} />
      <Order label="Faculty/staff seats" value={value(data.facultySeats)} />
      <Order label="Purchase order" value={data.purchaseOrderRequired ? data.purchaseOrderNumber || "Required; number pending" : "Not required"} />
      <Order label="Data-processing schedule" value={data.dataProcessingRequired === false ? "Not requested" : "Included"} />
    </div></section>

    <Section number="1" title="Parties and scope"><p>This Institutional Pilot and Services Agreement (the “Agreement”) is between Hippo Medicine Inc., a Manitoba corporation (“Hippo”), and the customer identified in the Order Form (“Customer”). Hippo will provide the hosted Hippo residency-program platform, implementation guidance, program analytics, reporting, and support described here for the named program.</p></Section>
    <Section number="2" title="Pilot and subscription"><p>The initial pilot lasts 30 days from the pilot start date. Resident and fellow personal accounts remain free regardless of Customer&apos;s purchasing decision. Institutional administration, cohort oversight, accreditation exports, faculty workflows, and program reports require an active institutional plan after the pilot. Any paid term, price, taxes, seat limits, and renewal interval shown in Stripe Checkout or an accepted purchase order become part of this Agreement.</p></Section>
    <Section number="3" title="Implementation and support"><p>Hippo will provide the onboarding workflow, reasonable remote implementation assistance, and email support during the pilot. Customer will appoint an implementation owner, supply an authorized roster, configure rotations and forms, and make faculty and residents reasonably available for onboarding. The pilot is evaluated using adoption, activity, completion, sign-off, and workflow metrics shown in the command center and executive report.</p></Section>
    <Section number="4" title="Permitted use and customer responsibilities"><p>Customer may use the service for education, program administration, quality improvement, and accreditation preparation. Customer controls its users and role assignments and is responsible for obtaining internal approvals and giving required notices. Customer must not enter patient names, medical record numbers, precise birth dates, contact information, unredacted clinical notes, or other direct patient identifiers. Hippo is not a clinical system, medical device, credentialing authority, or substitute for Customer&apos;s official systems unless expressly agreed in writing.</p></Section>
    <Section number="5" title="Training records and resident access"><p>Residents retain access to their personal logbook and may export their own data. Customer receives program-scoped views and reports for authorized members only. Customer must use those views fairly, transparently, and consistently with its policies and applicable law. Termination of an institutional plan does not convert free resident accounts into paid accounts or transfer ownership of a resident&apos;s personal content to Customer.</p></Section>
    <Section number="6" title="Privacy and data processing"><p>Each party will comply with applicable privacy law. Where Customer designates information as institutional data, Customer is the controller, trustee, or equivalent responsible organization and Hippo acts as service provider or information manager. The Data Processing Schedule below applies when selected in the Order Form. Hippo will process institutional data only to provide, secure, support, and improve the contracted service, or as legally required.</p></Section>
    <Section number="7" title="Security"><p>Hippo will maintain reasonable administrative, technical, and physical safeguards appropriate to the service and its early-stage risk profile, including access controls, encrypted transport, managed database controls, audit records for sensitive actions, and incident response. Current controls and subprocessors are published at <Link href="/legal/security">Security</Link> and <Link href="/legal/subprocessors">Subprocessors</Link>. Customer acknowledges those disclosures and any exceptions recorded during procurement.</p></Section>
    <Section number="8" title="Confidentiality"><p>Each party will protect the other&apos;s non-public business, technical, security, and personal information using at least reasonable care and use it only for this Agreement. These obligations do not cover information independently developed, lawfully received without restriction, already public without breach, or required to be disclosed by law. Legally compelled disclosure will be preceded by notice where permitted.</p></Section>
    <Section number="9" title="Ownership"><p>Hippo owns the platform, software, documentation, designs, aggregated service analytics, and related intellectual property. Customer and users retain ownership of their submitted content. Customer grants Hippo a limited licence to host, process, transmit, and display content solely to operate the service. Hippo may use de-identified, aggregated statistics that cannot reasonably identify Customer, a user, or a patient.</p></Section>
    <Section number="10" title="Fees, taxes, and payment"><p>Fees are billed through Stripe or invoiced under an accepted purchase order. Unless an order form states otherwise, subscription fees are due in advance, non-refundable except where required by law, and automatically renew for the selected interval until cancelled. Customer is responsible for applicable taxes other than taxes on Hippo&apos;s income. Past-due institutional features may be suspended after reasonable notice; free resident access remains available.</p></Section>
    <Section number="11" title="Warranties and disclaimer"><p>Each party warrants that it has authority to enter this Agreement. Hippo warrants that the service will materially conform to its published documentation during the paid term. Customer&apos;s exclusive remedy for breach of that warranty is re-performance or, if Hippo cannot cure, termination and a pro-rated refund of prepaid unused fees. Except for that express warranty, the service is provided “as is” and “as available,” without implied warranties to the maximum extent permitted by law.</p></Section>
    <Section number="12" title="Indemnity"><p>Hippo will defend Customer against a third-party claim that the unmodified service infringes Canadian intellectual-property rights and pay finally awarded damages, provided Customer promptly notifies and cooperates with Hippo. Hippo may modify, replace, or terminate the affected service. Customer will defend Hippo against third-party claims arising from Customer content, unlawful use, unauthorized patient information, or Customer&apos;s violation of law or this Agreement. Neither party may settle a claim in a manner admitting fault or imposing non-monetary obligations on the other without consent.</p></Section>
    <Section number="13" title="Limitation of liability"><p>Neither party is liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or loss of profits, revenue, goodwill, or data, even if advised of the possibility. Except for payment obligations, confidentiality breaches, indemnity obligations, fraud, wilful misconduct, or liabilities that cannot lawfully be limited, each party&apos;s aggregate liability is limited to fees paid or payable by Customer in the 12 months before the event giving rise to the claim.</p></Section>
    <Section number="14" title="Term, termination, and data return"><p>Either party may terminate for material breach not cured within 30 days after written notice, or immediately for insolvency, unlawful use, or a serious security risk. Customer may cancel renewal through the billing portal. For 30 days after termination, authorized users may export available program reports and residents may export personal records. Hippo may then delete institutional data according to its retention process, subject to backups, legal holds, and data it must retain for legal evidence.</p></Section>
    <Section number="15" title="General"><p>The parties are independent contractors. Neither may use the other&apos;s name or marks publicly without written consent. Neither is liable for delay caused by events beyond reasonable control. Customer may not assign this Agreement without consent, except in a merger or sale of substantially all assets; Hippo may assign it in connection with a reorganization or sale. Notices go to the Order Form contacts and legal@hippomedicine.com. Manitoba law and the federal laws of Canada applicable there govern, and courts in Winnipeg, Manitoba have exclusive jurisdiction. This Agreement, the Order Form, accepted checkout terms, Data Processing Schedule, and incorporated policies are the entire agreement; an executed order form prevails over conflicting online terms for the institutional service.</p></Section>

    <section><h2>Data Processing Schedule</h2>
      <p><strong>Subject and duration.</strong> Hosting and processing program account, roster, training-activity, assessment, and support data for the Agreement term and the return/deletion period.</p>
      <p><strong>People and data.</strong> Program directors, coordinators, faculty, residents, fellows, and authorized staff; names, emails, roles, training level, case metadata without direct patient identifiers, assessments, workflow activity, support communications, and security logs.</p>
      <p><strong>Instructions.</strong> Hippo processes data only under this Agreement, Customer&apos;s documented configuration, and lawful support requests. Hippo will notify Customer if it believes an instruction violates applicable law.</p>
      <p><strong>Personnel and subprocessors.</strong> Authorized personnel are bound by confidentiality. Customer authorizes the subprocessors listed on Hippo&apos;s Subprocessors page, subject to notice of material changes and Customer&apos;s right to object on reasonable data-protection grounds.</p>
      <p><strong>Security and incidents.</strong> Hippo will maintain reasonable safeguards, notify Customer without undue delay after confirming a breach affecting institutional personal data, and provide information reasonably necessary for Customer&apos;s response.</p>
      <p><strong>Requests, return, and deletion.</strong> Hippo will reasonably assist Customer with data-subject requests, privacy assessments, regulator inquiries, and return or deletion, considering the nature of processing and information available. Customer remains responsible for deciding whether and how to respond.</p>
      <p><strong>Audit.</strong> No more than annually, Hippo will provide available security and compliance information reasonably requested by Customer. A further audit requires reasonable notice, confidentiality, minimal disruption, and reimbursement of Hippo&apos;s reasonable costs unless a material breach is found.</p>
    </section>
  </article>;
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section><h2>{number}. {title}</h2>{children}</section>;
}

function Order({ label, value: content, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? styles.wide : undefined}><dt>{label}</dt><dd>{content}</dd></div>;
}
