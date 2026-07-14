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
  { href: "/about", label: "Approach" },
  { href: "/coa", label: "Assays" },
  { href: "/contact", label: "Reach out" },
] as const;

export const faqs = [
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
      "Yes. Ask for the lot you received (or want to reserve) and we will share available certificates.",
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
    body: "Identity and purity paperwork stay attached to each product, not buried in a generic FAQ.",
  },
  {
    step: "03",
    title: "Ship like it matters",
    body: "Packed for research timelines, with clear status updates once the parcel is moving.",
  },
] as const;

export const researchDisclaimer = `Elevate Precision Health sells products strictly for laboratory research. Nothing on this site is offered for human or animal use, diagnosis, treatment, or consumption. These products are not drugs, foods, cosmetics, or supplements, and the FDA has not evaluated them for any therapeutic claim. Only qualified researchers and institutions acting within applicable law should purchase or handle these products.`;
