export type MonthPoint = {
  label: string;
  value: number | null;
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
    marketSold?: number | null;
    marketCapacity?: number | null;
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
  tip?: { intro?: string; link?: string; closing?: string; paragraphs?: string[] } | null;
};

export type CommunityLeaseStart = {
  unit?: string;
  text: string;
};

export type CommunityCount = {
  filled: number;
  capacity: number;
  note?: string;
  leaseStarts?: CommunityLeaseStart[];
};

export type CommunityHousingData = {
  asOf: string;
  properties: Record<string, CommunityCount>;
  /** Sum of the community cards, including standing overrides such as Rock Casa 3/3. */
  total?: { filled: number; capacity: number };
  /** Older archives stored Avonlea Office and Haven Office rollups. New reports use total. */
  offices?: Record<string, CommunityCount & { name: string }>;
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

export type CommunityPropertyConfig = {
  id: string;
  name: string;
  capacity: number;
  color?: string;
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
  /** Display name on contracts pages. FSPM when omitted. */
  company?: string;
  /** Community cards forced on every build, after the email counts. */
  communityOverrides?: Record<string, { filled: number; capacity: number }>;
  marketCapacity: number;
  goalsCopy: { paragraphs: string[]; bonus: string[] };
  communityNote: string;
  teams: TeamConfig[];
  properties: PropertyConfig[];
  /** Shalynn's community cards. One list, one total. Not the student-housing teams. */
  communityProperties?: CommunityPropertyConfig[];
  /** Legacy two-office community grouping. Ignored when communityProperties is set. */
  offices?: OfficeConfig[];
};
