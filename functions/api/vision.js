
export async function onRequestPost({ request, env }) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });

  if (!env.GROQ_API_KEY) {
    return json({
      error: "La clé GROQ_API_KEY est absente des variables Cloudflare."
    }, 500);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Corps JSON invalide." }, 400);
  }

  const image = body?.image;
  const question =
    typeof body?.question === "string" && body.question.trim()
      ? body.question.trim().slice(0, 1500)
      : "Décris les éléments visibles dans cette image.";

  if (typeof image !== "string" || image.length > 12000000) {
    return json({ error: "Image absente ou trop volumineuse." }, 400);
  }

  const match = image.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
  );

  if (!match) {
    return json({ error: "Format image non accepté." }, 400);
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: question
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }],
          temperature: 0.2,
          max_completion_tokens: 700
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json({
        error: data?.error?.message ||
          `Erreur Groq : HTTP ${response.status}`
      }, 502);
    }

    const resultat = data?.choices?.[0]?.message?.content;

    if (typeof resultat !== "string" || !resultat.trim()) {
      return json({
        error: "Aucune analyse reçue."
      }, 502);
    }

    return json({
      response: resultat.trim()
    });

  } catch (error) {
    return json({
      error: error?.message || "Erreur du service visuel."
    }, 502);
  }
}
