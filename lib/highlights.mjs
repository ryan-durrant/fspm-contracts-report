import fs from "node:fs";
import path from "node:path";

const PAGE_ALIASES = {
  w27: "w27",
  winter: "w27",
  contracts: "w27",
  s27: "s27",
  spring: "s27",
  next: "s27",
  highlights: "highlights",
  community: "community",
  comparison: "comparison",
  "last-year": "comparison",
  goals: "goals",
  cover: "cover",
};

const COLORS = new Set(["red", "yellow", "green"]);
const CARD_FIELDS = new Set(["unapproved", "inactive", "filled", "percent"]);
const CALLOUT_NAMES = new Set(["total", "bnh", "market", "women", "men", "last-bnh", "last-market"]);

const CARD_FIELDS_BY_PAGE = {
  w27: ["unapproved", "inactive", "filled", "percent"],
  s27: ["filled", "percent"],
  community: ["filled", "percent"],
  comparison: ["percent"],
};

const CALLOUTS_BY_PAGE = {
  w27: ["total", "bnh", "market", "women", "men"],
  s27: ["total", "bnh", "market"],
  highlights: ["market", "women", "men"],
  comparison: ["bnh", "market", "last-bnh", "last-market"],
  goals: ["bnh"],
};

function propertyIds(page, teams) {
  if (page === "community") {
    return (teams.offices ?? []).flatMap((office) => office.properties.map((property) => property.id));
  }
  return (teams.properties ?? []).map((property) => property.id);
}

function officeIds(teams) {
  return (teams.offices ?? []).map((office) => office.id);
}

export function loadHighlights(reportDate, root = process.cwd()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate ?? "")) return [];
  const file = path.join(root, "highlights", `${reportDate}.json`);
  if (!fs.existsSync(file)) return [];
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.rings)) return json.rings;
  return [];
}

function describe(entry) {
  const page = entry?.page ?? "(no page)";
  const property = entry?.property ?? entry?.office ?? entry?.callout ?? "";
  const field = entry?.field ?? "(no field)";
  return [page, property, field].filter(Boolean).join(" ");
}

/**
 * Turn a week's highlight file into ring ids.
 * Unknown pages, properties, and fields are logged and skipped.
 * @param {object[]} entries
 * @param {{ teams: object, hasNext?: boolean, log?: (message: string) => void }} [options]
 */
export function resolveHighlights(entries, options = {}) {
  const { teams, hasNext = true, log = console.warn } = options;
  const rings = [];
  const warnings = [];
  const warn = (message) => {
    warnings.push(message);
    log(`highlight: ${message}`);
  };

  for (const entry of entries ?? []) {
    if (!entry || typeof entry !== "object") {
      warn("skipped an entry that is not an object");
      continue;
    }
    const color = entry.color;
    if (!COLORS.has(color)) {
      warn(`unknown color "${color ?? ""}" on ${describe(entry)}`);
      continue;
    }
    const rawPage = entry.page == null || entry.page === "" ? null : String(entry.page).toLowerCase();
    const page = rawPage == null ? null : PAGE_ALIASES[rawPage];
    if (rawPage && !page) {
      warn(`unknown page "${entry.page}" on ${describe(entry)}`);
      continue;
    }
    if (page === "s27" && !hasNext) {
      warn(`no next semester to mark for ${describe(entry)}`);
      continue;
    }

    if (entry.applyToAll) {
      if (!CARD_FIELDS.has(entry.field)) {
        warn(`applyToAll only rings card fields, not "${entry.field ?? ""}"`);
        continue;
      }
      const pages = page ? [page] : Object.keys(CARD_FIELDS_BY_PAGE);
      let added = 0;
      for (const candidate of pages) {
        if (candidate === "s27" && !hasNext) continue;
        if (!CARD_FIELDS_BY_PAGE[candidate]?.includes(entry.field)) continue;
        for (const id of propertyIds(candidate, teams)) {
          rings.push({
            id: `${candidate}:card:${id}:${entry.field}`,
            color,
            label: entry.label || "",
          });
          added += 1;
        }
      }
      if (!added) warn(`applyToAll matched no cards for ${describe(entry)}`);
      continue;
    }

    if (entry.field === "callout" || (entry.field === "total" && !entry.property && !entry.office)) {
      const name = entry.field === "total" ? "total" : entry.callout;
      if (!page) {
        warn(`callout needs a page on ${describe(entry)}`);
        continue;
      }
      if (!CALLOUT_NAMES.has(name) || !CALLOUTS_BY_PAGE[page]?.includes(name)) {
        warn(`unknown callout "${name ?? ""}" on ${describe(entry)}`);
        continue;
      }
      rings.push({ id: `${page}:callout:${name}`, color, label: entry.label || "" });
      continue;
    }

    if (entry.field === "total" && entry.office) {
      if ((page ?? "community") !== "community") {
        warn(`office totals are on the community page, not ${page}`);
        continue;
      }
      if (!officeIds(teams).includes(entry.office)) {
        warn(`unknown community office "${entry.office}"`);
        continue;
      }
      rings.push({
        id: `community:office:${entry.office}:total`,
        color,
        label: entry.label || "",
      });
      continue;
    }

    if (!CARD_FIELDS.has(entry.field)) {
      warn(`unknown field "${entry.field ?? ""}" on ${describe(entry)}`);
      continue;
    }
    if (!page) {
      warn(`card highlight needs a page on ${describe(entry)}`);
      continue;
    }
    if (!CARD_FIELDS_BY_PAGE[page]?.includes(entry.field)) {
      warn(`${page} has no ${entry.field} number (${describe(entry)})`);
      continue;
    }
    if (!entry.property || !propertyIds(page, teams).includes(entry.property)) {
      warn(`unknown property "${entry.property ?? ""}" on ${describe(entry)}`);
      continue;
    }
    rings.push({
      id: `${page}:card:${entry.property}:${entry.field}`,
      color,
      label: entry.label || "",
    });
  }

  return { rings, warnings };
}

export function ringsFor(rings, id) {
  return (rings ?? []).filter((ring) => ring.id === id);
}
