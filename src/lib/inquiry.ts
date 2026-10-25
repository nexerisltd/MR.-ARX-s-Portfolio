// Inquiry form er option gulo — client (form) ar server (api/inquiry.ts) duto jaygay ek-i list.
export const SERVICES = ["Android app", "Desktop app", "Web app / website", "Redesign / rebrand", "Something else"] as const;
export const BUDGETS = ["Under $500", "$500 – $2k", "$2k – $5k", "$5k+", "Not sure yet"] as const;
export const TIMELINES = ["As soon as possible", "Within a month", "1 – 3 months", "Flexible"] as const;
export const STATUSES = ["new", "contacted", "won", "lost"] as const;
