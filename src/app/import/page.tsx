"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { DashboardData, makeMockDashboardData } from "@/lib/dashboard-data";
import { studioImageSrc } from "@/lib/image-src";

const STORAGE_KEY = "studio-dashboard-data";

export default function ImportPage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<DashboardData | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Importing...");

    try {
      const response = await fetch(`/api/channel?url=${encodeURIComponent(url)}`);
      const payload = (await response.json()) as { data?: DashboardData; error?: string };
      const data = payload.data ?? makeMockDashboardData(url);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setPreview(data);
      setStatus(payload.error ? `${payload.error}. Mock data saved.` : "Dashboard data saved.");
    } catch {
      const data = makeMockDashboardData(url);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setPreview(data);
      setStatus("Could not reach the importer API. Mock data saved.");
    }
  }

  return (
    <main className="import-page">
      <section className="import-panel">
        <p className="import-kicker">Hidden mockup tool</p>
        <h1>Import a YouTube channel</h1>
        <form onSubmit={onSubmit}>
          <label htmlFor="channel-url">YouTube channel URL</label>
          <input
            id="channel-url"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/@channel"
            required
            type="url"
            value={url}
          />
          <button type="submit">Populate dashboard</button>
        </form>
        {status ? <p className="import-status">{status}</p> : null}
        {preview ? (
          <div className="import-preview">
            <img alt="" src={studioImageSrc(preview.avatarUrl)} />
            <span>
              <strong>{preview.channelName}</strong>
              <small>{preview.sourceUrl}</small>
            </span>
          </div>
        ) : null}
        <Link className="return-link" href="/">
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
