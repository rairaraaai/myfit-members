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

  const { code } = body || {};
  if (!code) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const normalizedCode = String(code).toUpperCase();

  const membersStore = getStore("members");
  const member = await membersStore.get(normalizedCode, { type: "json" });
  if (!member || !member.active) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const logsStore = getStore("watch-logs");
  const { blobs } = await logsStore.list();
  const records: any[] = [];
  for (const b of blobs) {
    const data = await logsStore.get(b.key, { type: "json" });
    if (data && data.code === normalizedCode) {
      records.push({ videoId: data.videoId, title: data.title, timestamp: data.timestamp });
    }
  }

  return new Response(JSON.stringify(records), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/my-logs",
};
