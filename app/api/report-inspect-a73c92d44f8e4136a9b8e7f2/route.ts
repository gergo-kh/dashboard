const TARGET = "https://shspxmmdzuxbwxqdugoa.supabase.co/functions/v1/report-write-cb91f6e74d1f4f8f9a2d3c6e";

export async function GET() {
  try {
    const response = await fetch(TARGET, { cache: "no-store" });
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" }
    });
  } catch (error) {
    console.error("temporary report writer proxy failed", error);
    return Response.json({ error: "proxy_failed" }, { status: 500 });
  }
}
