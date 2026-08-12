export type ResearchCitation = {
  label: string;
  href: string;
};

export type ResearchSection = {
  heading: string;
  paragraphs: string[];
};

export type ProductResearchContext = {
  /** Up to three short, scannable research-interest bullets for the product page. */
  interestPoints: string[];
  sections: ResearchSection[];
  citations: ResearchCitation[];
};

export function researchWordCount(research: ProductResearchContext): number {
  const text = research.sections
    .flatMap((section) => [section.heading, ...section.paragraphs])
    .join(" ");
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function getProductResearch(
  slug: string,
): ProductResearchContext | undefined {
  return productResearchBySlug[slug];
}

/**
 * Unique research-context blocks for product detail pages (Phase 3 #1).
 * Placed below purchase + specs. RUO framing only — no therapeutic claims.
 */
export const productResearchBySlug: Record<string, ProductResearchContext> = {
  "glp-3": {
    interestPoints: [
      "Researchers are studying simultaneous activity at GIP, GLP-1 and glucagon receptors.",
      "Common research areas include reporter assays and comparative agonist pharmacology.",
      "Of interest in studies that place single-, dual- and triple-agonist signaling side by side.",
    ],
    sections: [
      {
        heading: "What is GLP-3 (retatrutide) in research?",
        paragraphs: [
          "GLP-3 refers to retatrutide (LY3437943), a synthetic peptide ligand studied for simultaneous activity at the glucose-dependent insulinotropic polypeptide (GIP), glucagon-like peptide-1 (GLP-1), and glucagon receptors. In laboratory settings it is used as a multi-receptor tool compound so investigators can compare single-, dual-, and triple-agonist signaling side by side under controlled conditions.",
          "Identity references commonly cite CAS 2381089-83-2 and PubChem CID 171390338. Supplied material is intended strictly for qualified research workflows — not for human or veterinary use. Keep lot numbers linked to any potency or identity data you publish internally.",
        ],
      },
      {
        heading: "Typical laboratory applications",
        paragraphs: [
          "Common bench uses include engineered-cell reporter assays (for example CRE/SEAP readouts on cells expressing GLP-1R, GIPR, or GCGR), competitive binding and cAMP accumulation experiments, and comparative pharmacology versus selective incretin receptor agonists. Researchers also evaluate peptide stability, albumin-binding linker behavior, and reconstitution parameters for lyophilized stocks.",
          "When documenting methods, record solvent, vortex time, and aliquot temperature so multi-receptor potency data remain comparable across runs and operators.",
        ],
      },
    ],
    citations: [
      {
        label: "PubChem CID 171390338 (retatrutide)",
        href: "https://pubchem.ncbi.nlm.nih.gov/compound/171390338",
      },
      {
        label: "CAS 2381089-83-2 (PubChem)",
        href: "https://pubchem.ncbi.nlm.nih.gov/#query=2381089-83-2",
      },
    ],
  },

  "glp-2": {
    interestPoints: [
      "Researchers are studying dual agonist activity at GIP and GLP-1 receptors.",
      "Common research areas include dual-receptor functional assays and potency comparisons.",
      "Of interest in studies involving second-messenger panels such as cAMP readouts.",
    ],
    sections: [
      {
        heading: "What is GLP-2 (tirzepatide) in research?",
        paragraphs: [
          "GLP-2 in this catalog refers to tirzepatide (LY3298176), a 39-amino-acid peptide conjugate studied as a dual agonist at GIP and GLP-1 receptors. The sequence is derived primarily from native GIP with modifications that support GLP-1 receptor engagement, making it a standard dual-incretin reference ligand for receptor pharmacology work on the research bench.",
          "Public identity anchors include CAS 2023788-19-2 and PubChem CID 156588324. Material is supplied for laboratory research only. Retain COA lot identifiers whenever dual-receptor EC50 or binding datasets are archived.",
        ],
      },
      {
        heading: "Typical laboratory applications",
        paragraphs: [
          "Investigators use tirzepatide-class peptides in dual-receptor functional assays, bias and potency comparisons against mono-agonists, and downstream second-messenger panels such as cAMP and β-arrestin recruitment. It also appears in peptide-handling studies that examine fatty-diacid conjugation effects on solubility, plastic adsorption, and storage of lyophilized research stocks.",
          "Parallel plates with vehicle and reference mono-agonists help separate dual-receptor pharmacology from assay drift or cell-passage effects.",
        ],
      },
    ],
    citations: [
      {
        label: "PubChem CID 156588324 (tirzepatide)",
        href: "https://pubchem.ncbi.nlm.nih.gov/compound/156588324",
      },
      {
        label: "CAS 2023788-19-2 (PubChem)",
        href: "https://pubchem.ncbi.nlm.nih.gov/#query=2023788-19-2",
      },
    ],
  },

  "mots-c": {
    interestPoints: [
      "Researchers are studying MOTS-c for mitochondrial signaling and metabolic stress pathways.",
      "Common research areas include cellular energy markers and stress-response assays.",
      "Of interest in studies involving mitochondrial-derived peptide identity and handling.",
    ],
    sections: [
      {
        heading: "What is MOTS-c in research?",
        paragraphs: [
          "MOTS-c (mitochondrial open reading frame of the 12S rRNA type-c) is a 16-amino-acid peptide encoded in the mitochondrial genome (sequence MRWQEMGYIFYPRK). It is studied as a mitochondrial-derived peptide (MDP) that can enter nuclear and cytoplasmic pathways involved in metabolic stress responses in cellular laboratory models.",
          "Reference records include PubChem CID 146675088 and the molecular formula C101H152N28O22S2. Elevate Precision Health supplies MOTS-c strictly for research use. Link each aliquot to its lot so oxidation or purity shifts can be traced later.",
        ],
      },
      {
        heading: "Typical laboratory applications",
        paragraphs: [
          "Bench protocols often examine AMPK-related pathway markers, mitochondrial respiration or glycolytic flux readouts, and cellular stress assays after controlled peptide exposure. MOTS-c is also used in peptide identity and purity method development (HPLC/LC-MS) because mitochondrial peptides can present distinct solubility and oxidation behaviors versus many nuclear-encoded sequences.",
          "Protect aliquots from repeated freeze–thaw cycles; methionine- and aromatic-rich mitochondrial peptides can oxidize under careless bench handling.",
        ],
      },
    ],
    citations: [
      {
        label: "PubChem CID 146675088 (MOTS-c)",
        href: "https://pubchem.ncbi.nlm.nih.gov/compound/146675088",
      },
    ],
  },

  tesamorelin: {
    interestPoints: [
      "Researchers are studying this GHRH analog for growth hormone-releasing hormone receptor signaling.",
      "Common research areas include GHRHR binding assays and comparative analog work.",
      "Of interest in studies involving long peptide handling and reconstitution on the bench.",
    ],
    sections: [
      {
        heading: "What is tesamorelin in research?",
        paragraphs: [
          "Tesamorelin (TH9507) is a synthetic analog of growth hormone-releasing hormone (GHRH). Structurally it incorporates an N-terminal hexenoyl modification that improves enzymatic stability relative to native GHRH, which is why it is widely used as a GHRH-receptor (GHRHR) research ligand in controlled laboratory settings.",
          "Identity is commonly indexed under CAS 218949-48-5 and PubChem CID 16137828. This SKU is for controlled laboratory work only. Record fill mass and reconstitution volume before calculating nominal molarity for binding curves, and keep cold-chain notes with each opened vial.",
        ],
      },
      {
        heading: "Typical laboratory applications",
        paragraphs: [
          "Researchers employ tesamorelin in GHRHR binding and signaling assays, pituitary-lineage or recombinant receptor cell systems, and comparative studies against other GHRH analogs. Lyophilized stocks are also used to validate reconstitution, freeze–thaw tolerance, and plastic adsorption behavior for long GHRH-family peptides on the bench.",
          "Because GHRH analogs are relatively large, confirm vial integrity and cold-chain history whenever unexpected potency shifts appear in replicate runs on the research bench.",
        ],
      },
    ],
    citations: [
      {
        label: "PubChem CID 16137828 (tesamorelin)",
        href: "https://pubchem.ncbi.nlm.nih.gov/compound/16137828",
      },
      {
        label: "CAS 218949-48-5 (PubChem)",
        href: "https://pubchem.ncbi.nlm.nih.gov/#query=218949-48-5",
      },
    ],
  },

  "mt-2": {
    interestPoints: [
      "Researchers are studying Melanotan II for melanocortin receptor and pigment pathway models.",
      "Common research areas include receptor binding and cAMP reporter panels.",
      "Of interest in structure–activity comparisons with related cyclic melanocortin analogs.",
    ],
    sections: [
      {
        heading: "What is MT-2 (Melanotan II) in research?",
        paragraphs: [
          "MT-2 denotes Melanotan II, a cyclic lactam analog of α-melanocyte-stimulating hormone (α-MSH). It engages melanocortin receptors (notably MC1R and MC4R among others) and is used as a compact tool peptide for pigment-pathway and central melanocortin signaling studies in vitro under research protocols.",
          "PubChem indexes Melanotan II under CID 92432 (molecular formula C50H69N15O9). Material is research-use only. Store lyophilized powder dry and cold, note first-reconstitution date in the laboratory notebook, and discard cloudy or discolored solutions per institutional SOP.",
        ],
      },
      {
        heading: "Typical laboratory applications",
        paragraphs: [
          "Typical assays include melanocortin receptor radioligand or fluorescence binding, cAMP reporter panels on MC-receptor–expressing cells, and structure–activity comparisons versus linear α-MSH fragments or related cyclic analogs such as bremelanotide. The cyclic scaffold also serves reconstitution and peptide-stability case studies.",
          "Shield reconstituted solutions from strong light when possible; aromatic side chains in melanocortin peptides can contribute to photodegradation on the open laboratory bench.",
        ],
      },
    ],
    citations: [
      {
        label: "PubChem CID 92432 (Melanotan II)",
        href: "https://pubchem.ncbi.nlm.nih.gov/compound/92432",
      },
    ],
  },

  "pt-141": {
    interestPoints: [
      "Researchers are studying bremelanotide for melanocortin receptor signaling on the bench.",
      "Common research areas include MC3R/MC4R functional assays and near-analog comparisons.",
      "Of interest in studies that contrast free-acid versus amide-terminated cyclic scaffolds.",
    ],
    sections: [
      {
        heading: "What is PT-141 (bremelanotide) in research?",
        paragraphs: [
          "PT-141 refers to bremelanotide, a cyclic heptapeptide melanocortin receptor agonist closely related to Melanotan II but terminating as a free acid rather than a C-terminal amide. That structural difference is useful when laboratories need to compare MC-receptor potency, selectivity, and peptide handling across near-analog scaffolds on the research bench.",
          "Sequence shorthand is Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-OH. Supplied only for qualified research protocols. Keep amide-versus-acid identity clear whenever Melanotan II is run as a comparator standard, and archive chromatograms with each lot number used.",
        ],
      },
      {
        heading: "Typical laboratory applications",
        paragraphs: [
          "Common uses include MC3R/MC4R functional assays, side-by-side ranking versus Melanotan II, and analytical method checks (HPLC retention, MS identity) for cyclic melanocortin peptides. Investigators also document light and moisture sensitivity of lyophilized aliquots during storage validation on the research bench.",
          "Note the free-acid terminus when comparing mass spectra or chromatographic retention to amide-terminated Melanotan II reference standards in the same assay batch.",
        ],
      },
    ],
    citations: [
      {
        label: "PubChem compound search (bremelanotide)",
        href: "https://pubchem.ncbi.nlm.nih.gov/#query=bremelanotide",
      },
    ],
  },

  nad: {
    interestPoints: [
      "Researchers are studying NAD+ as a cofactor in cellular energy and redox pathways.",
      "Common research areas include dehydrogenase assays and NAD+-dependent enzyme systems.",
      "Of interest in studies involving defined NAD+/NADH pools in metabolic flux work.",
    ],
    sections: [
      {
        heading: "What is NAD+ in research?",
        paragraphs: [
          "NAD+ (nicotinamide adenine dinucleotide, oxidized form) is a ubiquitous redox cofactor central to cellular energy metabolism. In the laboratory it is used as a stoichiometric or catalytic reagent for dehydrogenase assays, sirtuin and PARP enzyme systems, and metabolic flux experiments that require a defined NAD+/NADH pool.",
          "Canonical references are CAS 53-84-9 and PubChem CID 5892 (formula C21H26N7O14P2). This product is for research bench use only. Protect dry stocks from moisture; hydrolysis products confound many enzyme-rate calculations.",
        ],
      },
      {
        heading: "Typical laboratory applications",
        paragraphs: [
          "Protocols span spectrophotometric or fluorometric NAD+/NADH cycling assays, enzyme kinetics for NAD+-dependent oxidoreductases, and reconstitution of lyophilized cofactor stocks into aqueous buffers. Researchers often pair NAD+ work with controlled cold storage and light protection because the dinucleotide is sensitive to hydrolysis and photoreduction under poor handling conditions.",
          "Prepare fresh working dilutions when possible; aged NAD+ solutions can accumulate hydrolysis products that shift blank baselines in plate-based assays.",
        ],
      },
    ],
    citations: [
      {
        label: "PubChem CID 5892 (NAD+)",
        href: "https://pubchem.ncbi.nlm.nih.gov/compound/5892",
      },
      {
        label: "CAS 53-84-9 (PubChem)",
        href: "https://pubchem.ncbi.nlm.nih.gov/#query=53-84-9",
      },
    ],
  },

  "wolverine-blend": {
    interestPoints: [
      "Research interest centers on preparing BPC-157 and TB-500 from one shared lyophilized stock.",
      "Common research areas include multi-marker panels and co-formulated handling studies.",
      "Of interest when protocols need coordinated sample prep rather than separate reconstitutions.",
    ],
    sections: [
      {
        heading: "What is Wolverine Blend in research?",
        paragraphs: [
          "Wolverine Blend combines BPC-157 and TB-500 (a thymosin β4–related research peptide) in a single lyophilized preparation so multi-marker study designs can prepare both components from one vial. Labs use the blend when the experimental plan calls for coordinated sample preparation rather than independent reconstitution of each peptide.",
          "Each constituent remains a research peptide; the blend does not create a new approved drug substance. For identity work, investigators typically verify both components by orthogonal HPLC/LC-MS methods before quantitative interpretation.",
        ],
      },
      {
        heading: "Typical laboratory applications",
        paragraphs: [
          "Applications include parallel marker panels, comparative handling studies (shared diluent, freeze–thaw of co-formulated stocks), and method development for resolving BPC-157 versus TB-500 peaks in one chromatogram. Always document lot-specific composition ratios from the accompanying analytical paperwork before interpreting quantitative assays.",
          "If a protocol later requires single-peptide controls, keep matched single-analyte stocks so blend results can be attributed component-wise in the laboratory notebook for each lot.",
        ],
      },
    ],
    citations: [
      {
        label: "PubChem search (BPC-157)",
        href: "https://pubchem.ncbi.nlm.nih.gov/#query=BPC-157",
      },
      {
        label: "PubChem search (thymosin beta-4 / TB-500)",
        href: "https://pubchem.ncbi.nlm.nih.gov/#query=thymosin%20beta-4",
      },
    ],
  },

  "glow-blend": {
    interestPoints: [
      "Research interest centers on BPC-157, GHK-Cu and TB-500 in one multi-peptide stock.",
      "Common research areas include multi-marker protocols and copper-complex analytical checks.",
      "Of interest when a single preparation must feed several pathway or marker readouts.",
    ],
    sections: [
      {
        heading: "What is GLOW Blend in research?",
        paragraphs: [
          "GLOW Blend co-packages BPC-157, GHK-Cu (glycyl-L-histidyl-L-lysine copper complex), and TB-500 for multi-peptide laboratory protocols. The copper-binding tripeptide adds a metal-chelate analytical dimension that is absent from two-peptide blends, which matters for method development and interference checks on the research bench.",
          "Material is research-use only. Confirm lot composition and copper-related assay notes on the certificate of analysis before running metal-sensitive detection methods or UV purity screens in shared analytical queues.",
        ],
      },
      {
        heading: "Typical laboratory applications",
        paragraphs: [
          "Teams use GLOW Blend when a single reconstitution step must feed several marker or pathway readouts, or when validating chromatographic separation of three peptide species plus copper speciation concerns. Storage studies often track both peptide integrity and copper-complex stability after reconstitution into aqueous diluents used on the research bench.",
          "Avoid unnecessary metal-contaminated glassware when copper-complex recovery is part of the analytical endpoint for the lot under study in ongoing laboratory research workflows.",
        ],
      },
    ],
    citations: [
      {
        label: "PubChem CID 378611 (GHK)",
        href: "https://pubchem.ncbi.nlm.nih.gov/compound/378611",
      },
      {
        label: "PubChem search (BPC-157)",
        href: "https://pubchem.ncbi.nlm.nih.gov/#query=BPC-157",
      },
    ],
  },

  "klow-blend": {
    interestPoints: [
      "Research interest centers on a four-peptide stock that adds KPV to the GLOW-style format.",
      "Common research areas include broader marker panels and multi-analyte method checks.",
      "Of interest in comparisons of three- versus four-peptide co-formulations on the bench.",
    ],
    sections: [
      {
        heading: "What is KLOW Blend in research?",
        paragraphs: [
          "KLOW Blend extends the GLOW-style multi-peptide format by adding KPV (Lys-Pro-Val), a short α-MSH–derived tripeptide fragment studied in inflammatory-marker and melanocortin-adjacent cellular models. The four-component mix (BPC-157, GHK-Cu, TB-500, and KPV) supports protocols that need one shared stock for broader marker panels.",
          "Because four analytes share a vial, identity confirmation should resolve each peptide (and copper where relevant) on lot documentation before quantitative work begins in the laboratory. Archive that paperwork with the study folder for later audit of shared stocks.",
        ],
      },
      {
        heading: "Typical laboratory applications",
        paragraphs: [
          "Typical use cases are multiplex assay preparation, chromatographic method robustness tests across short and mid-length peptides, and controlled comparisons of three- versus four-peptide co-formulations. Document reconstitution volume and aliquot strategy carefully so each component’s nominal concentration remains traceable across operators.",
          "Short tripeptides such as KPV can elute near the solvent front; tune gradients so the smallest component is not lost during HPLC method development on shared blend lots.",
        ],
      },
    ],
    citations: [
      {
        label: "PubChem search (KPV peptide)",
        href: "https://pubchem.ncbi.nlm.nih.gov/#query=Lys-Pro-Val",
      },
      {
        label: "PubChem CID 378611 (GHK)",
        href: "https://pubchem.ncbi.nlm.nih.gov/compound/378611",
      },
    ],
  },
};
