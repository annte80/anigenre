import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_PASSWORD = Deno.env.get("ANIGENRE_ADMIN_PASSWORD") ?? "";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyPassword(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  return token === ADMIN_PASSWORD;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!ADMIN_PASSWORD) {
      return jsonResponse({ error: "Admin password not configured" }, 500);
    }

    if (!(await verifyPassword(req))) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/anigenre-admin", "");

    // GET /entities — list all
    if (req.method === "GET" && path === "/entities") {
      const { data, error } = await supabase
        .from("anigenre_entities")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data });
    }

    // GET /values?field=genre — distinct values for a category
    if (req.method === "GET" && path === "/values") {
      const field = url.searchParams.get("field");
      const allowed = ["genre", "type", "anime", "format", "studio", "demographic"];
      if (!field || !allowed.includes(field)) {
        return jsonResponse({ error: "Invalid field" }, 400);
      }
      const { data, error } = await supabase
        .from("anigenre_entities")
        .select(field);
      if (error) return jsonResponse({ error: error.message }, 500);
      const distinct = [...new Set((data ?? []).map((r: Record<string, string>) => r[field]).filter(Boolean))];
      distinct.sort();
      return jsonResponse({ data: distinct });
    }

    // POST /entities — create
    if (req.method === "POST" && path === "/entities") {
      const body = await req.json();
      const { name, aliases, genre, type, anime, format, studio, demographic } = body;
      if (!name || !genre || !type || !anime || !format || !studio || !demographic) {
        return jsonResponse({ error: "Missing required fields" }, 400);
      }
      // Assign shuffle_rank: max + 1 with slight randomization
      const { data: maxRow } = await supabase
        .from("anigenre_entities")
        .select("shuffle_rank")
        .order("shuffle_rank", { ascending: false })
        .limit(1)
        .maybeSingle();
      const baseRank = maxRow ? maxRow.shuffle_rank : -1;
      const shuffleRank = baseRank + 1 + Math.floor(Math.random() * 3);
      const { data, error } = await supabase
        .from("anigenre_entities")
        .insert({
          name,
          aliases: aliases ?? "",
          genre,
          type,
          anime,
          format,
          studio,
          demographic,
          shuffle_rank: shuffleRank,
        })
        .select()
        .single();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data });
    }

    // PUT /entities/:id — update
    if (req.method === "PUT" && path.startsWith("/entities/")) {
      const id = path.split("/")[2];
      const body = await req.json();
      const { name, aliases, genre, type, anime, format, studio, demographic } = body;
      const { data, error } = await supabase
        .from("anigenre_entities")
        .update({ name, aliases, genre, type, anime, format, studio, demographic })
        .eq("id", id)
        .select()
        .single();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data });
    }

    // DELETE /entities/:id — delete
    if (req.method === "DELETE" && path.startsWith("/entities/")) {
      const id = path.split("/")[2];
      const { error } = await supabase
        .from("anigenre_entities")
        .delete()
        .eq("id", id);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    // POST /renumber — re-number shuffle_rank to be dense 0..N-1
    if (req.method === "POST" && path === "/renumber") {
      const { data, error } = await supabase
        .from("anigenre_entities")
        .select("id, shuffle_rank")
        .order("shuffle_rank", { ascending: true });
      if (error) return jsonResponse({ error: error.message }, 500);
      const rows = data ?? [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].shuffle_rank !== i) {
          await supabase
            .from("anigenre_entities")
            .update({ shuffle_rank: i })
            .eq("id", rows[i].id);
        }
      }
      return jsonResponse({ success: true, count: rows.length });
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});
