import type { Project, SiteSettings } from "./types";

// Supabase na thakle (ba DB faka thakle) site ei default content diye cholbe.
// Real content admin panel theke edit koro.
export const DEFAULT_SETTINGS: SiteSettings = {
  brand: "NexEris",
  parentBody:
    "NexEris is the studio behind everything I build — software, products and the brands that carry them.",
  subBrands: [
    {
      name: "NexApp",
      body: "The apps label of NexEris — Android and desktop apps, tools and web products people use every day.",
      url: "https://nexappog.vercel.app",
    },
  ],
  name: "Arabi Islam",
  alias: "MR. ARX",
  role: "Android & Desktop App Developer",
  tagline:
    "I build fast, clean apps for Android and desktop — from idea to a shipped release, all on my own.",
  about: [
    "I build under NexEris, and ship apps under its NexApp brand. I design, code and release my own products — native Android with Kotlin and Jetpack Compose, desktop with Electron and Tauri.",
    "I like tools that feel instant and stay out of the way: music, downloaders, password vaults and web apps that people actually use every day.",
  ],
  email: "hello@example.com",
  socials: [
    { label: "GitHub", url: "https://github.com/nexappog" },
    { label: "NexApp Store", url: "https://nexappog.vercel.app" },
  ],
  skills: [
    {
      title: "Android",
      body: "Native apps with Kotlin and Jetpack Compose — smooth UI, offline-first, built to be published.",
      tags: ["Kotlin", "Jetpack Compose", "Material 3"],
    },
    {
      title: "Desktop",
      body: "Cross-platform desktop apps that feel native, from Electron wrappers to lean Tauri/Rust builds.",
      tags: ["Electron", "Tauri", "Rust", "Flutter"],
    },
    {
      title: "Web & Backend",
      body: "Web apps and APIs with Next.js, Supabase and Node — deployed, monitored and kept cheap.",
      tags: ["Next.js", "Supabase", "Node.js", "TypeScript"],
    },
  ],
  timeline: [
    { when: "Now", title: "NexEris — NexApp", body: "Building and maintaining a growing line of apps under the NexApp brand." },
    { when: "Before", title: "Independent developer", body: "Forked, customized and shipped open-source and original tools." },
  ],
  character: {
    image: "/character/source.jpg",
    depth: "/character/depth.png",
    depthStrength: 0.55,
    cutout: 0.42,
    brightness: 1.6,
    model: "/character/model.glb",
    modelScale: 1,
    modelRotation: -55,
    modelY: 0,
    modelLight: 1,
  },
  favicon: null,
};

export const DEFAULT_PROJECTS: Project[] = [
  { id: "d1", title: "NexMusic", description: "Android music player with a clean Compose UI.", tech: ["Kotlin", "Compose"], live_url: null, repo_url: null, image_url: null, featured: true, sort: 1 },
  { id: "d2", title: "NexGrab", description: "YouTube downloader for desktop and Android.", tech: ["Electron", "Kotlin"], live_url: null, repo_url: null, image_url: null, featured: true, sort: 2 },
  { id: "d3", title: "NexPass", description: "Desktop credential manager — a local password vault.", tech: ["Tauri", "Rust"], live_url: null, repo_url: null, image_url: null, featured: true, sort: 3 },
  { id: "d4", title: "NexSync", description: "Synced music listening rooms on the web.", tech: ["Web", "Realtime"], live_url: null, repo_url: null, image_url: null, featured: true, sort: 4 },
  { id: "d5", title: "NextCart", description: "E-commerce app for Android and desktop.", tech: ["Odoo", "Android"], live_url: null, repo_url: null, image_url: null, featured: false, sort: 5 },
  { id: "d6", title: "NexAuras", description: "Desktop app wrapping an Odoo storefront.", tech: ["Electron", "Odoo"], live_url: null, repo_url: null, image_url: null, featured: false, sort: 6 },
];
