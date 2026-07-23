import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const adminKey = Netlify.env.get("ADMIN_KEY");

  if (!adminKey || key !== adminKey) {
    return new Response("Unauthorized", { status: 401 });
  }

  const store = getStore("watch-logs");
  const { blobs } = await store.list();

  const records: any[] = [];
  for (const b of blobs) {
    const data = await store.get(b.key, { type: "json" });
    if (data) records.push(data);
  }

  records.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return new Response(JSON.stringify(records), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/admin-data",
};
