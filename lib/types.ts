export type MonthPoint = {
  label: string;
  value: number;
};

export type PropertySnapshot = {
  filled: number;
  capacity: number;
  unapproved?: number;
  inactive?: number;
  lastYear?: number | null;
};

export type Callouts = {
  totalContracts: number;
  bnh: number;
  women: number | null;
  men: number | null;
  market: number | null;
  decimals: number;
};

export type ReportData = {
  semester: string;
  reportDate: string;
  capacity: number;
  callouts: Callouts;
  monthlyContracts: MonthPoint[];
  properties: Record<string, PropertySnapshot>;
  lastYear: {
    bnh: number;
    market: number | null;
    decimals: number;
    monthlyContracts: MonthPoint[];
  } | null;
  highlights: {
    contractsSoldThisWeek: number;
    houses: { label: string; count: number };
    apartments: { label: string; count: number };
    marketCapacity: number;
    marketSold: number;
    women: number | null;
    men: number | null;
    market: number | null;
    decimals: number;
    monthlyMarketBeds: MonthPoint[];
  };
  goals: Record<string, { week: number; month: number }>;
  nextSemester: {
    semester: string;
    reportDate?: string;
    capacity: number;
    callouts: {
      totalContracts: number;
      bnh: number;
      market: number | null;
      decimals: number;
    };
    monthlyContracts: MonthPoint[];
    properties: Record<string, { filled: number; capacity: number }>;
  } | null;
  community: Record<string, number>;
  communityAsOf?: string;
  communityHousing?: CommunityHousingData | null;
  tip?: { intro: string; link: string; closing: string } | null;
};

export type CommunityCount = {
  filled: number;
  capacity: number;
};

export type CommunityHousingData = {
  asOf: string;
  properties: Record<string, CommunityCount>;
  offices: Record<string, CommunityCount & { name: string }>;
};

export type PropertyConfig = {
  id: string;
  name: string;
  capacity: number;
  category: "apt" | "house";
  aliases: string[];
};

export type TeamConfig = {
  id: string;
  name: string;
  headerColor: string;
  propertyIds: string[];
};

export type OfficeConfig = {
  id: string;
  name: string;
  headerColor: string;
  properties: { id: string; name: string; capacity: number }[];
};

export type TeamsConfig = {
  quote: { text: string; attribution: string };
  tip: { intro: string; link: string; closing: string };
  marketCapacity: number;
  goalsCopy: { paragraphs: string[]; bonus: string[] };
  communityNote: string;
  teams: TeamConfig[];
  properties: PropertyConfig[];
  offices: OfficeConfig[];
};
