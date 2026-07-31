export const site = {
  name: "Elevate Precision Health",
  shortName: "Elevate",
  tagline: "Assay-backed products for disciplined laboratory work.",
  description:
    "Elevate Precision Health provides research-only peptides and lab supplies with clear documentation, careful handling, and straightforward support.",
  email: "support@elevateprecisionhealth.com",
  shippingNote: "Orders $150 and up ship at no charge",
  ageMinimum: 21,
} as const;

export const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/coa", label: "Certificates" },
  { href: "/contact", label: "Contact" },
] as const;

export const faqs = [
  {
    question: "Are these products for human use?",
    answer:
      "No. Everything we sell is for laboratory research only — not for human or veterinary use, diagnosis, treatment, or consumption. See our Research use only resource for the full framing.",
  },
  {
    question: "Can I share lab feedback for the site?",
    answer:
      "Yes. Email a short note about ordering, documentation, or support for your research protocol. We only publish manually vetted notes — never invented reviews — and we can attribute by institution type if you prefer not to use a personal name.",
  },
  {
    question: "How quickly do packages leave?",
    answer:
      "Weekday orders that clear before afternoon cutoff typically leave the same day. Friday late and weekend orders move on the next business morning.",
  },
  {
    question: "Do you send carrier updates?",
    answer:
      "Once a label is created and the parcel is scanned, you get an email with the tracking number.",
  },
  {
    question: "Can I request assay paperwork?",
    answer:
      "Yes. Many product pages include a downloadable certificate when one is on file. For lots not listed yet, email the compound and lot and we will share what we have. Our Identity and purity resource explains what to file with a protocol.",
  },
  {
    question: "Is volume pricing available?",
    answer:
      "Institutional and multi-lot requests are welcome. Email quantities and preferred SKUs and we will outline options.",
  },
  {
    question: "What happens if a parcel is delayed or damaged?",
    answer:
      "Write us with the order reference. We coordinate with the carrier and resolve eligible issues without runaround.",
  },
] as const;

export const operatingNotes = [
  {
    step: "01",
    title: "Source with intent",
    body: "We stock compounds that labs actually request — not a bloated shelf of lookalikes.",
  },
  {
    step: "02",
    title: "Document the lot",
    body: "Identity and purity paperwork stays with the lot — published certificates sit on the product page; anything not listed yet is available on request through our partners.",
  },
  {
    step: "03",
    title: "Ship like it matters",
    body: "Packed for research timelines, with clear status updates once the parcel is moving.",
  },
] as const;

export const researchDisclaimer = `Elevate Precision Health sells products strictly for laboratory research. Nothing on this site is offered for human or animal use, diagnosis, treatment, or consumption. These products are not drugs, foods, cosmetics, or supplements, and the FDA has not evaluated them for any therapeutic claim. Only qualified researchers and institutions acting within applicable law should purchase or handle these products.`;
