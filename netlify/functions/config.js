export default async (request) => {
    if (request.method !== "GET") {
        return new Response(
            JSON.stringify({
                error: "Méthode non autorisée."
            }),
            {
                status: 405,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            }
        );
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        return new Response(
            JSON.stringify({
                error: "Configuration Supabase manquante."
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            }
        );
    }

    return new Response(
        JSON.stringify({
            url: url,
            key: key
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            }
        }
    );
};
