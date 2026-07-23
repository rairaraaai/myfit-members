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
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore("members");
  const data = await store.get(String(code).toUpperCase(), { type: "json" });

  if (!data || !data.active) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, name: data.name }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/check-code",
};
