import { NextRequest, NextResponse } from "next/server";
import {
  type DashboardData,
  type TopContent,
  buildEstimatedDashboardData,
  defaultDashboardData,
  makeMockDashboardData,
} from "@/lib/dashboard-data";

type YouTubeChannelItem = {
  id: string;
  snippet?: {
    title?: string;
    customUrl?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
};

type PublicChannelMetadata = {
  avatarUrl?: string;
  channelId?: string;
  channelName?: string;
  topContent?: TopContent[];
};

function parseYouTubeUrl(input: string) {
  const parsed = new URL(input);
  const parts = parsed.pathname.split("/").filter(Boolean);
  const channelIndex = parts.indexOf("channel");
  if (channelIndex >= 0 && parts[channelIndex + 1]) {
    return { channelId: parts[channelIndex + 1], handle: null };
  }

  const handle = parts.find((part) => part.startsWith("@"));
  if (handle) return { channelId: null, handle };

  return { channelId: null, handle: parts[0] ? `@${parts[0]}` : null };
}

function decodeEntity(value: string) {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function firstMatch(source: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) return decodeEntity(match[1].replaceAll("\\/", "/"));
  }
  return undefined;
}

function parseRecentVideos(feedXml: string): TopContent[] {
  return [...feedXml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 3).map((entry, index) => {
    const xml = entry[1];
    const title =
      firstMatch(xml, [/<media:title>([\s\S]*?)<\/media:title>/, /<title>([\s\S]*?)<\/title>/]) ??
      `Recent video ${index + 1}`;
    const thumbnail =
      firstMatch(xml, [/<media:thumbnail[^>]*url="([^"]+)"/]) ??
      defaultDashboardData.topContent[index]?.thumbnail ??
      defaultDashboardData.topContent[0].thumbnail;
    const views = Number(firstMatch(xml, [/<media:statistics[^>]*views="([^"]+)"/]) ?? 0);

    return {
      thumbnail,
      title,
      views: views ? views.toLocaleString("en-US") : defaultDashboardData.topContent[index]?.views ?? "0",
    };
  });
}

async function fetchRecentVideos(channelId?: string) {
  if (!channelId) return undefined;

  try {
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return undefined;
    const videos = parseRecentVideos(await response.text());
    return videos.length ? videos : undefined;
  } catch {
    return undefined;
  }
}

async function fetchPublicChannelMetadata(sourceUrl: string): Promise<PublicChannelMetadata> {
  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      },
    });
    if (!response.ok) return {};

    const html = await response.text();
    const channelId = firstMatch(html, [
      /https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=([^"\\]+)/,
      /"externalId":"([^"]+)"/,
      /"browseId":"(UC[^"]+)"/,
      /"channelId":"(UC[^"]+)"/,
    ]);
    const channelName = firstMatch(html, [
      /<meta property="og:title" content="([^"]+)"/,
      /<title>([^<]+) - YouTube<\/title>/,
    ]);
    const avatarUrl = firstMatch(html, [
      /<meta property="og:image" content="([^"]+)"/,
      /"avatar"[\s\S]*?"url":"([^"]+)"/,
      /"(https:\/\/yt3\.googleusercontent\.com\/[^"]+)"/,
      /"(https:\/\/yt3\.ggpht\.com\/[^"]+)"/,
    ]);

    return {
      avatarUrl,
      channelId,
      channelName,
      topContent: await fetchRecentVideos(channelId),
    };
  } catch {
    return {};
  }
}

function buildDashboardFromChannel(item: YouTubeChannelItem, sourceUrl: string): DashboardData {
  const avatar =
    item.snippet?.thumbnails?.high?.url ??
    item.snippet?.thumbnails?.medium?.url ??
    item.snippet?.thumbnails?.default?.url ??
    defaultDashboardData.avatarUrl;

  return buildEstimatedDashboardData({
    avatarUrl: avatar,
    channelHandle: item.snippet?.customUrl,
    channelName: item.snippet?.title,
    sourceUrl,
    subscriberCount: Number(item.statistics?.subscriberCount ?? 0),
    totalViews: Number(item.statistics?.viewCount ?? 0),
    videoCount: Number(item.statistics?.videoCount ?? 0),
  });
}

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get("url");
  if (!sourceUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    const metadata = await fetchPublicChannelMetadata(sourceUrl);
    return NextResponse.json({
      data: metadata.channelName
        ? buildEstimatedDashboardData({
            avatarUrl: metadata.avatarUrl,
            channelName: metadata.channelName,
            sourceUrl,
            topContent: metadata.topContent,
          })
        : makeMockDashboardData(sourceUrl),
      error: "YOUTUBE_API_KEY is not configured",
    });
  }

  try {
    const target = parseYouTubeUrl(sourceUrl);
    const params = new URLSearchParams({
      key: apiKey,
      part: "snippet,statistics",
      maxResults: "1",
    });
    if (target.channelId) params.set("id", target.channelId);
    if (target.handle) params.set("forHandle", target.handle);

    const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`, {
      next: { revalidate: 3600 },
    });
    const payload = (await response.json()) as { items?: YouTubeChannelItem[]; error?: unknown };

    if (!response.ok || !payload.items?.length) {
      return NextResponse.json({
        data: makeMockDashboardData(sourceUrl),
        error: "No public channel data found",
      });
    }

    const data = buildDashboardFromChannel(payload.items[0], sourceUrl);
    const metadata = await fetchPublicChannelMetadata(sourceUrl);
    return NextResponse.json({
      data: {
        ...data,
        topContent: metadata.topContent ?? data.topContent,
      },
    });
  } catch {
    return NextResponse.json({
      data: makeMockDashboardData(sourceUrl),
      error: "Could not parse or fetch this YouTube channel",
    });
  }
}
