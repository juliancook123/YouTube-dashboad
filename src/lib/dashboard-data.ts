export type MetricCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
  trend: "same" | "down" | "up" | "neutral";
};

export type TopContent = {
  title: string;
  views: string;
  thumbnail: string;
};

export type DashboardTotals = {
  views28d: number;
  watchHours28d: number;
  subscribersGained28d: number;
  revenue28d: number;
  realtimeViews48h: number;
  subscribersTotal: number;
};

export type DashboardDaily = {
  views: number[];
  revenue: number[];
};

export type DashboardData = {
  channelName: string;
  channelHandle: string;
  avatarUrl: string;
  estimatorVersion?: number;
  headlineViews: string;
  dateRange: string;
  periodLabel: string;
  subscribers: string;
  realtimeViews: string;
  realtimeSubscribers: string;
  metrics: MetricCard[];
  chart: number[];
  daily?: Partial<DashboardDaily>;
  topContent: TopContent[];
  totals?: Partial<DashboardTotals>;
  sourceUrl?: string;
};

export const studioLogoUrl =
  "https://www.gstatic.com/youtube/img/creator/yt_studio_logo_v2_darkmode.svg";

export const ESTIMATOR_VERSION = 5;
const DEFAULT_ESTIMATED_RPM = 4.75;
const DEFAULT_SERIES_LENGTH = 29;

export const iconUrls = {
  menu: "https://fonts.gstatic.com/s/i/youtube_outline_experimental/menu/v1/24px.svg",
  search:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/search/v15/24px.svg",
  help: "https://fonts.gstatic.com/s/i/youtube_outline_experimental/help_circle/v2/24px.svg",
  bell: "https://fonts.gstatic.com/s/i/youtube_outline_experimental/bell/v11/24px.svg",
  create:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/video_camera_add/v2/24px.svg",
  dashboard:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/dashboard/v2/24px.svg",
  content:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/play_square_stack/v1/24px.svg",
  analytics:
    "https://fonts.gstatic.com/s/i/youtube_fill_experimental/chart_bar_square/v3/24px.svg",
  community:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/person3/v2/24px.svg",
  languages:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/subtitles/v5/24px.svg",
  detection:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/copyright/v4/24px.svg",
  earn:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/dollar_sign_circle/v12/24px.svg",
  customization:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/magic_wand/v3/24px.svg",
  audio:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/audio_square_stack/v2/24px.svg",
  settings:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/gear/v10/24px.svg",
  feedback:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/alert_bubble/v2/24px.svg",
  spark: "https://fonts.gstatic.com/s/i/youtube_fill_experimental/spark/v11/24px.svg",
  overflow:
    "https://fonts.gstatic.com/s/i/youtube_outline_experimental/overflow_vertical/v13/24px.svg",
};

export const defaultDashboardData: DashboardData = {
  channelName: "Nickynoodlepaws",
  channelHandle: "Nickynoodlepaws",
  avatarUrl: "/mock-assets/channel-avatar.jpg",
  estimatorVersion: ESTIMATOR_VERSION,
  headlineViews: "486,969",
  dateRange: "May 6 \u2013 Jun 2, 2026",
  periodLabel: "Last 28 days",
  subscribers: "+2.3K",
  realtimeViews: "119",
  realtimeSubscribers: "179,883",
  totals: {
    views28d: 486_969,
    watchHours28d: 4_000,
    subscribersGained28d: 2_300,
    revenue28d: 627.7,
    realtimeViews48h: 119,
    subscribersTotal: 179_883,
  },
  metrics: [
    {
      id: "views",
      label: "Views",
      value: "487.0K",
      detail: "About the same as usual",
      trend: "same",
    },
    {
      id: "watch",
      label: "Watch time (hours)",
      value: "4.0K",
      detail: "About the same as usual",
      trend: "same",
    },
    {
      id: "subs",
      label: "Subscribers",
      value: "+2.3K",
      detail: "87% less than previous 28 days",
      trend: "down",
    },
    {
      id: "revenue",
      label: "Estimated revenue",
      value: "$627.70",
      detail: "",
      trend: "neutral",
    },
  ],
  chart: [
    1863, 1863, 1863, 1863, 35570, 11857, 1779, 1779, 23713, 64365, 306579,
    1863, 1779, 1779, 1779, 1779, 1779, 1779, 1779, 1779, 1778, 1778, 1778,
    1778, 1778, 1778, 1778, 1778, 1778, 1778,
  ],
  topContent: [
    {
      title: "200IQ Save in my 1...",
      views: "20",
      thumbnail: "/mock-assets/top-1.jpg",
    },
    {
      title: "What If A Teacher O...",
      views: "18",
      thumbnail: "/mock-assets/top-2.jpg",
    },
    {
      title: "Noob Gets Trolled b...",
      views: "14",
      thumbnail: "/mock-assets/top-3.jpg",
    },
  ],
};

export function formatCompactNumber(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function parseDashboardNumber(value?: number | string | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed || !/\d/.test(trimmed)) return undefined;

  const suffix = trimmed.match(/([kmb])\s*$/i)?.[1].toLowerCase();
  const multiplier =
    suffix === "b" ? 1_000_000_000 : suffix === "m" ? 1_000_000 : suffix === "k" ? 1_000 : 1;
  const parsed = Number(trimmed.replace(/,/g, "").replace(/[^0-9.-]/g, ""));

  return Number.isFinite(parsed) ? parsed * multiplier : undefined;
}

function getChannelLabel(sourceUrl: string) {
  let label = "Imported channel";

  try {
    const parsed = new URL(sourceUrl);
    const path = parsed.pathname.split("/").filter(Boolean);
    const candidate =
      path.find((part) => part.startsWith("@")) ??
      path[path.indexOf("channel") + 1] ??
      path[path.length - 1];
    if (candidate) label = candidate;
  } catch {
    label = sourceUrl || label;
  }

  return label
    .replace(/^@/, "")
    .replace(/^UC/, "")
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .trim()
    .replace(/\s+/g, " ") || "Imported channel";
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function seededRatio(seed: number, salt: number) {
  const x = Math.sin(seed + salt * 9973) * 10000;
  return x - Math.floor(x);
}

function roundedEstimate(value: number) {
  if (value >= 1_000_000) return Math.round(value / 10_000) * 10_000;
  if (value >= 100_000) return Math.round(value / 1_000) * 1_000;
  if (value >= 10_000) return Math.round(value / 100) * 100;
  return Math.max(1, Math.round(value));
}

function formatSignedCompactNumber(value: number) {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${formatCompactNumber(rounded)}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function sumSeries(values?: number[]) {
  return (
    values?.reduce((total, value) => (Number.isFinite(value) ? total + Math.max(0, value) : total), 0) ??
    0
  );
}

function firstParsedValue(...values: Array<number | string | undefined>) {
  for (const value of values) {
    const parsed = parseDashboardNumber(value);
    if (parsed !== undefined) return parsed;
  }

  return undefined;
}

export function normalizeDailySeriesToTotal(
  source: number[] | undefined,
  total: number,
  length = source?.length || DEFAULT_SERIES_LENGTH,
) {
  const safeLength = Math.max(2, Math.min(40, Math.round(length)));
  const safeTotal = Math.max(0, Math.round(total));
  const weights = Array.from({ length: safeLength }, (_, index) => {
    const value = source?.[index];
    return Number.isFinite(value) && value !== undefined ? Math.max(0, value) : 1;
  });
  const weightTotal = sumSeries(weights);

  if (safeTotal === 0) return weights.map(() => 0);

  const balancedWeights = weightTotal > 0 ? weights : weights.map(() => 1);
  const balancedTotal = sumSeries(balancedWeights);
  const rawValues = balancedWeights.map((value) => (value / balancedTotal) * safeTotal);
  const normalized = rawValues.map((value) => Math.floor(value));
  let remaining = safeTotal - sumSeries(normalized);
  const fractionalOrder = rawValues
    .map((value, index) => ({ index, fraction: value - normalized[index] }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let index = 0; remaining > 0; index += 1) {
    normalized[fractionalOrder[index % fractionalOrder.length].index] += 1;
    remaining -= 1;
  }

  return normalized;
}

function normalizeCurrencySeriesToTotal(
  source: number[] | undefined,
  total: number,
  length = source?.length || DEFAULT_SERIES_LENGTH,
) {
  return normalizeDailySeriesToTotal(source, Math.round(Math.max(0, total) * 100), length).map(
    (value) => value / 100,
  );
}

export function estimateRevenueFromViews({
  channelName,
  sourceUrl,
  views,
}: {
  channelName: string;
  sourceUrl: string;
  views: number;
}) {
  const seed = hashString(`${sourceUrl}:${channelName}`);
  const rpm = DEFAULT_ESTIMATED_RPM * (0.9 + seededRatio(seed, 23) * 0.2);
  return (Math.max(0, views) / 1000) * rpm;
}

function makeEstimatedChart(last28Views: number, seed: number) {
  const dailyAverage = Math.max(20, last28Views / 28);
  const spikeIndex = 5 + Math.floor(seededRatio(seed, 31) * 16);

  const weights = Array.from({ length: DEFAULT_SERIES_LENGTH }, (_, index) => {
    const wave = 0.68 + seededRatio(seed, index + 41) * 0.48;
    const weekendLift = index % 7 === 5 || index % 7 === 6 ? 1.18 : 1;
    const spike =
      index === spikeIndex
        ? 3.4 + seededRatio(seed, 67) * 2.7
        : Math.abs(index - spikeIndex) === 1
          ? 1.45
          : 1;
    return Math.max(20, Math.round(dailyAverage * wave * weekendLift * spike));
  });

  return normalizeDailySeriesToTotal(weights, last28Views, weights.length);
}

function getMetricById(metrics: MetricCard[], id: string) {
  return metrics.find((metric) => metric.id === id);
}

function normalizeMetricsWithTotals(metrics: MetricCard[], totals: DashboardTotals) {
  return metrics.map((metric) => {
    if (metric.id === "views") return { ...metric, value: formatCompactNumber(totals.views28d) };
    if (metric.id === "watch") return { ...metric, value: formatCompactNumber(totals.watchHours28d) };
    if (metric.id === "subs") {
      return { ...metric, value: formatSignedCompactNumber(totals.subscribersGained28d) };
    }
    if (metric.id === "revenue") return { ...metric, value: formatCurrency(totals.revenue28d) };
    return metric;
  });
}

function normalizeTopContent(topContent?: TopContent[]) {
  return defaultDashboardData.topContent.map((item, index) => ({
    ...item,
    ...(topContent?.[index] ?? {}),
  }));
}

function normalizeMetricList(metrics?: MetricCard[]) {
  return defaultDashboardData.metrics.map((metric, index) => {
    const matchingMetric = metrics?.find((candidate) => candidate.id === metric.id);
    return {
      ...metric,
      ...(matchingMetric ?? metrics?.[index] ?? {}),
      id: metric.id,
      label: metric.label,
    };
  });
}

export function getDashboardTotals(data: DashboardData): DashboardTotals {
  const metrics = normalizeMetricList(data.metrics);
  const viewsMetric = getMetricById(metrics, "views");
  const watchMetric = getMetricById(metrics, "watch");
  const subsMetric = getMetricById(metrics, "subs");
  const revenueMetric = getMetricById(metrics, "revenue");
  const chartTotal = sumSeries(data.chart?.length ? data.chart : data.daily?.views);

  return {
    views28d: Math.max(
      0,
      Math.round(
        firstParsedValue(data.headlineViews, viewsMetric?.value, data.totals?.views28d, chartTotal) ?? 0,
      ),
    ),
    watchHours28d: Math.max(
      0,
      Math.round(firstParsedValue(watchMetric?.value, data.totals?.watchHours28d) ?? 0),
    ),
    subscribersGained28d: Math.round(
      firstParsedValue(data.subscribers, subsMetric?.value, data.totals?.subscribersGained28d) ?? 0,
    ),
    revenue28d: Math.max(
      0,
      firstParsedValue(revenueMetric?.value, data.totals?.revenue28d) ?? 0,
    ),
    realtimeViews48h: Math.max(
      0,
      Math.round(firstParsedValue(data.realtimeViews, data.totals?.realtimeViews48h) ?? 0),
    ),
    subscribersTotal: Math.max(
      0,
      Math.round(firstParsedValue(data.realtimeSubscribers, data.totals?.subscribersTotal) ?? 0),
    ),
  };
}

export function getDashboardDailyViews(data: DashboardData) {
  const totals = getDashboardTotals(data);
  const source = data.chart?.length ? data.chart : data.daily?.views;
  return normalizeDailySeriesToTotal(source, totals.views28d, source?.length || DEFAULT_SERIES_LENGTH);
}

export function getDashboardDailyRevenue(data: DashboardData) {
  const totals = getDashboardTotals(data);
  const views = getDashboardDailyViews(data);
  return normalizeCurrencySeriesToTotal(views, totals.revenue28d, views.length);
}

export function reconcileDashboardData(data: DashboardData): DashboardData {
  const metrics = normalizeMetricList(data.metrics);
  const topContent = normalizeTopContent(data.topContent);
  const totals = getDashboardTotals({
    ...defaultDashboardData,
    ...data,
    metrics,
    topContent,
  });
  const sourceViews = data.chart?.length ? data.chart : data.daily?.views;
  const dailyViews = normalizeDailySeriesToTotal(
    sourceViews,
    totals.views28d,
    sourceViews?.length || DEFAULT_SERIES_LENGTH,
  );
  const dailyRevenue = normalizeCurrencySeriesToTotal(
    dailyViews,
    totals.revenue28d,
    dailyViews.length,
  );

  return {
    ...defaultDashboardData,
    ...data,
    chart: dailyViews,
    daily: {
      views: dailyViews,
      revenue: dailyRevenue,
    },
    estimatorVersion: ESTIMATOR_VERSION,
    headlineViews: totals.views28d.toLocaleString("en-US"),
    metrics: normalizeMetricsWithTotals(metrics, totals),
    realtimeSubscribers: totals.subscribersTotal.toLocaleString("en-US"),
    realtimeViews: formatCompactNumber(totals.realtimeViews48h),
    subscribers: formatSignedCompactNumber(totals.subscribersGained28d),
    topContent,
    totals,
  };
}

export function buildEstimatedDashboardData({
  avatarUrl,
  channelHandle,
  channelName,
  sourceUrl,
  subscriberCount,
  topContent,
  totalViews,
  videoCount,
}: {
  avatarUrl?: string;
  channelHandle?: string;
  channelName?: string;
  sourceUrl: string;
  subscriberCount?: number;
  topContent?: TopContent[];
  totalViews?: number;
  videoCount?: number;
}): DashboardData {
  const label = channelName?.trim() || getChannelLabel(sourceUrl);
  const seed = hashString(`${sourceUrl}:${label}`);
  const estimatedSubscribers = roundedEstimate(
    subscriberCount && subscriberCount > 0
      ? subscriberCount
      : 18_000 + seededRatio(seed, 3) * 920_000,
  );
  const lifetimeViews =
    totalViews && totalViews > 0
      ? totalViews
      : estimatedSubscribers * (18 + seededRatio(seed, 5) * 110);
  const publicVideoCount =
    videoCount && videoCount > 0 ? videoCount : 40 + Math.round(seededRatio(seed, 7) * 520);
  const averageVideoViews = lifetimeViews / Math.max(publicVideoCount, 1);
  const last28Views = roundedEstimate(
    Math.max(
      1_000,
      averageVideoViews * (1.8 + seededRatio(seed, 11) * 10.5) +
        estimatedSubscribers * (0.12 + seededRatio(seed, 13) * 1.35),
    ),
  );
  const gainedSubscribers = roundedEstimate(
    Math.max(1, last28Views * (0.0018 + seededRatio(seed, 17) * 0.006)),
  );
  const averageViewDurationSeconds = 24 + Math.round(seededRatio(seed, 19) * 74);
  const watchHours = roundedEstimate((last28Views * averageViewDurationSeconds) / 3600);
  const revenue = estimateRevenueFromViews({
    channelName: label,
    sourceUrl,
    views: last28Views,
  });
  const realtimeViews = roundedEstimate((last28Views / 28 / 24) * 48 * (0.58 + seededRatio(seed, 29)));
  const dailyViews = makeEstimatedChart(last28Views, seed);
  const dailyRevenue = normalizeCurrencySeriesToTotal(dailyViews, revenue, dailyViews.length);
  const handle =
    channelHandle?.replace(/^@/, "") ||
    label.replace(/[^a-z0-9]+/gi, "").slice(0, 28) ||
    defaultDashboardData.channelHandle;

  return {
    ...defaultDashboardData,
    avatarUrl: avatarUrl || defaultDashboardData.avatarUrl,
    channelHandle: handle,
    channelName: label,
    chart: dailyViews,
    daily: {
      views: dailyViews,
      revenue: dailyRevenue,
    },
    estimatorVersion: ESTIMATOR_VERSION,
    headlineViews: last28Views.toLocaleString("en-US"),
    metrics: [
      {
        id: "views",
        label: "Views",
        value: formatCompactNumber(last28Views),
        detail: seededRatio(seed, 37) > 0.5 ? "Higher than previous 28 days" : "About the same as usual",
        trend: seededRatio(seed, 37) > 0.5 ? "up" : "same",
      },
      {
        id: "watch",
        label: "Watch time (hours)",
        value: formatCompactNumber(watchHours),
        detail: "About the same as usual",
        trend: "same",
      },
      {
        id: "subs",
        label: "Subscribers",
        value: formatSignedCompactNumber(gainedSubscribers),
        detail: "About the same as usual",
        trend: "same",
      },
      {
        id: "revenue",
        label: "Estimated revenue",
        value: formatCurrency(revenue),
        detail: "",
        trend: "neutral",
      },
    ],
    realtimeSubscribers: estimatedSubscribers.toLocaleString("en-US"),
    realtimeViews: formatCompactNumber(realtimeViews),
    sourceUrl,
    subscribers: formatSignedCompactNumber(gainedSubscribers),
    totals: {
      views28d: last28Views,
      watchHours28d: watchHours,
      subscribersGained28d: gainedSubscribers,
      revenue28d: revenue,
      realtimeViews48h: realtimeViews,
      subscribersTotal: estimatedSubscribers,
    },
    topContent: topContent?.length
      ? topContent.slice(0, 3)
      : [
          {
            thumbnail: defaultDashboardData.topContent[0].thumbnail,
            title: `${label} highlights`,
            views: formatCompactNumber(last28Views * (0.24 + seededRatio(seed, 43) * 0.18)),
          },
          {
            thumbnail: defaultDashboardData.topContent[1].thumbnail,
            title: `${label} newest upload`,
            views: formatCompactNumber(last28Views * (0.12 + seededRatio(seed, 47) * 0.14)),
          },
          {
            thumbnail: defaultDashboardData.topContent[2].thumbnail,
            title: `${label} top short`,
            views: formatCompactNumber(last28Views * (0.08 + seededRatio(seed, 53) * 0.1)),
          },
        ],
  };
}

export function makeMockDashboardData(sourceUrl: string): DashboardData {
  return buildEstimatedDashboardData({ sourceUrl });
}
