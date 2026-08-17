import { researchDisclaimer, site } from "@/data/site";
import { trustSignals } from "@/data/trustSignals";

/**
 * Structured Terms of Sale / Use for the public /terms page.
 * Operational storefront language — have counsel review before treating as final.
 */

export type TermsTextPart = string | { href: string; label: string };

export type TermsSection = {
  id: string;
  heading: string;
  paragraphs: TermsTextPart[][];
  bullets?: string[];
};

const legalName = trustSignals.legalEntityName ?? site.name;

/** Stable section ids — tests assert this ordered list. */
export const TERMS_SECTION_IDS = [
  "agreement",
  "eligibility",
  "research-use-only",
  "buyer-representations",
  "products-and-information",
  "orders-and-acceptance",
  "pricing-taxes-payment",
  "shipping-and-risk",
  "returns-and-refunds",
  "prohibited-conduct",
  "intellectual-property",
  "third-parties",
  "disclaimers",
  "limitation-of-liability",
  "indemnity",
  "export-and-compliance",
  "electronic-communications",
  "privacy",
  "changes",
  "termination",
  "governing-law",
  "general",
  "contact",
] as const;

export type TermsSectionId = (typeof TERMS_SECTION_IDS)[number];

export const termsIntro: TermsTextPart[][] = [
  [
    `These Terms of Sale and Use (“Terms”) govern your access to and use of the ${site.name} website and any purchase of products from ${legalName} (“we,” “us,” or “our”). By browsing the site, creating an order, or completing checkout, you agree to these Terms.`,
  ],
  [
    "This document is operational storefront language for our research-product catalog. It is not a substitute for advice from your own attorney. We recommend legal review before relying on these Terms as final for your jurisdiction or purchasing program.",
  ],
];

export const termsSections: TermsSection[] = [
  {
    id: "agreement",
    heading: "1. Agreement",
    paragraphs: [
      [
        `The seller under these Terms is ${legalName}, doing business as ${site.name}. These Terms form a binding agreement between you and us concerning website use and product sales.`,
      ],
      [
        "If you do not agree to these Terms, do not use the site or place an order. If you are accepting on behalf of an institution or company, you represent that you have authority to bind that organization.",
      ],
    ],
  },
  {
    id: "eligibility",
    heading: "2. Eligibility and age",
    paragraphs: [
      [
        `You must be at least ${site.ageMinimum} years of age to access the site or purchase products. By using the site, you confirm that you meet this age requirement and have legal capacity to enter a contract.`,
      ],
      [
        "Purchases are intended for qualified researchers, laboratories, and institutions acting within applicable law. By placing an order, the purchaser represents and warrants that the products are being acquired solely for legitimate laboratory research purposes and will not be administered to humans or animals. We may request information reasonably needed to assess eligibility or research-use compliance and may decline orders that we cannot verify. We do not claim to independently verify every purchaser’s professional credentials unless such verification is separately stated for a given order.",
      ],
    ],
  },
  {
    id: "research-use-only",
    heading: "3. Research use only",
    paragraphs: [
      [researchDisclaimer],
      [
        "Without limiting the foregoing, products are sold and intended solely as laboratory research materials. They are not offered, labeled, or intended for human or veterinary administration, diagnosis, treatment, prevention, or cure of any condition; personal consumption; compounding for patient use; cosmetic or dietary-supplement use; or any other non-research application.",
      ],
      [
        "You are solely responsible for ensuring that your acquisition, possession, storage, handling, and use of products comply with all applicable laws, institutional policies, and laboratory safety rules. Certificates of analysis and assay information, when provided, speak to identity and purity context for research lots — not clinical fitness or therapeutic performance. These Terms and site disclaimers do not guarantee regulatory compliance for your specific use case.",
      ],
    ],
    bullets: [
      "Do not administer products to humans or animals.",
      "Do not market or resell products in channels that imply human use, wellness outcomes, or consumer self-administration.",
      "Do not rely on product pages, certificates, or site content as medical, veterinary, or dosing advice.",
    ],
  },
  {
    id: "buyer-representations",
    heading: "4. Buyer representations",
    paragraphs: [
      [
        "By placing an order or completing checkout acknowledgment, you represent and warrant that:",
      ],
    ],
    bullets: [
      "You (or the institution you represent) are purchasing solely for legitimate laboratory research use by qualified personnel.",
      "You will not use, or permit others to use, products for human or veterinary administration, diagnosis, treatment, prevention, or consumption.",
      "Shipping, billing, and contact information you provide are accurate and complete.",
      "You will follow your institution’s standard operating procedures for storage, laboratory stock preparation (where applicable), handling, and disposal.",
      "Your purchase and intended laboratory use do not violate applicable law or export/sanctions rules.",
    ],
  },
  {
    id: "products-and-information",
    heading: "5. Products and information",
    paragraphs: [
      [
        "Catalog names, descriptions, specifications, images, research-context notes, and certificates are provided to help qualified buyers identify research materials. Content may be updated, corrected, or clarified without prior notice.",
      ],
      [
        "We do not warrant that product information is error-free, complete for every protocol, or suitable for any particular experimental design. Lot-specific documentation, when available, controls over generic catalog text for that lot.",
      ],
      [
        "Appearance, fill, and packaging may vary within ordinary manufacturing and handling tolerances. Availability of vial sizes and SKUs may change.",
      ],
    ],
  },
  {
    id: "orders-and-acceptance",
    heading: "6. Orders and acceptance",
    paragraphs: [
      [
        "Your order constitutes an offer to purchase. An order confirmation, payment authorization, or status email does not, by itself, guarantee acceptance or shipment if we later identify compliance, fraud, inventory, pricing, or address issues.",
      ],
      [
        "We reserve the right to refuse, cancel, or limit any order, including orders that appear incomplete, fraudulent, abusive, or inconsistent with research-use requirements; orders placed with incorrect or unverifiable information; or orders affected by obvious pricing or catalog errors.",
      ],
      [
        "If we cancel a paid order that will not ship, we will refund the amount charged for the cancelled items through the original payment method when practicable.",
      ],
    ],
  },
  {
    id: "pricing-taxes-payment",
    heading: "7. Pricing, taxes, and payment",
    paragraphs: [
      [
        "Prices are listed in U.S. dollars unless otherwise stated and may change at any time before we accept an order. Applicable sales tax and shipping charges are calculated at checkout where required.",
      ],
      [
        "Payment is processed through our checkout flow and, when applicable, a Stripe-hosted checkout page. We do not store full payment-card numbers on our servers. Card data is handled by the payment provider under its own terms and security controls.",
      ],
      [
        "You authorize us and our payment processor to charge the payment method you provide for the order total, including taxes and shipping. Failed, reversed, or disputed payments may result in order hold, cancellation, or collection of amounts owed to the extent permitted by law.",
      ],
    ],
  },
  {
    id: "shipping-and-risk",
    heading: "8. Shipping and risk of loss",
    paragraphs: [
      [
        "We pack and tender orders to carriers according to our handling practices and the shipping method selected or offered at checkout. Estimated ship windows are targets, not guarantees. Carrier transit times are outside our sole control.",
      ],
      [
        `${site.shippingNote}. Promotional or threshold shipping terms may change; the checkout total controls for a given order.`,
      ],
      [
        "Title and risk of loss pass to you when we tender the package to the carrier, except where mandatory law provides otherwise. You acknowledge that research materials can be temperature- and handling-sensitive; inspect shipments promptly and report damage or shortage as described in our refunds policy.",
      ],
    ],
  },
  {
    id: "returns-and-refunds",
    heading: "9. Returns and refunds",
    paragraphs: [
      [
        "Because research products are sensitive and often leave a controlled handling chain upon delivery, return eligibility is limited. Opened vials and products that cannot be restocked for research resale are generally non-returnable.",
      ],
      [
        "Damaged, lost, or incorrect shipments should be reported promptly with order details and photos when applicable. The controlling returns and refunds policy is published at ",
        { href: "/refunds", label: "Refunds & returns" },
        ", which is incorporated by reference into these Terms.",
      ],
    ],
  },
  {
    id: "prohibited-conduct",
    heading: "10. Prohibited conduct",
    paragraphs: [
      ["You agree not to:"],
    ],
    bullets: [
      "Use the site or products unlawfully, or in violation of these Terms or research-use restrictions.",
      "Provide false research-use acknowledgments or misrepresent your identity, institution, or intended use.",
      "Interfere with site security, scrape the catalog in a way that degrades service, or attempt unauthorized access to systems or data.",
      "Divert, relabel, or resell products in a manner that implies human use, therapeutic benefit, or consumer self-administration.",
      "Abuse payment, chargeback, or refund processes in bad faith.",
    ],
  },
  {
    id: "intellectual-property",
    heading: "11. Intellectual property",
    paragraphs: [
      [
        `The website, including text, layout, logos, product imagery, and other content (excluding third-party marks or materials), is owned by ${legalName} or its licensors and is protected by intellectual property laws.`,
      ],
      [
        "You may view and print pages for your own legitimate purchasing and laboratory documentation purposes. You may not copy the catalog wholesale, scrape product assets for a competing storefront, or use our marks in a way that suggests endorsement without prior written permission.",
      ],
    ],
  },
  {
    id: "third-parties",
    heading: "12. Third parties",
    paragraphs: [
      [
        "We use third parties for services such as payment processing, shipping, hosting, and analytical or manufacturing partners. Those parties operate under their own terms and privacy practices when you interact with them directly.",
      ],
      [
        "Links to third-party sites (including certificate hosts or partner pages) are provided for convenience. We do not control and are not responsible for third-party content, availability, or policies.",
      ],
    ],
  },
  {
    id: "disclaimers",
    heading: "13. Disclaimers",
    paragraphs: [
      [
        'TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SITE AND PRODUCTS ARE PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.',
      ],
      [
        "Without limiting the foregoing, we do not warrant that products will meet any particular experimental goal, that assay results will be reproducible in your system, or that the site will be uninterrupted or error-free. Nothing on the site is medical, veterinary, or legal advice.",
      ],
    ],
  },
  {
    id: "limitation-of-liability",
    heading: "14. Limitation of liability",
    paragraphs: [
      [
        "TO THE MAXIMUM EXTENT PERMITTED BY KENTUCKY LAW, WE AND OUR OFFICERS, MEMBERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, BUSINESS, OR GOODWILL, ARISING OUT OF OR RELATED TO THE SITE, THESE TERMS, OR ANY PRODUCT PURCHASE, WHETHER BASED IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR OTHER THEORY, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
      ],
      [
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATED TO THESE TERMS OR A PRODUCT ORDER WILL NOT EXCEED THE AMOUNT YOU PAID TO US FOR THE SPECIFIC ORDER GIVING RISE TO THE CLAIM.",
      ],
      [
        "Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the fullest extent permitted by applicable law.",
      ],
    ],
  },
  {
    id: "indemnity",
    heading: "15. Indemnification",
    paragraphs: [
      [
        `You agree to defend, indemnify, and hold harmless ${legalName} and its officers, members, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys’ fees) arising out of or related to: (a) your breach of these Terms or research-use representations; (b) your misuse or unlawful use of products or the site; (c) your violation of law or third-party rights; or (d) content or feedback you submit to us, except to the extent caused by our willful misconduct.`,
      ],
    ],
  },
  {
    id: "export-and-compliance",
    heading: "16. Export controls and compliance",
    paragraphs: [
      [
        "You are responsible for complying with U.S. and other applicable export-control, sanctions, customs, and chemical-handling laws. You may not purchase or divert products for prohibited end uses or to prohibited parties or destinations.",
      ],
      [
        "Laboratory registration, permitting, waste disposal, and workplace-safety obligations remain yours (or your institution’s). We do not assume responsibility for your protocol design or regulatory filings.",
      ],
    ],
  },
  {
    id: "electronic-communications",
    heading: "17. Electronic communications (email and SMS)",
    paragraphs: [
      [
        `By providing an email address, phone number, or other contact details on the site (including checkout, contact forms, or restock notifications), you agree that ${legalName} may communicate with you electronically. These communications may include transactional messages and, where permitted and where you have consented, promotional messages.`,
      ],
      [
        "Transactional and service emails. We may email you about your orders, payment status, shipping and tracking, returns or claims, restock requests you submit, incomplete checkout or saved-cart reminders related to a purchase you started, account or compliance questions, and other messages needed to complete a transaction or respond to you. You cannot opt out of certain transactional emails while a purchase or support matter is open, though you may use a different contact method when we offer one.",
      ],
      [
        "Promotional email. If you subscribe to updates or otherwise consent to marketing email, we may send catalog, restock, or promotional messages. You may unsubscribe using the link in those emails or by contacting ",
        { href: `mailto:${site.email}`, label: site.email },
        ". Unsubscribing from marketing email does not stop transactional messages related to orders you place.",
      ],
      [
        "SMS and text messages. If you provide a mobile phone number and expressly consent to text messages (for example by opting in at checkout or on a form that requests SMS consent), you authorize us to send SMS/text messages to that number. Message types may include order or shipment updates, restock alerts you request, and—only if you separately consent—promotional offers. Message frequency varies. Message and data rates may apply. Carrier compatibility is not guaranteed.",
      ],
      [
        "You can opt out of marketing SMS by replying STOP to a message from us, or by emailing ",
        { href: `mailto:${site.email}`, label: site.email },
        " with your mobile number and a request to stop texts. For help, reply HELP or contact us at the same email. Opting out of SMS marketing does not automatically cancel email communications or transactional notices we must send by email. Consent to SMS is not a condition of purchasing research products.",
      ],
      [
        "You represent that contact details you provide are accurate and that you are authorized to receive messages at those addresses or numbers (including that you are the subscriber or customary user of any mobile number you provide for SMS). Electronic communications satisfy any legal requirement that a communication be in writing, to the extent permitted by law. Additional detail on how we handle contact data appears in our ",
        { href: "/privacy", label: "Privacy policy" },
        ".",
      ],
    ],
  },
  {
    id: "privacy",
    heading: "18. Privacy",
    paragraphs: [
      [
        "How we collect and use personal information is described in our ",
        { href: "/privacy", label: "Privacy policy" },
        ", which is incorporated by reference for informational practices. If there is a conflict between these Terms and the Privacy policy on a privacy-specific topic, the Privacy policy controls for that topic.",
      ],
    ],
  },
  {
    id: "changes",
    heading: "19. Changes to these Terms",
    paragraphs: [
      [
        "We may update these Terms from time to time. The “Last updated” date on this page indicates when the posted Terms last changed. Continued use of the site after posting, or placement of a new order, constitutes acceptance of the updated Terms for that use or order.",
      ],
      [
        "Material changes apply prospectively. We may also provide additional notice by email or site banner when practicable.",
      ],
    ],
  },
  {
    id: "termination",
    heading: "20. Termination and refusal of service",
    paragraphs: [
      [
        "We may suspend or terminate access to purchasing features, refuse future orders, or cancel pending orders if you breach these Terms, fail eligibility or research-use requirements, engage in fraud or abuse, or if we are required to do so by law or risk controls.",
      ],
      [
        "Sections that by their nature should survive (including research-use obligations, electronic communications consents as permitted by law, disclaimers, limitation of liability, indemnity, and governing law) will survive termination.",
      ],
    ],
  },
  {
    id: "governing-law",
    heading: "21. Governing law and venue",
    paragraphs: [
      [
        `These Terms are governed by the laws of the Commonwealth of Kentucky, without regard to conflict-of-law rules that would require application of another jurisdiction’s laws.`,
      ],
      [
        "Exclusive venue for disputes arising out of or relating to these Terms, the site, or any purchase shall be the state or federal courts located in Kentucky (including courts sitting in Jefferson County, Kentucky), and you consent to personal jurisdiction there, except where mandatory law requires otherwise.",
      ],
    ],
  },
  {
    id: "general",
    heading: "22. General",
    paragraphs: [
      [
        "If any provision of these Terms is held unenforceable, the remaining provisions remain in effect. Our failure to enforce a provision is not a waiver of our right to enforce it later.",
      ],
      [
        "You may not assign these Terms without our prior written consent; we may assign them in connection with a reorganization, merger, or sale of assets. These Terms, together with policies expressly incorporated by reference (including Privacy and Refunds), constitute the entire agreement between you and us regarding the subject matter and supersede prior conflicting website statements on the same subject.",
      ],
      [
        "Notices under these Terms may be sent to ",
        { href: `mailto:${site.email}`, label: site.email },
        ". We may provide notices to you via the email, phone number, or address associated with your order or inquiry.",
      ],
    ],
  },
  {
    id: "contact",
    heading: "23. Contact",
    paragraphs: [
      [
        `Questions about these Terms: `,
        { href: `mailto:${site.email}`, label: site.email },
        ".",
      ],
    ],
  },
];

export function getTermsSectionIds(): string[] {
  return termsSections.map((section) => section.id);
}
