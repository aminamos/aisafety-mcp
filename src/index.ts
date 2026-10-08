#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = "https://aisafety.com/api/v1";
const LICENSE_NOTE =
  "Data: AISafety.com, licensed CC-BY-4.0 — please credit AISafety.com when using this data.";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;
const MAX_STRING_LEN = 500;
const MAX_OUTPUT_CHARS = 12000;

const offsetField = z
  .number()
  .int()
  .min(0)
  .optional()
  .describe("Rows to skip before returning results (default 0).");
const limitField = z
   .number()
   .int()
   .min(1)
   .max(MAX_LIMIT)
   .optional()
   .describe(`Max rows to return (1-${MAX_LIMIT}, default ${DEFAULT_LIMIT}).`);

function strField(description: string) {
  return z.string().optional().describe(description);
}

function trimValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > MAX_STRING_LEN
      ? value.slice(0, MAX_STRING_LEN) + "…"
      : value;
  }
  if (Array.isArray(value)) return value.map(trimValue);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = trimValue(v);
    return out;
  }
  return value;
}

async function queryCollection(
  collection: string,
  params: Record<string, unknown>,
  offset: number,
  limit: number,
) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    qs.set(k, String(v));
  }
  const url = `${BASE_URL}/${collection}${qs.size ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`AISafety.com API error ${res.status} for ${url}`);
  }
  const body = (await res.json()) as {
    data?: unknown[];
    meta?: { count?: number; license?: string; attribution?: string };
  };
  const rows = Array.isArray(body.data) ? body.data : [];
  // The upstream API returns full collections (no server-side paging), so
  // paginate client-side. Filters + q were already applied upstream via the
  // query string, keeping pages stable.
  const total = body.meta?.count ?? rows.length;
  const page = rows.slice(offset, offset + limit).map((r) => trimValue(r));
  const hasMore = offset + page.length < total;
  let text = JSON.stringify(
    {
      count: total,
      offset,
      limit,
      hasMore,
      license: body.meta?.license ?? "CC-BY-4.0",
      attribution: body.meta?.attribution ?? "AISafety.com",
      results: page,
    },
    null,
    2,
  );
  if (text.length > MAX_OUTPUT_CHARS) {
    text =
      text.slice(0, MAX_OUTPUT_CHARS) +
      `\n…(truncated; ${total} total rows, offset ${offset}, showing ${page.length})`;
  }
  return {
    content: [{ type: "text" as const, text }],
  };
}

interface CollectionDef {
  tool: string;
  path: string;
  summary: string;
  filters: { name: string; label: string }[];
}

const COLLECTIONS: CollectionDef[] = [
  {
    tool: "search_communities",
    path: "communities",
    summary: "AI safety communities, groups, and meetups.",
    filters: ["platform", "type", "activityLevel", "focus", "size", "location"].map(
      (name) => ({ name, label: name }),
    ),
  },
  {
    tool: "search_organizations",
    path: "organizations",
    summary: "Organizations on the AI safety landscape map.",
    filters: ["category", "status", "scale"].map((name) => ({
      name,
      label: name,
    })),
  },
  {
    tool: "search_events",
    path: "events",
    summary: "Conferences, hackathons, meetups, and other AI safety events.",
    filters: ["type", "location", "host", "mode", "cost"].map((name) => ({
      name,
      label: name,
    })),
  },
  {
    tool: "search_training",
    path: "training",
    summary: "Fellowships, courses, and bootcamps in AI safety.",
    filters: [
      "type",
      "location",
      "mode",
      "focus",
      "entryBar",
      "stipend",
      "recurring",
    ].map((name) => ({ name, label: name })),
  },
  {
    tool: "search_jobs",
    path: "jobs",
    summary: "Open roles in AI safety.",
    filters: [
      "organization",
      "location",
      "roleType",
      "workLocation",
      "minimumExperience",
    ].map((name) => ({ name, label: name })),
  },
  {
    tool: "search_funding",
    path: "funding",
    summary: "Funders and grant programs for AI safety work.",
    filters: ["type", "recipientType", "acceptingApplications"].map((name) => ({
      name,
      label: name,
    })),
  },
  {
    tool: "search_courses",
    path: "courses",
    summary: "Self-study courses and learning materials.",
    filters: ["category", "courseType", "organizer"].map((name) => ({
      name,
      label: name,
    })),
  },
  {
    tool: "search_advisors",
    path: "advisors",
    summary: "People offering AI safety career and research advice.",
    filters: ["focus", "status"].map((name) => ({ name, label: name })),
  },
  {
    tool: "search_media_channels",
    path: "media-channels",
    summary: "Podcasts, newsletters, blogs, and video channels.",
    filters: [{ name: "type", label: "type" }],
  },
  {
    tool: "search_founder_resources",
    path: "founder-resources",
    summary: "Resources for founders of AI safety projects.",
    filters: [{ name: "type", label: "type" }],
  },
  {
    tool: "search_projects",
    path: "projects",
    summary: "Volunteer and collaboration opportunities.",
    filters: [{ name: "status", label: "status" }],
  },
];

const server = new McpServer({
  name: "aisafety-mcp",
  version: "1.0.0",
});

for (const col of COLLECTIONS) {
  const shape: Record<string, z.ZodTypeAny> = {
    q: strField("Free-text search across all fields."),
  };
  for (const f of col.filters) shape[f.name] = z.string().optional().describe(`Filter by ${f.label} (case-insensitive substring; comma-separate for OR).`);
  shape["offset"] = offsetField;
  shape["limit"] = limitField;

  server.registerTool(
    col.tool,
    {
      description: `${col.summary} Query https://aisafety.com/api/v1/${col.path}. ${LICENSE_NOTE}`,
      inputSchema: shape,
    },
    async (args: Record<string, unknown>) => {
      const { limit, offset, ...filters } = args;
      const n =
        typeof limit === "number" && Number.isFinite(limit)
          ? Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT)
          : DEFAULT_LIMIT;
      const off =
        typeof offset === "number" && Number.isFinite(offset)
          ? Math.max(Math.floor(offset), 0)
          : 0;
      try {
        return await queryCollection(col.path, filters, off, n);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error: ${msg}` }],
          isError: true,
        };
      }
    },
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
