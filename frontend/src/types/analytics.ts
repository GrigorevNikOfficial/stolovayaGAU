export type AnalyticsModuleId = 'services' | 'cafeteria' | 'finance';
export type AnalyticsRangeOption = 7 | 30;

export type AnalyticsSummaryCard = {
  id: string;
  title: string;
  value: number;
  diff: string;
};

export type AnalyticsTimelineSeries = {
  labels: string[];
  services: number[];
  cafeteria: number[];
  finance: number[];
};

export type AnalyticsModuleShareItem = {
  id: AnalyticsModuleId;
  label: string;
  value: number;
  color: string;
};

export type AnalyticsChecklistItem = {
  title: string;
  value: number;
  description: string;
};

export type AnalyticsModuleSnapshot = {
  id: AnalyticsModuleId;
  label: string;
  timeline: number[];
  labels: string[];
  total: number;
  averagePerDay: number;
  lastValue: number;
};

export type AnalyticsPeriodMeta = {
  days: AnalyticsRangeOption;
  range: 'week' | 'month';
  start: string;
  end: string;
};

export type AdminAnalyticsResponse = {
  summaryCards: AnalyticsSummaryCard[];
  timeline: AnalyticsTimelineSeries;
  moduleShare: AnalyticsModuleShareItem[];
  checklist: AnalyticsChecklistItem[];
  selectedModule: AnalyticsModuleSnapshot;
  period: AnalyticsPeriodMeta;
};
