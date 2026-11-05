
export async function onRequestGet({ env }) {
    const url = env.SUPABASE_URL;
    const key = env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        return Response.json(
            { error: "Configuration Supabase manquante." },
            { status: 500 }
        );
    }

    return Response.json(
        { url, key },
        {
            headers: {
                "Cache-Control": "no-store"
            }
        }
    );
}
