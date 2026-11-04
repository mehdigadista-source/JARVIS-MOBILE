
export default async (request) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Méthode non autorisée" }),
      { status: 405 }
    );
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("Clé API Groq introuvable dans Netlify.");
    }

    const { messages } = await request.json();

    if (!Array.isArray(messages)) {
      return Response.json(
        { error: "Messages invalides." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "Tu es J.A.R.V.I.S, l'assistant intelligent de Monsieur. Tu réponds toujours en français, avec élégance, précision et politesse. Tu es spécialisé en technologie, informatique et automobile. Tu réponds de manière naturelle et utile."
            },
            ...messages.slice(-12)
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur Groq :", data);
      return Response.json(
        { error: "Le service IA a rencontré une erreur." },
        { status: response.status }
      );
    }

    return Response.json({
      reply: data.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Impossible de contacter J.A.R.V.I.S." },
      { status: 500 }
    );
  }
};
