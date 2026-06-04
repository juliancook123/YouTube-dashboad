"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  DashboardData,
  defaultDashboardData,
  makeMockDashboardData,
  reconcileDashboardData,
} from "@/lib/dashboard-data";

const STORAGE_KEY = "studio-dashboard-data";
const trendOptions: DashboardData["metrics"][number]["trend"][] = [
  "same",
  "down",
  "up",
  "neutral",
];
type DashboardTextField =
  | "avatarUrl"
  | "channelHandle"
  | "channelName"
  | "dateRange"
  | "headlineViews"
  | "periodLabel"
  | "realtimeSubscribers"
  | "realtimeViews"
  | "sourceUrl"
  | "subscribers";
type MetricEditorField = "detail" | "trend" | "value";

function normalizeData(data: DashboardData): DashboardData {
  return reconcileDashboardData({
    ...defaultDashboardData,
    ...data,
    chart: data.chart?.length ? data.chart : defaultDashboardData.chart,
    metrics: defaultDashboardData.metrics.map((metric, index) => ({
      ...metric,
      ...(data.metrics?.[index] ?? {}),
    })),
    topContent: defaultDashboardData.topContent.map((item, index) => ({
      ...item,
      ...(data.topContent?.[index] ?? {}),
    })),
  });
}

function chartToDraft(chart: number[]) {
  return chart.map((value) => String(value)).join(", ");
}

function parseChartDraft(draft: string, fallback: number[]) {
  const values = draft
    .split(/[\s,]+/)
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value >= 0);

  return values.length >= 2 ? values.slice(0, 40) : fallback;
}

export default function AccountAnalysisPage() {
  const [data, setData] = useState<DashboardData>(defaultDashboardData);
  const [chartDraft, setChartDraft] = useState(chartToDraft(defaultDashboardData.chart));
  const [channelUrl, setChannelUrl] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      try {
        const parsed = normalizeData(JSON.parse(stored) as DashboardData);
        setData(parsed);
        setChartDraft(chartToDraft(parsed.chart));
        setChannelUrl(parsed.sourceUrl ?? "");
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function saveDashboard(
    nextData = data,
    nextChartDraft = chartDraft,
    message = "Saved to dashboard.",
  ) {
    const chart = parseChartDraft(nextChartDraft, nextData.chart);
    const normalized = normalizeData({ ...nextData, chart });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent("studio-dashboard-data-updated", { detail: normalized }));
    setData(normalized);
    setChartDraft(chartToDraft(normalized.chart));
    setStatus(message);
  }

  async function analyzeChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!channelUrl.trim()) return;

    setStatus("Estimating channel...");
    try {
      const response = await fetch(`/api/channel?url=${encodeURIComponent(channelUrl.trim())}`);
      const payload = (await response.json()) as { data?: DashboardData; error?: string };
      const nextData = normalizeData(payload.data ?? makeMockDashboardData(channelUrl.trim()));
      saveDashboard(
        nextData,
        chartToDraft(nextData.chart),
        payload.error ? `${payload.error}. Estimated values saved.` : "Estimated values saved.",
      );
    } catch {
      const nextData = normalizeData(makeMockDashboardData(channelUrl.trim()));
      saveDashboard(nextData, chartToDraft(nextData.chart), "Estimator API unavailable. Local estimate saved.");
    }
  }

  function updateField(field: DashboardTextField, value: string) {
    setData((current) => ({ ...current, [field]: value }));
  }

  function updateMetric(index: number, field: MetricEditorField, value: string) {
    setData((current) => ({
      ...current,
      metrics: current.metrics.map((metric, metricIndex) =>
        metricIndex === index
          ? {
              ...metric,
              [field]:
                field === "trend"
                  ? (value as DashboardData["metrics"][number]["trend"])
                  : value,
            }
          : metric,
      ),
    }));
  }

  function updateTopContent(
    index: number,
    field: keyof DashboardData["topContent"][number],
    value: string,
  ) {
    setData((current) => ({
      ...current,
      topContent: current.topContent.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function resetDashboard() {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("studio-dashboard-data-updated", { detail: defaultDashboardData }));
    setData(defaultDashboardData);
    setChartDraft(chartToDraft(defaultDashboardData.chart));
    setChannelUrl("");
    setStatus("Dashboard reset.");
  }

  return (
    <main className="analysis-page">
      <div className="analysis-shell">
        <header className="analysis-head">
          <div>
            <p className="analysis-kicker">Hidden tool</p>
            <h1>Account analysis</h1>
          </div>
          <div className="analysis-actions">
            <button onClick={() => saveDashboard()} type="button">
              Save
            </button>
            <button onClick={resetDashboard} type="button">
              Reset
            </button>
            <Link href="/">Dashboard</Link>
          </div>
        </header>

        <section className="analysis-card url-card">
          <form onSubmit={analyzeChannel}>
            <label htmlFor="channel-url">YouTube channel URL</label>
            <div className="analysis-inline">
              <input
                id="channel-url"
                onChange={(event) => {
                  setChannelUrl(event.target.value);
                  updateField("sourceUrl", event.target.value);
                }}
                placeholder="https://www.youtube.com/@channel"
                type="url"
                value={channelUrl}
              />
              <button type="submit">Estimate</button>
            </div>
          </form>
          {status ? <p className="analysis-status">{status}</p> : null}
        </section>

        <div className="analysis-grid">
          <section className="analysis-card">
            <h2>Channel</h2>
            <div className="analysis-fields two-col">
              <label>
                Name
                <input
                  onChange={(event) => updateField("channelName", event.target.value)}
                  value={data.channelName}
                />
              </label>
              <label>
                Handle
                <input
                  onChange={(event) => updateField("channelHandle", event.target.value)}
                  value={data.channelHandle}
                />
              </label>
              <label>
                Avatar URL
                <input
                  onChange={(event) => updateField("avatarUrl", event.target.value)}
                  value={data.avatarUrl}
                />
              </label>
              <label>
                Source URL
                <input
                  onChange={(event) => updateField("sourceUrl", event.target.value)}
                  value={data.sourceUrl ?? ""}
                />
              </label>
            </div>
          </section>

          <section className="analysis-card">
            <h2>Overview</h2>
            <div className="analysis-fields two-col">
              <label>
                Headline views
                <input
                  onChange={(event) => updateField("headlineViews", event.target.value)}
                  value={data.headlineViews}
                />
              </label>
              <label>
                Subscribers gained
                <input
                  onChange={(event) => updateField("subscribers", event.target.value)}
                  value={data.subscribers}
                />
              </label>
              <label>
                Realtime views
                <input
                  onChange={(event) => updateField("realtimeViews", event.target.value)}
                  value={data.realtimeViews}
                />
              </label>
              <label>
                Realtime subscribers
                <input
                  onChange={(event) => updateField("realtimeSubscribers", event.target.value)}
                  value={data.realtimeSubscribers}
                />
              </label>
              <label>
                Date range
                <input
                  onChange={(event) => updateField("dateRange", event.target.value)}
                  value={data.dateRange}
                />
              </label>
              <label>
                Period label
                <input
                  onChange={(event) => updateField("periodLabel", event.target.value)}
                  value={data.periodLabel}
                />
              </label>
            </div>
          </section>
        </div>

        <section className="analysis-card">
          <h2>Metric cards</h2>
          <div className="metric-editor-grid">
            {data.metrics.map((metric, index) => (
              <fieldset className="metric-editor" key={metric.id}>
                <legend>{metric.label}</legend>
                <label>
                  Value
                  <input
                    onChange={(event) => updateMetric(index, "value", event.target.value)}
                    value={metric.value}
                  />
                </label>
                <label>
                  Detail
                  <input
                    onChange={(event) => updateMetric(index, "detail", event.target.value)}
                    value={metric.detail}
                  />
                </label>
                <label>
                  Trend
                  <select
                    onChange={(event) => updateMetric(index, "trend", event.target.value)}
                    value={metric.trend}
                  >
                    {trendOptions.map((trend) => (
                      <option key={trend} value={trend}>
                        {trend}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>
            ))}
          </div>
        </section>

        <section className="analysis-card">
          <h2>Chart</h2>
          <label className="chart-editor">
            Daily values
            <textarea
              onBlur={() => {
                const chart = parseChartDraft(chartDraft, data.chart);
                setData((current) => ({ ...current, chart }));
                setChartDraft(chartToDraft(chart));
              }}
              onChange={(event) => setChartDraft(event.target.value)}
              rows={3}
              value={chartDraft}
            />
          </label>
        </section>

        <section className="analysis-card">
          <h2>Top content</h2>
          <div className="top-content-editor">
            {data.topContent.map((item, index) => (
              <fieldset className="metric-editor" key={`${item.title}-${index}`}>
                <legend>Item {index + 1}</legend>
                <label>
                  Title
                  <input
                    onChange={(event) => updateTopContent(index, "title", event.target.value)}
                    value={item.title}
                  />
                </label>
                <label>
                  Views
                  <input
                    onChange={(event) => updateTopContent(index, "views", event.target.value)}
                    value={item.views}
                  />
                </label>
                <label>
                  Thumbnail
                  <input
                    onChange={(event) => updateTopContent(index, "thumbnail", event.target.value)}
                    value={item.thumbnail}
                  />
                </label>
              </fieldset>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
