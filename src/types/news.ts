export type NewsCategory =
  | 'Local'
  | 'Agriculture'
  | 'Civic & Roads'
  | 'Education'
  | 'Culture'
  | 'Sports';

export type FilterCategory = 'All' | NewsCategory;

export type ImageKey =
  | 'none'
  | 'koppa-landscape'
  | 'coffee-estate'
  | 'tunga-bridge'
  | 'malnad-culture';

export interface NewsArticle {
  id: string;
  titleKannada: string;
  summaryKannada: string;
  bodyKannada: string[];
  category: NewsCategory;
  location: string;
  publishedDate: string;
  publishedTime: string;
  readTimeMinutes: number;
  reporter: string;
  imageKey?: ImageKey;
  imageUrl?: string;
  imageCaption?: string;
  isFeatured?: boolean;
}

export interface LocalBrief {
  id: string;
  area: string;
  timeLabel: string;
  textKannada: string;
}

export interface MarketRate {
  commodity: string;
  variety: string;
  pricePerQuintal: number;
  change: number;
}

export interface BusTimingItem {
  timingId: number;
  departureTime: string;
  departureTime24?: string;
  busName: string;
  remarks: string;
  fromPlaceEn?: string;
  fromPlaceKn?: string;
}

export interface BusRouteSchedule {
  routeId: number;
  routeName: string;
  description: string;
  timings: BusTimingItem[];
}

export interface BusPlaceSummary {
  titleId: number;
  placeId: number;
  nameEn: string;
  nameKn: string;
  routeCount: number;
}

export interface BusPlaceScheduleResponse {
  places: BusPlaceSummary[];
  activePlace: BusPlaceSummary;
  routes: BusRouteSchedule[];
}

export type BusAgentTimePreference = 'all' | 'morning' | 'afternoon' | 'evening';

export interface BusAgentChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface BusAgentMatchedRoute {
  placeNameEn: string;
  placeNameKn: string;
  routeId: number;
  routeTitle: string;
  routeSubtitle?: string;
  fromPlaceLabel: string;
  matchType: 'direct' | 'via';
  timings: BusTimingItem[];
}

export interface BusAgentResponse {
  status: 'needs_both' | 'needs_origin' | 'needs_destination' | 'ready';
  reply: string;
  origin?: string;
  destination?: string;
  timePreference?: BusAgentTimePreference;
  matchedRoutes: BusAgentMatchedRoute[];
  suggestedHubs?: string[];
}

