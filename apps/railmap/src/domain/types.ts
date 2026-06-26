// railmap 固有型(SPEC §3.2 / §4)

export type RailType = "新幹線" | "JR在来線" | "私鉄" | "地下鉄" | "路面・その他";

export type LineMeta = {
  operator: string;
  lineName: string;
  lengthKm: number;
  railType: RailType;
  pref: string[];
};

export type Meta = {
  lines: Record<string, LineMeta>;
  totals: {
    lengthKm: number;
    lineCount: number;
    stationCount: number;
    byPref: Record<string, number>;
    byRailType: Record<string, number>;
  };
};

export type LineProps = {
  lineId: string;
  operator: string;
  lineName: string;
  segIdx: number;
  railType: RailType;
};

export type RideStatus = "full";

export type Ride = {
  status: RideStatus;
  firstDate?: string;
  count: number;
  memo?: string;
};

export type ThemeColor = "neon-blue" | "neon-green" | "neon-pink";

export type SaveData = {
  version: 1;
  updatedAt: string;
  rides: Record<string, Ride>;
  visitedStations: string[];
  settings: { theme: ThemeColor; sound: boolean };
  unlockedAchievements: Record<string, string>;
};
