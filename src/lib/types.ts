export interface Social { label: string; url: string }
export interface Skill { title: string; body: string; tags: string[] }
export interface TimelineItem { when: string; title: string; body: string }

export interface CharacterCfg {
  image: string;
  depth: string;
  depthStrength: number; // how far the face/body pops out
  cutout: number; // 0..1 depth threshold that removes the background
  brightness: number;
  // Real 3D model (.glb). Faka string = photo-relief mode.
  model: string;
  modelScale: number;
  modelRotation: number; // degrees
  modelY: number;
  modelLight: number;
}

export interface FaviconFiles {
  ico: string;
  png16: string;
  png32: string;
  png48: string;
  apple180: string;
  png192: string;
  png512: string;
  maskable512: string;
  manifest: string;
}

export interface SubBrand { name: string; body: string; url: string }

export interface SiteSettings {
  brand: string; // parent brand (NexEris)
  parentBody: string;
  subBrands: SubBrand[]; // e.g. NexApp
  name: string;
  alias: string;
  role: string;
  tagline: string;
  about: string[];
  email: string;
  socials: Social[];
  skills: Skill[];
  timeline: TimelineItem[];
  character: CharacterCfg;
  favicon: FaviconFiles | null;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  live_url: string | null;
  repo_url: string | null;
  image_url: string | null;
  featured: boolean;
  sort: number;
}
