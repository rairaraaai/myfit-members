import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字(0,O,1,I)は除外
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const adminKey = Netlify.env.get("ADMIN_KEY");
  const providedKey = url.searchParams.get("key") || req.headers.get("x-admin-key");

  if (!adminKey || providedKey !== adminKey) {
    return new Response("Unauthorized", { status: 401 });
  }

  const store = getStore("members");

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const members: any[] = [];
    for (const b of blobs) {
      const data = await store.get(b.key, { type: "json" });
      if (data) members.push({ code: b.key, ...data });
    }
    members.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return new Response(JSON.stringify(members), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { name } = body || {};
    if (!name) return new Response("Missing name", { status: 400 });

    let code = genCode();
    for (let i = 0; i < 3; i++) {
      const existing = await store.get(code);
      if (!existing) break;
      code = genCode();
    }

    await store.setJSON(code, {
      name: String(name).slice(0, 50),
      active: true,
      createdAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ code, name }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "PATCH") {
    const body = await req.json();
    const { code, active } = body || {};
    if (!code) return new Response("Missing code", { status: 400 });
    const existing = await store.get(code, { type: "json" });
    if (!existing) return new Response("Not found", { status: 404 });
    existing.active = !!active;
    await store.setJSON(code, existing);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    const body = await req.json();
    const { code } = body || {};
    if (!code) return new Response("Missing code", { status: 400 });
    await store.delete(code);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/members",
};
