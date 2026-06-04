"use client";

import {
  CheckCircle2,
  CircleArrowDown,
  Heart,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DashboardData,
  ESTIMATOR_VERSION,
  defaultDashboardData,
  estimateRevenueFromViews,
  formatCompactNumber,
  formatCurrency,
  getDashboardDailyRevenue,
  getDashboardDailyViews,
  getDashboardTotals,
  iconUrls,
  reconcileDashboardData,
  studioLogoUrl,
} from "@/lib/dashboard-data";
import { studioImageSrc } from "@/lib/image-src";

const STORAGE_KEY = "studio-dashboard-data";
const analyticsTabs = ["Overview", "Content", "Audience", "Revenue", "Trends"] as const;

type AnalyticsTab = (typeof analyticsTabs)[number];

type AnalyticsView = {
  axisLabels: [string, string, string, string];
  chart: number[];
  chartLabel: string;
  chartMax: number;
  dateRange?: string;
  filters?: string[];
  headline?: string;
  kind: AnalyticsTab;
  metrics: DashboardData["metrics"];
  selectedFilter?: string;
};

type FilterSelections = Partial<Record<AnalyticsTab, string>>;

function migrateStoredDashboardData(data: DashboardData): DashboardData {
  const shouldRefreshEstimator = data.sourceUrl && data.estimatorVersion !== ESTIMATOR_VERSION;
  if (!shouldRefreshEstimator) return reconcileDashboardData(data);

  const views = getDashboardTotals(data).views28d;
  const refreshedData = {
    ...data,
    metrics: (data.metrics?.length ? data.metrics : defaultDashboardData.metrics).map((metric) => {
      if (metric.id === "revenue") {
        return {
          ...metric,
          value: formatCurrency(
            estimateRevenueFromViews({
              channelName: data.channelName,
              sourceUrl: data.sourceUrl ?? "",
              views,
            }),
          ),
        };
      }

      if (metric.id === "watch" || metric.id === "subs") {
        return {
          ...metric,
          detail: "About the same as usual",
          trend: "same" as const,
        };
      }

      return metric;
    }),
  };

  return reconcileDashboardData(refreshedData);
}

function formatNumberAxis(value: number) {
  return formatCompactNumber(Math.round(value));
}

function roundNumberAxis(value: number) {
  const safeValue = Math.max(1, value);
  const targetStep = safeValue / 3;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const normalized = targetStep / magnitude;
  const step =
    normalized <= 1
      ? 1
      : normalized <= 1.25
        ? 1.25
        : normalized <= 2
          ? 2
          : normalized <= 2.5
            ? 2.5
            : normalized <= 5
              ? 5
              : 10;

  return step * magnitude * 3;
}

function getNumberChartScale(chart: number[]) {
  const chartMax = roundNumberAxis(Math.max(...chart, 1) * 1.15);

  return {
    axisLabels: [
      formatNumberAxis(chartMax),
      formatNumberAxis(chartMax * (2 / 3)),
      formatNumberAxis(chartMax / 3),
      "0",
    ] as AnalyticsView["axisLabels"],
    chartMax,
  };
}

function formatCurrencyAxis(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `$${Math.round(value / 1_000)}K`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function roundRevenueAxis(value: number) {
  const safeValue = Math.max(1, value);
  const targetStep = safeValue / 3;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const normalized = targetStep / magnitude;
  const step =
    normalized <= 1
      ? 1
      : normalized <= 1.25
        ? 1.25
        : normalized <= 2
          ? 2
          : normalized <= 2.5
            ? 2.5
            : normalized <= 5
              ? 5
              : 10;

  return step * magnitude * 3;
}

function getRevenueChart(data: DashboardData) {
  const monthlyRevenue = getDashboardTotals(data).revenue28d;
  const chart = getDashboardDailyRevenue(data);
  const chartMax = roundRevenueAxis(Math.max(...chart, monthlyRevenue / 28, 1) * 1.15);

  return {
    axisLabels: [
      formatCurrencyAxis(chartMax),
      formatCurrencyAxis(chartMax * (2 / 3)),
      formatCurrencyAxis(chartMax / 3),
      "$0.00",
    ] as AnalyticsView["axisLabels"],
    chart,
    chartMax,
  };
}

function getAudienceChart(data: DashboardData) {
  const totals = getDashboardTotals(data);
  const viewsChart = getDashboardDailyViews(data);
  const averageViews = Math.max(
    1,
    viewsChart.reduce((total, value) => total + value, 0) / viewsChart.length,
  );
  const monthlyAudience = Math.max(
    1,
    Math.round(
      Math.min(
        totals.views28d * 0.95,
        Math.max(totals.views28d * 0.42, totals.subscribersTotal * 1.8),
      ),
    ),
  );
  const chart = viewsChart.map((value, index) => {
    const momentum = Math.min(0.26, Math.max(-0.16, ((value - averageViews) / averageViews) * 0.08));
    const wave = Math.sin(index * 0.63) * 0.035;
    return Math.max(1, Math.round(monthlyAudience * (0.92 + momentum + wave)));
  });
  const scale = getNumberChartScale(chart);

  return {
    ...scale,
    chart,
    monthlyAudience,
  };
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

const monthLookup: Record<string, number> = {
  Apr: 3,
  April: 3,
  Aug: 7,
  August: 7,
  Dec: 11,
  December: 11,
  Feb: 1,
  February: 1,
  Jan: 0,
  January: 0,
  Jul: 6,
  July: 6,
  Jun: 5,
  June: 5,
  Mar: 2,
  March: 2,
  May: 4,
  Nov: 10,
  November: 10,
  Oct: 9,
  October: 9,
  Sep: 8,
  September: 8,
};

function getChartStartDate(dateRange: string) {
  const [startPart, endPart] = dateRange.split(/\s+[\u2013-]\s+/);
  const year = Number(endPart?.match(/\b(20\d{2})\b/)?.[1] ?? new Date().getFullYear());
  const [, monthName, day] = startPart?.match(/^([A-Za-z]+)\s+(\d{1,2})/) ?? [];
  const month = monthLookup[monthName];

  if (month === undefined || !day || !Number.isFinite(year)) {
    return new Date(Date.UTC(2026, 4, 6));
  }

  return new Date(Date.UTC(year, month, Number(day)));
}

function getChartDateLabels(dateRange: string, length: number) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
  const start = getChartStartDate(dateRange);

  return Array.from({ length }, (_, index) => {
    const nextDate = new Date(start);
    nextDate.setUTCDate(start.getUTCDate() + index);
    return formatter.format(nextDate);
  });
}

function formatChartHoverValue(kind: AnalyticsTab, value: number) {
  if (kind === "Revenue") return formatCurrency(value);
  return Math.round(value).toLocaleString("en-US");
}

function getChartMetricLabel(kind: AnalyticsTab) {
  if (kind === "Audience") return "Monthly audience";
  if (kind === "Revenue") return "Estimated revenue";
  if (kind === "Trends") return "Interest";
  return "Views";
}

function getAnalyticsView(tab: AnalyticsTab, data: DashboardData): AnalyticsView {
  const totals = getDashboardTotals(data);
  const viewsChart = getDashboardDailyViews(data);
  const viewsScale = getNumberChartScale(viewsChart);

  if (tab === "Content") {
    const clickThroughRate = 0.058;
    const impressions = Math.max(1, Math.round(totals.views28d / clickThroughRate));
    const averageViewDuration =
      totals.views28d > 0 ? (totals.watchHours28d * 3600) / totals.views28d : 0;

    return {
      axisLabels: viewsScale.axisLabels,
      chartLabel: "Views",
      chart: viewsChart,
      chartMax: viewsScale.chartMax,
      dateRange: data.dateRange,
      filters: ["All", "Videos", "Shorts", "Live", "Posts", "Playlists"],
      kind: tab,
      metrics: [
        {
          ...data.metrics[0],
        },
        {
          id: "impressions",
          label: "Impressions",
          value: formatCompactNumber(impressions),
          detail: "About the same as usual",
          trend: "same",
        },
        {
          id: "ctr",
          label: "Impressions click-through rate",
          value: "5.8%",
          detail: "Views per impressions shown",
          trend: "neutral",
        },
        {
          id: "duration",
          label: "Average view duration",
          value: formatDuration(averageViewDuration),
          detail: "",
          trend: "neutral",
        },
      ],
      selectedFilter: "Live",
    };
  }

  if (tab === "Audience") {
    const audienceChart = getAudienceChart(data);

    return {
      axisLabels: audienceChart.axisLabels,
      chartLabel: "Monthly audience",
      chart: audienceChart.chart,
      chartMax: audienceChart.chartMax,
      dateRange: data.dateRange,
      kind: tab,
      metrics: [
        {
          id: "monthly-audience",
          label: "Monthly audience",
          value: formatCompactNumber(audienceChart.monthlyAudience),
          detail: "",
          trend: "neutral",
        },
        data.metrics[2],
      ],
    };
  }

  if (tab === "Revenue") {
    const revenueChart = getRevenueChart(data);

    return {
      axisLabels: revenueChart.axisLabels,
      chartLabel: "Estimated revenue",
      chart: revenueChart.chart,
      chartMax: revenueChart.chartMax,
      dateRange: data.dateRange,
      filters: ["All", "Shorts Feed ads", "Supers & gifts"],
      kind: tab,
      metrics: [
        {
          ...data.metrics[3],
          detail: "",
          trend: "neutral",
        },
      ],
      selectedFilter: "All",
    };
  }

  if (tab === "Trends") {
    return {
      axisLabels: ["100", "67", "33", "0"],
      chartLabel: "Interest",
      chart: [
        31, 34, 33, 36, 37, 44, 42, 39, 41, 43, 55, 61, 88, 72, 64, 67, 59,
        63, 58, 61, 66, 71, 68, 75, 69, 73, 70, 74,
      ],
      chartMax: 100,
      kind: tab,
      metrics: [],
    };
  }

  return {
    axisLabels: viewsScale.axisLabels,
    chartLabel: "Views",
    chart: viewsChart,
    chartMax: viewsScale.chartMax,
    dateRange: data.dateRange,
    headline: `Your channel got ${data.headlineViews} views in the last 28 days`,
    kind: tab,
    metrics: data.metrics,
  };
}

function IconImg({
  src,
  alt = "",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return <img alt={alt} className={`studio-icon ${className}`} src={src} />;
}

function TopBar({
  data,
  isNavExpanded,
  onToggleNav,
}: {
  data: DashboardData;
  isNavExpanded: boolean;
  onToggleNav: () => void;
}) {
  const router = useRouter();

  function openEditor(event: MouseEvent<HTMLImageElement>) {
    event.preventDefault();
    router.push("/account-analysis");
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          aria-expanded={isNavExpanded}
          aria-label={isNavExpanded ? "Collapse menu" : "Expand menu"}
          className="icon-button top-menu"
          onClick={onToggleNav}
          type="button"
        >
          <IconImg src={iconUrls.menu} />
        </button>
        <img
          alt="YouTube Studio dashboard"
          className="studio-logo"
          onContextMenu={openEditor}
          src={studioLogoUrl}
        />
      </div>
      <div className="topbar-actions">
        <button aria-label="Search" className="icon-button" type="button">
          <IconImg src={iconUrls.search} />
        </button>
        <button aria-label="Help" className="icon-button" type="button">
          <IconImg src={iconUrls.help} />
        </button>
        <button aria-label="Ask Studio" className="spark-button" type="button">
          <IconImg src={iconUrls.spark} />
        </button>
        <button aria-label="Notifications" className="icon-button bell-button" type="button">
          <IconImg src={iconUrls.bell} />
          <span className="notification-dot" />
        </button>
        <button className="create-button" type="button">
          <IconImg src={iconUrls.create} />
          <span>Create</span>
        </button>
        <button className="account-chip" type="button">
          <img alt="" src={studioImageSrc(data.avatarUrl)} />
          <span>
            <strong>{data.channelName}</strong>
            <small>You&apos;re a manager</small>
          </span>
        </button>
      </div>
    </header>
  );
}

const navItems = [
  ["dashboard", "Dashboard"],
  ["content", "Content"],
  ["analytics", "Analytics"],
  ["community", "Community"],
  ["languages", "Languages"],
  ["detection", "Content detection"],
  ["earn", "Earn"],
  ["customization", "Customization"],
  ["audio", "Audio library"],
] as const;

function SideNav({
  data,
  selectedItem,
  onSelectItem,
}: {
  data: DashboardData;
  selectedItem: (typeof navItems)[number][1];
  onSelectItem: (item: (typeof navItems)[number][1]) => void;
}) {
  return (
    <aside className="sidenav">
      <div className="channel-card">
        <img alt={data.channelName} className="channel-avatar" src={studioImageSrc(data.avatarUrl)} />
        <div className="channel-label">Channel</div>
        <div className="channel-name">{data.channelHandle}</div>
      </div>
      <nav className="nav-list" aria-label="Studio sections">
        {navItems.map(([icon, label]) => (
          <button
            aria-label={label}
            aria-current={label === selectedItem ? "page" : undefined}
            className={`nav-item ${label === selectedItem ? "active" : ""}`}
            key={label}
            onClick={() => onSelectItem(label)}
            type="button"
          >
            <IconImg src={iconUrls[icon]} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="nav-bottom">
        <button aria-label="Settings" className="nav-item" type="button">
          <IconImg src={iconUrls.settings} />
          <span>Settings</span>
        </button>
        <button aria-label="Send feedback" className="nav-item" type="button">
          <IconImg src={iconUrls.feedback} />
          <span>Send feedback</span>
        </button>
      </div>
    </aside>
  );
}

function PromptChip({ children }: { children: string }) {
  return (
    <button className="prompt-chip">
      <span className="prompt-spark">
        <IconImg src={iconUrls.spark} />
      </span>
      {children}
    </button>
  );
}

function HeaderArea({
  activeTab,
  data,
  onTabChange,
}: {
  activeTab: AnalyticsTab;
  data: DashboardData;
  onTabChange: (tab: AnalyticsTab) => void;
}) {
  const isTrends = activeTab === "Trends";
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const currentIndex = analyticsTabs.indexOf(activeTab);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? analyticsTabs.length - 1
          : event.key === "ArrowLeft"
            ? (currentIndex - 1 + analyticsTabs.length) % analyticsTabs.length
            : (currentIndex + 1) % analyticsTabs.length;

    onTabChange(analyticsTabs[nextIndex]);
  };

  return (
    <section className={`header-area ${isTrends ? "trends-header" : ""}`}>
      <div className="heading-row">
        <h1>Channel analytics</h1>
        {isTrends ? null : <button className="advanced-button">Advanced mode</button>}
      </div>
      <div className="suggestions-row">
        <PromptChip>How did viewers find my content?</PromptChip>
        <PromptChip>How many new viewers did I reach?</PromptChip>
        <PromptChip>Summarize my latest video performance</PromptChip>
        <button aria-label="Open overflow menu to dismiss suggestions" className="suggestion-menu">
          <IconImg src={iconUrls.overflow} />
        </button>
      </div>
      <div className="tabs-row">
        <div className="tabs" role="tablist">
          {analyticsTabs.map((tab) => (
            <button
              aria-controls="analytics-panel"
              aria-selected={tab === activeTab}
              className={`tab ${tab === activeTab ? "selected" : ""}`}
              key={tab}
              onKeyDown={onTabKeyDown}
              onClick={() => onTabChange(tab)}
              role="tab"
              tabIndex={tab === activeTab ? 0 : -1}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
        {isTrends ? null : (
          <button className="date-button" type="button">
            <span>{data.dateRange}</span>
            <strong>{data.periodLabel}</strong>
            <span aria-hidden className="date-caret" />
          </button>
        )}
      </div>
    </section>
  );
}

function TrendIcon({ trend }: { trend: DashboardData["metrics"][number]["trend"] }) {
  if (trend === "same" || trend === "up") {
    return <CheckCircle2 className="trend-check" size={19} strokeWidth={2} />;
  }
  if (trend === "down") {
    return <CircleArrowDown className="trend-down" size={18} strokeWidth={2} />;
  }
  return null;
}

function MetricStrip({ metrics }: { metrics: AnalyticsView["metrics"] }) {
  return (
    <div className="metric-strip">
      {metrics.map((metric) => (
        <button className="metric-card" key={metric.id}>
          <span className="metric-label">{metric.label}</span>
          <span className="metric-value">
            {metric.value}
            <TrendIcon trend={metric.trend} />
          </span>
          {metric.detail ? <span className="metric-detail">{metric.detail}</span> : null}
        </button>
      ))}
    </div>
  );
}

function Chart({
  axisLabels,
  dateRange,
  kind,
  maxValue,
  values,
}: {
  axisLabels: AnalyticsView["axisLabels"];
  dateRange: string;
  kind: AnalyticsTab;
  maxValue: number;
  values: number[];
}) {
  const chartOffsetY = 17;
  const chartWidth = 871;
  const chartHeight = 112;
  const xAxisY = 157;
  const xLabelY = 179;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { areaPoints, linePoints } = useMemo(() => {
    const line = values
      .map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * chartWidth;
        const y = chartHeight - (Math.min(value, maxValue) / maxValue) * chartHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return {
      areaPoints: `0,${chartHeight} ${line} ${chartWidth},${chartHeight}`,
      linePoints: line,
    };
  }, [chartHeight, chartWidth, maxValue, values]);
  const dateLabels = useMemo(() => getChartDateLabels(dateRange, values.length), [dateRange, values.length]);
  const hoverPoint =
    hoverIndex === null || values[hoverIndex] === undefined
      ? null
      : {
          date: dateLabels[hoverIndex],
          index: hoverIndex,
          value: values[hoverIndex],
          x: 24 + (hoverIndex / Math.max(values.length - 1, 1)) * chartWidth,
          y: chartOffsetY + chartHeight - (Math.min(values[hoverIndex], maxValue) / maxValue) * chartHeight,
        };
  const tooltipAlignment =
    hoverIndex !== null && hoverIndex > values.length - 5
      ? "align-left"
      : hoverIndex !== null && hoverIndex < 4
        ? "align-right"
        : "";

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - bounds.left) / bounds.width) * 946;
    const clampedX = Math.min(895, Math.max(24, svgX));
    const nextIndex = Math.round(((clampedX - 24) / chartWidth) * Math.max(values.length - 1, 1));

    setHoverIndex((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));
  }

  return (
    <div className="chart-area">
      <svg
        aria-label={`${getChartMetricLabel(kind)} over time`}
        className="main-chart"
        focusable="false"
        onPointerLeave={() => setHoverIndex(null)}
        onPointerMove={handlePointerMove}
        preserveAspectRatio="none"
        viewBox="0 0 946 190"
      >
        {[0, 1, 2, 3].map((line) => (
          <line
            className="chart-grid"
            key={line}
            x1="24"
            x2="895"
            y1={chartOffsetY + line * 37}
            y2={chartOffsetY + line * 37}
          />
        ))}
        <polygon
          className="chart-area-fill"
          fill={
            kind === "Content"
              ? "#7b6de8"
              : kind === "Audience"
                ? "#9b5de5"
                : kind === "Revenue"
                  ? "#56a6a4"
                  : "#3ea6d9"
          }
          opacity="0.14"
          points={areaPoints}
          transform={`translate(24 ${chartOffsetY})`}
        />
        <polyline
          className="chart-line chart-line-shadow"
          fill="none"
          points={linePoints}
          transform={`translate(24 ${chartOffsetY})`}
        />
        <polyline
          className="chart-line"
          fill="none"
          points={linePoints}
          transform={`translate(24 ${chartOffsetY})`}
        />
        {hoverPoint ? (
          <>
            <line
              className="chart-hover-line"
              x1={hoverPoint.x}
              x2={hoverPoint.x}
              y1={chartOffsetY}
              y2={xAxisY}
            />
            <circle className="chart-hover-dot" cx={hoverPoint.x} cy={hoverPoint.y} r="5" />
          </>
        ) : null}
        <line className="chart-axis" x1="24" x2="895" y1={xAxisY} y2={xAxisY} />
        <text className="axis-label" x="24" y={xLabelY}>
          May 6,...
        </text>
        <text className="axis-label" x="162" y={xLabelY}>
          May 11, 2026
        </text>
        <text className="axis-label" x="357" y={xLabelY}>
          May 15, 2026
        </text>
        <text className="axis-label" x="552" y={xLabelY}>
          May 20, 2026
        </text>
        <text className="axis-label" x="747" y={xLabelY}>
          May 29, 2...
        </text>
        <text className="axis-label" x="909" y={xLabelY}>
          Jun ...
        </text>
        <text className="axis-label right-axis" x="888" y="20">
          {axisLabels[0]}
        </text>
        <text className="axis-label right-axis" x="888" y="57">
          {axisLabels[1]}
        </text>
        <text className="axis-label right-axis" x="888" y="94">
          {axisLabels[2]}
        </text>
        <text className="axis-label right-axis" x="888" y="131">
          {axisLabels[3]}
        </text>
        <text className="publish-marker" x="552" y="149">
          (())
        </text>
        <rect
          className="chart-hover-capture"
          fill="transparent"
          height="160"
          width={chartWidth}
          x="24"
          y="0"
        />
      </svg>
      {hoverPoint ? (
        <div
          className={`chart-hover-tooltip ${tooltipAlignment}`}
          style={{ left: `${(hoverPoint.x / 946) * 100}%` }}
        >
          <span>{hoverPoint.date}</span>
          <strong>{formatChartHoverValue(kind, hoverPoint.value)}</strong>
        </div>
      ) : null}
    </div>
  );
}

function RadioFilters({
  ariaLabel = "Filter",
  filters,
  onSelect,
  selected,
}: {
  ariaLabel?: string;
  filters?: string[];
  onSelect?: (filter: string) => void;
  selected?: string;
}) {
  if (!filters?.length) return null;

  return (
    <div aria-label={ariaLabel} className="filter-row" role="radiogroup">
      {filters.map((filter) => (
        <button
          aria-checked={filter === selected}
          className={`filter-pill ${filter === selected ? "selected" : ""}`}
          key={filter}
          onClick={() => onSelect?.(filter)}
          role="radio"
          type="button"
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function PerformanceCard({ view }: { view: AnalyticsView }) {
  return (
    <section className={`performance-card chart-${view.kind.toLowerCase()}`}>
      <MetricStrip metrics={view.metrics} />
      <div
        aria-hidden={view.kind === "Revenue"}
        className="chart-label"
        style={view.kind === "Revenue" ? { visibility: "hidden" } : undefined}
      >
        {view.chartLabel}
      </div>
      <Chart
        axisLabels={view.axisLabels}
        dateRange={view.dateRange ?? defaultDashboardData.dateRange}
        kind={view.kind}
        maxValue={view.chartMax}
        values={view.chart}
      />
      <button className="see-more-button">See more</button>
    </section>
  );
}

function MiniRealtimeChart() {
  const bars = [4, 1, 3, 2, 7, 2, 7, 1, 1, 2, 1, 1, 3, 9, 24, 5, 3, 14, 4, 1, 7, 2, 1, 1, 1, 35, 2, 5];
  return (
    <div className="mini-chart" aria-label="Realtime views chart">
      {bars.map((height, index) => (
        <span key={index} style={{ height }} />
      ))}
    </div>
  );
}

function RealtimeCard({ data }: { data: DashboardData }) {
  return (
    <aside className="realtime-card">
      <h2>Realtime</h2>
      <div className="updating">
        <span />
        Updating live
      </div>
      <div className="divider" />
      <div className="realtime-subs">
        <strong>{data.realtimeSubscribers}</strong>
        <span>Subscribers</span>
      </div>
      <button className="live-count-button">See live count</button>
      <div className="divider" />
      <div className="views48">
        <strong>{data.realtimeViews}</strong>
        <span>Views · Last 48 hours</span>
      </div>
      <MiniRealtimeChart />
      <div className="mini-chart-labels">
        <span>-48h</span>
        <span>Now</span>
      </div>
      <div className="top-content-head">
        <span>Top content</span>
        <span>Views</span>
      </div>
      <div className="top-content-list">
        {data.topContent.map((item) => (
          <div className="top-content-item" key={item.title}>
            <img alt="" src={studioImageSrc(item.thumbnail)} />
            <span>{item.title}</span>
            <strong>{item.views}</strong>
          </div>
        ))}
      </div>
      <button className="see-more-button small">See more</button>
    </aside>
  );
}

function LatestContentCard({ data }: { data: DashboardData }) {
  const latest = data.topContent[0] ?? defaultDashboardData.topContent[0];

  return (
    <aside className="latest-content-card">
      <h2>Latest content</h2>
      <div className="latest-content-preview">
        <img alt="" src={studioImageSrc(latest.thumbnail)} />
        <div>
          <strong>{latest.title}</strong>
          <span>First 24 hours</span>
        </div>
      </div>
      <div className="latest-content-stat">
        <span>Views</span>
        <strong>{latest.views}</strong>
      </div>
      <button className="see-more-button small">See more</button>
    </aside>
  );
}

function OverviewHeadline({ views }: { views: string }) {
  return (
    <h2 className="headline" id="analytics-panel-heading">
      Your channel got {views} views in the last 28 days
    </h2>
  );
}

type DetailRow = {
  label: string;
  value: string;
  note?: string;
  thumb?: string;
};

function DetailCard({
  className = "",
  filters,
  rows,
  subtitle,
  title,
}: {
  className?: string;
  filters?: string[];
  rows: DetailRow[];
  subtitle?: string;
  title: string;
}) {
  return (
    <section className={`detail-card ${className}`}>
      <div className="detail-card-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {filters ? <RadioFilters filters={filters} selected={filters[0]} /> : null}
      <div className="detail-table">
        {rows.map((row, index) => (
          <div className="detail-row" key={`${title}-${index}-${row.label}`}>
            <div className="detail-label">
              {row.thumb ? (
                <img alt="" src={studioImageSrc(row.thumb)} />
              ) : (
                <span className="detail-swatch" />
              )}
              <span>
                <strong>{row.label}</strong>
                {row.note ? <small>{row.note}</small> : null}
              </span>
            </div>
            <strong className="detail-value">{row.value}</strong>
          </div>
        ))}
      </div>
      <button className="see-more-button card-button">See more</button>
    </section>
  );
}

function makeTopContentRows(data: DashboardData): DetailRow[] {
  const topContent = data.topContent?.length ? data.topContent : defaultDashboardData.topContent;

  return topContent.map((item, index) => ({
    label: item.title,
    note: index === 0 ? "Recent video · Views" : "Recent upload · Views",
    thumb: item.thumbnail,
    value: item.views,
  }));
}

function OverviewContentCard({ data }: { data: DashboardData }) {
  const rows = makeTopContentRows(data);

  return (
    <section className="lower-placeholder overview-content-card">
      <div className="section-rule" />
      <h2>Your top content in this period</h2>
      <div className="large-panel overview-table">
        {rows.map((row) => (
          <div className="placeholder-row" key={row.label}>
            <span>{row.label}</span>
            <div className="detail-label">
              <img alt="" src={studioImageSrc(row.thumb)} />
              <span>
                <small>{row.note}</small>
              </span>
            </div>
            <strong className="detail-value">{row.value}</strong>
          </div>
        ))}
        <div className="empty-row short" />
      </div>
    </section>
  );
}

function AudienceBehaviorCard() {
  return (
    <section className="detail-card audience-card">
      <div className="detail-card-head">
        <div>
          <h2>Audience by watch behavior</h2>
          <p>Monthly audience · Jun 2, 2026</p>
        </div>
      </div>
      <div className="audience-bars">
        <div className="audience-bar">
          <span style={{ width: "82.5%" }} />
          <span style={{ width: "17.4%" }} />
          <span style={{ width: "0.1%" }} />
        </div>
        {[
          ["New viewers", "Watched your channel for the first time", "82.5%"],
          ["Casual viewers", "Watched your channel in up to 5 months over the past year", "17.5%"],
          ["Regular viewers", "Watched your channel in 6 or more months over the past year", "< 0.1%"],
        ].map(([label, note, value]) => (
          <div className="audience-legend" key={label}>
            <span />
            <strong className="audience-legend-label">
              {label}
              {label === "New viewers" ? <Info size={16} strokeWidth={2} /> : null}
            </strong>
            <small>{note}</small>
            <em>{value}</em>
          </div>
        ))}
      </div>
      <button className="see-more-button card-button">See more</button>
    </section>
  );
}

function ViewerHeatmapCard() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 24 }, (_, hour) => hour);

  return (
    <section className="detail-card heatmap-card">
      <div className="detail-card-head">
        <div>
          <h2>When your viewers are on YouTube</h2>
          <p>Your local time (GMT -0700) · Last 28 days</p>
        </div>
      </div>
      <div className="heatmap-times">
        <span>12:00 AM</span>
        <span>6:00 AM</span>
        <span>12:00 PM</span>
        <span>6:00 PM</span>
      </div>
      <div className="heatmap-grid">
        {days.map((day, dayIndex) => (
          <div className="heatmap-day" key={day}>
            <span>{day}</span>
            {hours.map((hour) => {
              const intensity =
                hour >= 7 && hour <= 10
                  ? 4
                  : hour >= 11 && hour <= 14
                    ? 3
                    : hour >= 4 && hour <= 6
                      ? 2
                      : hour === 23
                        ? 2
                        : 1;
              return <i className={`heat-${Math.max(1, intensity - (dayIndex % 2))}`} key={hour} />;
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function PopularAudienceCard({ data }: { data: DashboardData }) {
  const rows = makeTopContentRows(data).map((row, index) => ({
    ...row,
    width: `${Math.max(32, 92 - index * 24)}%`,
  }));

  return (
    <section className="detail-card popular-audience-card">
      <div className="detail-card-head">
        <div>
          <h2>Popular with different audiences</h2>
          <p>Views · Last 28 days</p>
        </div>
      </div>
      <RadioFilters
        ariaLabel="Audience group"
        filters={["New", "Casual", "Regular"]}
        selected="New"
      />
      <div className="popular-list">
        {rows.map((row) => (
          <div className="popular-row" key={row.label}>
            <img alt="" src={studioImageSrc(row.thumb)} />
            <span>{row.label}</span>
            <div className="popular-bar" aria-hidden="true">
              <i style={{ width: row.width }} />
            </div>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
      <button className="see-more-button card-button">See more</button>
    </section>
  );
}

function TrendsPanel() {
  const topics = [
    "block clutch montage",
    "minecraft clutch edit",
    "how to clutch in minecraft",
  ];

  return (
    <section
      aria-label="Trends analytics"
      className="trends-panel"
      id="analytics-panel"
      role="tabpanel"
    >
      <div className="trends-notice">
        <Info size={20} strokeWidth={1.8} />
        <span>
          AI tools for brainstorming video ideas have moved to Inspiration.
          <button className="notice-link" type="button">
            Learn more
          </button>
        </span>
        <button className="inspiration-button">Go to Inspiration</button>
      </div>
      <div className="trends-head">
        <h2>Get ideas for your next video</h2>
        <button className="saved-topics-button">
          <Heart size={22} strokeWidth={2.2} />
          Saved (0)
        </button>
      </div>
      <label className="trend-search">
        <IconImg src={iconUrls.search} />
        <input placeholder="Search" type="search" />
      </label>
      <div className="topic-section">
        <div className="topic-title-row">
          <h3>What people are looking for</h3>
          <button>Show all</button>
        </div>
        <div className="topic-grid">
          {topics.map((topic) => (
            <article className="topic-card" key={topic}>
              <p>{topic}</p>
              <button aria-label={`Save ${topic}`} type="button">
                <Heart size={22} strokeWidth={2.2} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TabDetailSections({ data, view }: { data: DashboardData; view: AnalyticsView }) {
  const topContentRows = makeTopContentRows(data);

  if (view.kind === "Content") {
    return (
      <section className="detail-columns content-columns">
        <div className="detail-column">
          <DetailCard
            className="content-source-card"
            filters={["Overall", "External", "YouTube search", "Suggested videos", "Playlists"]}
            rows={[
              { label: "Shorts feed", value: "90.3%" },
              { label: "Vertical live feed", value: "8.2%" },
              { label: "Direct or unknown", value: "0.8%" },
              { label: "Channel pages", value: "0.3%" },
              { label: "Other YouTube features", value: "0.3%" },
              { label: "Others", value: "0.2%" },
            ]}
            subtitle="Views · Last 28 days"
            title="How viewers find your live streams"
          />
        </div>
        <div className="detail-column">
          <DetailCard
            className="content-top-card"
            rows={topContentRows}
            subtitle="Views · Last 28 days"
            title="Top live streams"
          />
        </div>
      </section>
    );
  }

  if (view.kind === "Audience") {
    return (
      <section className="detail-grid audience-grid">
        <AudienceBehaviorCard />
        <PopularAudienceCard data={data} />
        <DetailCard
          rows={topContentRows.slice(0, 1).map((row) => ({ ...row, value: "Low" }))}
          subtitle="Last 90 days"
          title="Videos growing your audience"
        />
        <ViewerHeatmapCard />
      </section>
    );
  }

  if (view.kind === "Revenue") {
    return (
      <section className="detail-columns revenue-columns">
        <div className="detail-column">
          <DetailCard
            className="revenue-earning-card"
            rows={[
              { label: "June (ongoing)", value: "$0.03" },
              { label: "May", value: "$627.76" },
              { label: "April", value: "$1,469.90" },
              { label: "March", value: "$3,039.33" },
              { label: "February", value: "$2,716.76" },
              { label: "January", value: "$0.00" },
            ]}
            subtitle="Estimated · Last 6 months"
            title="How much you’re earning"
          />
          <DetailCard
            className="revenue-money-card"
            filters={["All", "Videos", "Shorts", "Live"]}
            rows={[
              { label: "Supers & gifts", value: "$618.59" },
              { label: "Watch Page ads", value: "$8.38" },
              { label: "Shorts Feed ads", value: "$0.74" },
            ]}
            subtitle="Estimated · Last 28 days"
            title="How you make money"
          />
        </div>
        <div className="detail-column">
          <DetailCard
            className="revenue-content-card"
            filters={["Videos", "Shorts", "Live"]}
            rows={topContentRows.map((row, index) => ({
              ...row,
              value: ["$0.31", "$0.13", "$0.13"][index] ?? "$0.03",
            }))}
            subtitle="Last 28 days"
            title="Content performance"
          />
        </div>
      </section>
    );
  }

  return (
    null
  );
}

function AnalyticsPanel({
  data,
  onFilterSelect,
  view,
}: {
  data: DashboardData;
  onFilterSelect: (filter: string) => void;
  view: AnalyticsView;
}) {
  if (view.kind === "Trends") {
    return <TrendsPanel />;
  }

  return (
    <>
      <section
        aria-labelledby="analytics-panel-heading"
        className={`analytics-top analytics-${view.kind.toLowerCase()}`}
        id="analytics-panel"
        role="tabpanel"
      >
        <div className="left-analytics">
          {view.kind === "Overview" ? (
            <OverviewHeadline views={data.headlineViews} />
          ) : view.headline ? (
            <h2 className="headline" id="analytics-panel-heading">
              {view.headline}
            </h2>
          ) : null}
          <RadioFilters
            ariaLabel={`${view.kind} content type`}
            filters={view.filters}
            onSelect={onFilterSelect}
            selected={view.selectedFilter}
          />
          <PerformanceCard view={view} />
          {view.kind === "Overview" ? <OverviewContentCard data={data} /> : null}
        </div>
        {view.kind === "Overview" ? (
          <div className="right-rail">
            <RealtimeCard data={data} />
            <LatestContentCard data={data} />
          </div>
        ) : null}
      </section>
      <TabDetailSections data={data} view={view} />
    </>
  );
}
export function StudioDashboard() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("Overview");
  const [data, setData] = useState<DashboardData>(defaultDashboardData);
  const [filterSelections, setFilterSelections] = useState<FilterSelections>({});
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [selectedNavItem, setSelectedNavItem] =
    useState<(typeof navItems)[number][1]>("Analytics");
  const view = useMemo(() => {
    const tabView = getAnalyticsView(activeTab, data);
    const selectedFilter =
      filterSelections[activeTab] ?? tabView.selectedFilter ?? tabView.filters?.[0];

    return selectedFilter ? { ...tabView, selectedFilter } : tabView;
  }, [activeTab, data, filterSelections]);

  useEffect(() => {
    const loadStoredData = () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setData(defaultDashboardData);
        return;
      }

      try {
        const parsed = JSON.parse(stored) as DashboardData;
        const migrated = migrateStoredDashboardData(parsed);
        if (migrated !== parsed) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
        setData(migrated);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        setData(defaultDashboardData);
      }
    };

    const timeout = window.setTimeout(() => {
      loadStoredData();
    }, 0);

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) loadStoredData();
    };
    const onVisibilityChange = () => {
      if (!document.hidden) loadStoredData();
    };

    window.addEventListener("focus", loadStoredData);
    window.addEventListener("storage", onStorage);
    window.addEventListener("studio-dashboard-data-updated", loadStoredData);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("focus", loadStoredData);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("studio-dashboard-data-updated", loadStoredData);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div className={`studio-app ${isNavExpanded ? "nav-expanded" : ""}`}>
      <TopBar
        data={data}
        isNavExpanded={isNavExpanded}
        onToggleNav={() => setIsNavExpanded((expanded) => !expanded)}
      />
      <SideNav data={data} selectedItem={selectedNavItem} onSelectItem={setSelectedNavItem} />
      <main className="main-view">
        <HeaderArea activeTab={activeTab} data={data} onTabChange={setActiveTab} />
        <AnalyticsPanel
          data={data}
          onFilterSelect={(filter) =>
            setFilterSelections((selections) => ({
              ...selections,
              [activeTab]: filter,
            }))
          }
          view={view}
        />
      </main>
    </div>
  );
}
