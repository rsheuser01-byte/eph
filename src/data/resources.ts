export type ResourceCitation = {
  label: string;
  href: string;
};

export type ResourceSection = {
  heading: string;
  paragraphs: string[];
};

export type ResourcePage = {
  slug: string;
  title: string;
  /** Short nav/index label. */
  navLabel: string;
  description: string;
  eyebrow: string;
  headline: string;
  lede: string;
  sections: ResourceSection[];
  citations: ResourceCitation[];
};

export function resourceWordCount(page: ResourcePage): number {
  const text = [
    page.lede,
    ...page.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
    ]),
  ].join(" ");
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function getResourceBySlug(slug: string): ResourcePage | undefined {
  return resourcePages.find((page) => page.slug === slug);
}

/**
 * Educational resource pages (Phase 3 #2). RUO framing only — no dosing or
 * therapeutic guidance. Citations are primary / official references.
 */
export const resourcePages: ResourcePage[] = [
  {
    slug: "research-use-only",
    title: "Research use only: what it means",
    navLabel: "Research use only",
    description:
      "What “research use only” means for Elevate Precision Health products, who may purchase them, and how RUO differs from drugs, foods, cosmetics, and supplements.",
    eyebrow: "Compliance",
    headline: "Research use only — what it means and why it matters",
    lede: "Every product on this site is sold for laboratory research. That label is not marketing language; it defines who the buyer is, how the material may be handled, and what claims we do not make.",
    sections: [
      {
        heading: "What “research use only” means here",
        paragraphs: [
          "Research use only (RUO) means the material is intended for laboratory investigation by qualified researchers and institutions — for example assay development, receptor pharmacology, analytical method work, or other controlled bench protocols. It is not offered as a drug, food, cosmetic, dietary supplement, or veterinary product.",
          "Elevate Precision Health does not claim that these products diagnose, treat, cure, or prevent any disease. The FDA has not evaluated them for therapeutic use. Nothing on this site is instructions for human or animal administration — these products are not for human or veterinary use.",
        ],
      },
      {
        heading: "Who should purchase",
        paragraphs: [
          "Purchasers should be researchers, laboratories, or institutions that understand applicable law for their jurisdiction and that have the facilities and procedures to handle lyophilized research materials safely. Age verification on this site (21+) is an access control for the storefront; it does not replace institutional compliance requirements.",
          "If your use case is clinical care, compounding for patients, or consumer wellness, this catalog is the wrong channel. Contact your licensed medical or regulatory pathway instead.",
        ],
      },
      {
        heading: "How RUO relates to FDA framing",
        paragraphs: [
          "FDA guidance for in vitro diagnostic products labeled “For Research Use Only” explains that RUO labeling is meant for products in the laboratory research phase — not for clinical diagnostic use on patient samples without appropriate clearance or approval. While that guidance addresses IVDs specifically, the same honesty principle applies to research chemicals and peptides sold under RUO: the label must match the intended laboratory context.",
          "We keep RUO language visible on product pages, in the site footer, and in the terms of sale so buyers are not left guessing. Assay files and certificates speak to identity and purity for research lots — they are not marketing claims of clinical fitness.",
        ],
      },
      {
        heading: "Practical implications for your protocol",
        paragraphs: [
          "Plan storage, reconstitution, and disposal under your institution’s SOPs. Document lot numbers and certificates with the study file. Do not redistribute research materials into channels that imply human use. If you need multi-lot planning or institutional purchasing terms, email support with quantities and timelines.",
        ],
      },
    ],
    citations: [
      {
        label:
          "FDA guidance: Distribution of In Vitro Diagnostic Products Labeled for Research Use Only",
        href: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/distribution-vitro-diagnostic-products-labeled-research-use-only-or-investigational-use-only",
      },
      {
        label: "FDA: Overview of IVD regulation",
        href: "https://www.fda.gov/medical-devices/ivd-regulatory-assistance/overview-ivd-regulation",
      },
    ],
  },
  {
    slug: "identity-and-purity",
    title: "How we verify identity and purity",
    navLabel: "Identity and purity",
    description:
      "How Elevate Precision Health approaches compound identity, lot purity documentation, third-party certificates of analysis, and what buyers should check before filing paperwork with a protocol.",
    eyebrow: "Documentation",
    headline: "How we verify identity and purity",
    lede: "Buyers in this niche should be able to answer two questions for every vial: is this the labeled compound, and how pure is this lot? Our process is built around those questions — not around ornamental trust badges.",
    sections: [
      {
        heading: "Identity first",
        paragraphs: [
          "Identity confirmation asks whether the material matches the labeled research compound — typically through orthogonal analytical methods such as infrared spectroscopy, chromatography retention behavior, and/or mass spectrometry, depending on what the certificate for that lot reports. We do not invent method names for marketing; published certificates list the methods actually used.",
          "Catalog pages carry molecular formula, molecular weight, sequence, or composition when those fields apply. Those reference attributes help researchers cross-check PubChem or literature identity, but the lot certificate remains the authoritative file for the material you receive.",
        ],
      },
      {
        heading: "Purity next",
        paragraphs: [
          "Purity figures on a certificate of analysis (COA) describe that lot under the stated methods — often chromatographic area percent for peptides. A high purity number is useful for assay design; it is not a warranty of biological activity in your specific model. Always read the COA note for the vial size and lot covered by the PDF.",
          "When a certificate is published, we surface purity and named methods on the product page and keep the PDF downloadable from the certificates page. Lots without a published file can still be requested by email with the compound and lot reference.",
        ],
      },
      {
        heading: "Partners and continuity",
        paragraphs: [
          "Manufacturing and analytical support is coordinated with named partners. Third-party or partner lab names appear on certificates when they issued the report. Lot continuity matters for multi-timepoint studies: reorders should be compared against the prior COA rather than assumed identical.",
          "If your protocol requires a specific purity floor, test method, or endotoxin specification beyond what a published COA shows, write us before ordering so we can confirm whether that lot documentation exists.",
        ],
      },
      {
        heading: "What to file with your protocol",
        paragraphs: [
          "Download or request the COA, record the lot number on the vial and in the notebook, and keep the PDF with the study records. That habit is how laboratories defend identity claims months later — not screenshots of a product page alone.",
        ],
      },
    ],
    citations: [
      {
        label: "NIST: Analytical chemistry overview",
        href: "https://www.nist.gov/topics/chemistry",
      },
      {
        label: "PubChem compound database",
        href: "https://pubchem.ncbi.nlm.nih.gov/",
      },
      {
        label: "Elevate Precision Health — Certificates of Analysis",
        href: "https://www.elevateprecisionhealth.com/coa",
      },
    ],
  },
  {
    slug: "reconstitution-and-storage",
    title: "Reconstitution and storage best practices",
    navLabel: "Reconstitution and storage",
    description:
      "Laboratory best practices for storing lyophilized research peptides and reconstituting them on the bench — cold chain, diluent choice, aliquoting, and light protection.",
    eyebrow: "Handling",
    headline: "Reconstitution and storage for lyophilized research peptides",
    lede: "Most of our peptides ship as lyophilized powders. How you store the closed vial and how you reconstitute it on the bench has more effect on day-to-day assay consistency than almost any other handling step.",
    sections: [
      {
        heading: "Storing lyophilized material",
        paragraphs: [
          "Keep unopened lyophilized vials cold, dry, and protected from light. A common research-bench practice is −20 °C storage for lyophilized peptides, with tighter control (−80 °C) when a protocol or certificate specifies it. Avoid repeated warm–cold cycling of the stock vial; condensation introduces moisture that accelerates degradation.",
          "After opening, reseal promptly. Label the open date. Do not assume a powder that has sat warm on a bench for hours is still equivalent to a freshly received cold vial — document deviations when they happen.",
        ],
      },
      {
        heading: "Choosing a diluent",
        paragraphs: [
          "Reconstitution diluent should match the protocol: sterile water, bacteriostatic water (water with a preservative such as benzyl alcohol), dilute acetic acid, or another solvent specified by the method. Bacteriostatic water can help multi-use reconstituted stocks when the preservative is compatible with the assay; switch to preservative-free sterile water when the readout is known to be sensitive to benzyl alcohol.",
          "Calculate volume from the vial’s labeled mass and the target stock concentration before you puncture the stopper. Add diluent slowly, allow the cake to wet, and swirl gently — aggressive foaming can denature some sequences and make concentration less reproducible.",
        ],
      },
      {
        heading: "After reconstitution",
        paragraphs: [
          "Once reconstituted, store solutions at 2–8°C unless a product certificate or protocol specifies otherwise. Portion working aliquots so the main stock is not opened for every plate, and protect aromatic-rich peptides from strong light during open-bench work.",
          "Record solvent, concentration, aliquot date, and lot number in the notebook so later anomalies can be traced. Follow your institution’s discard timeline for reconstituted research stocks.",
        ],
      },
      {
        heading: "What this page is not",
        paragraphs: [
          "This is laboratory handling guidance for research materials — not dosing instructions for humans or animals. Follow your institution’s chemical hygiene plan, PPE rules, and waste disposal procedures. For product-specific storage lines, see each product’s research details table; for diluent supply, see bacteriostatic water in the catalog.",
        ],
      },
    ],
    citations: [
      {
        label: "PubChem CID 244 (benzyl alcohol)",
        href: "https://pubchem.ncbi.nlm.nih.gov/compound/244",
      },
      {
        label: "CDC / NIOSH: Laboratory safety resources",
        href: "https://www.cdc.gov/niosh/topics/labsafety/",
      },
      {
        label: "PubChem compound database",
        href: "https://pubchem.ncbi.nlm.nih.gov/",
      },
    ],
  },
];
