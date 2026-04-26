/**
 * Demo data helpers for "Add" forms in manual CRUD pages.
 *
 * Each helper returns a plausible payload so testers can click
 * "+ New ..." and immediately Save without typing anything.
 *
 * Values rotate via a process-level counter so consecutive clicks
 * produce different but realistic samples.
 */

let _counter = 0;

const pick = <T,>(arr: readonly T[]): T => arr[_counter % arr.length];

const todayPlus = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const PROJECT_SAMPLES = [
  {
    name: "Algae biofuel pilot",
    description:
      "Test microalgae strains for high-yield lipid extraction in 5L bioreactors.",
    status: "ongoing" as const,
    priority: 7,
    tag: "Biotech",
  },
  {
    name: "Soil microbiome survey",
    description:
      "Sequence rhizosphere samples across three field plots to map microbial diversity.",
    status: "planned" as const,
    priority: 5,
    tag: "Ecology",
  },
  {
    name: "PCR primer optimization",
    description:
      "Re-tune primer melting temperatures for the new low-yield maize cultivar.",
    status: "ongoing" as const,
    priority: 6,
    tag: "Genetics",
  },
  {
    name: "Spectrophotometer calibration",
    description:
      "Run quarterly cross-check against NIST reference standards.",
    status: "planned" as const,
    priority: 3,
    tag: "QA",
  },
];

const INVENTORY_SAMPLES = [
  {
    name: "Ethanol absolute (500 mL)",
    category: "reagent",
    quantity: 12,
    unit: "bottle",
    min_required: 4,
  },
  {
    name: "PCR plates 96-well",
    category: "consumables",
    quantity: 80,
    unit: "plate",
    min_required: 20,
  },
  {
    name: "Pipette tips 1000 µL",
    category: "consumables",
    quantity: 6,
    unit: "rack",
    min_required: 8,
  },
  {
    name: "Nitrile gloves M",
    category: "safety",
    quantity: 25,
    unit: "box",
    min_required: 10,
  },
];

const EXPERIMENT_SAMPLES = [
  {
    result: "Strain A reached 18.4% lipid content under stress conditions.",
    success: "true" as const,
    notes: "Continue with 5L scale-up next week; check nitrogen depletion timing.",
  },
  {
    result: "Primer pair P3 produced non-specific bands at 56°C.",
    success: "false" as const,
    notes: "Re-design with longer GC clamp; consider touchdown PCR.",
  },
  {
    result: "Soil DNA extraction yield averaged 38 ng/µL across 12 samples.",
    success: "true" as const,
    notes: "Acceptable for amplicon sequencing; archive remaining pellet.",
  },
  {
    result: "Calibration drift exceeded ±2% threshold.",
    success: "false" as const,
    notes: "Lamp likely aging; schedule replacement and re-run after.",
  },
];

const USER_SAMPLES = [
  {
    email: "ada.lovelace@sandy.lab",
    full_name: "Ada Lovelace",
    role: "researcher",
    password: "Demo!Pass-2026",
  },
  {
    email: "rosalind.franklin@sandy.lab",
    full_name: "Rosalind Franklin",
    role: "researcher",
    password: "Demo!Pass-2026",
  },
  {
    email: "stock.keeper@sandy.lab",
    full_name: "Stock Keeper",
    role: "inventory",
    password: "Demo!Pass-2026",
  },
  {
    email: "viewer.guest@sandy.lab",
    full_name: "Viewer Guest",
    role: "viewer",
    password: "Demo!Pass-2026",
  },
];

export type DemoProject = {
  name: string;
  description: string;
  status: "planned" | "ongoing" | "completed";
  priority: number;
  start_date: string;
  end_date: string;
  deadline: string;
};

export function nextDemoProject(): DemoProject {
  _counter += 1;
  const s = pick(PROJECT_SAMPLES);
  return {
    name: s.name,
    description: s.description,
    status: s.status,
    priority: s.priority,
    start_date: todayPlus(0),
    end_date: todayPlus(45),
    deadline: todayPlus(30),
  };
}

export type DemoInventory = {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_required: number;
};

export function nextDemoInventory(): DemoInventory {
  _counter += 1;
  const s = pick(INVENTORY_SAMPLES);
  return { ...s };
}

export type DemoExperiment = {
  result: string;
  success: "" | "true" | "false";
  notes: string;
  project_id: number | "";
};

export function nextDemoExperiment(projectId?: number | null): DemoExperiment {
  _counter += 1;
  const s = pick(EXPERIMENT_SAMPLES);
  return {
    result: s.result,
    success: s.success,
    notes: s.notes,
    project_id: projectId ?? "",
  };
}

export type DemoUser = {
  email: string;
  full_name: string;
  role: string;
  password: string;
};

export function nextDemoUser(): DemoUser {
  _counter += 1;
  const s = pick(USER_SAMPLES);
  return { ...s };
}
