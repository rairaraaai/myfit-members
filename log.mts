import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { name, videoId, title } = body || {};
  if (!name || !videoId) {
    return new Response("Missing fields", { status: 400 });
  }

  const store = getStore("watch-logs");
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await store.setJSON(key, {
    name: String(name).slice(0, 50),
    videoId: String(videoId),
    title: title ? String(title).slice(0, 100) : "",
    timestamp: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/log",
};
