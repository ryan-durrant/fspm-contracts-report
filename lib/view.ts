import type { PropertySnapshot, TeamConfig, TeamsConfig } from "./types";

export function propertyMap(config: TeamsConfig) {
  return new Map(config.properties.map((property) => [property.id, property]));
}

export function teamTotals(
  ids: string[],
  snaps: Record<string, { filled: number; capacity: number } | undefined>,
) {
  return ids.reduce(
    (totals, id) => {
      const snap = snaps[id];
      if (!snap) return totals;
      totals.filled += snap.filled;
      totals.capacity += snap.capacity;
      return totals;
    },
    { filled: 0, capacity: 0 },
  );
}

export function propertiesInOrder(config: TeamsConfig) {
  const byId = propertyMap(config);
  return config.teams.flatMap((team) =>
    team.propertyIds.flatMap((id) => {
      const property = byId.get(id);
      return property ? [{ team, property }] : [];
    }),
  );
}

export function snapshot(
  properties: Record<string, PropertySnapshot>,
  id: string,
  fallbackCapacity: number,
): PropertySnapshot {
  return (
    properties[id] ?? {
      filled: 0,
      capacity: fallbackCapacity,
      unapproved: 0,
      inactive: 0,
      lastYear: null,
    }
  );
}

export function navSections(config: TeamsConfig, hasNext: boolean, nextLabel: string) {
  return [
    { id: "cover", label: "Cover" },
    { id: "contracts", label: "Contracts" },
    { id: "comparison", label: "Last Year" },
    { id: "highlights", label: "Highlights" },
    { id: "goals", label: "Goals" },
    ...(hasNext ? [{ id: "next", label: nextLabel }] : []),
    { id: "community", label: "Community" },
  ];
}

export type { TeamConfig };
