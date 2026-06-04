import { NextRequest, NextResponse } from "next/server";

const allowedHosts = new Set([
  "i1.ytimg.com",
  "i2.ytimg.com",
  "i3.ytimg.com",
  "i4.ytimg.com",
  "i.ytimg.com",
  "img.youtube.com",
  "yt3.ggpht.com",
  "yt3.googleusercontent.com",
]);

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid image url" }, { status: 400 });
  }

  if (!allowedHosts.has(imageUrl.hostname)) {
    return NextResponse.json({ error: "Image host is not allowed" }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      },
    });
    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    if (!response.ok || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Image could not be loaded" }, { status: 502 });
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "cache-control": "public, max-age=3600, s-maxage=86400",
        "content-type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "Image could not be loaded" }, { status: 502 });
  }
}
