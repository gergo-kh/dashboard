const TARGET = "https://shspxmmdzuxbwxqdugoa.supabase.co/functions/v1/report-inspect-a73c92d44f8e4136a9b8e7f2";

export async function GET() {
  try {
    const response = await fetch(TARGET, { cache: "no-store" });
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" }
    });
  } catch (error) {
    console.error("temporary report inspect proxy failed", error);
    return Response.json({ error: "proxy_failed" }, { status: 500 });
  }
}
