
export default async (request) => {
    if (request.method !== "POST") {
        return Response.json(
            { error: "Méthode non autorisée." },
            { status: 405 }
        );
    }

    try {
        const apiKey = Netlify.env.get("GROQ_API_KEY");

        if (!apiKey) {
            return Response.json(
                { error: "Clé API Groq introuvable." },
                { status: 500 }
            );
        }

        const body = await request.json();
        const messages = body.messages;

        if (!Array.isArray(messages)) {
            return Response.json(
                { error: "Format des messages invalide." },
                { status: 400 }
            );
        }

        const messagesValides = messages
            .filter(message =>
                message &&
                ["user", "assistant"].includes(message.role) &&
                typeof message.content === "string"
            )
            .slice(-10);

        if (messagesValides.length === 0) {
            return Response.json(
                { error: "Aucun message valide." },
                { status: 400 }
            );
        }

        const systemPrompt = `
Tu es J.A.R.V.I.S, l'assistant personnel de Monsieur.

Tu réponds toujours en français.
Tu es poli, intelligent, précis et naturel.
Tu appelles ton utilisateur Monsieur.
Tu aides en informatique, technologie,
automobile, sciences et culture générale.

Tu privilégies les réponses directes et fluides.
Tu évites les répétitions et les introductions inutiles.
Tu adaptes la longueur de tes réponses à la question.
Tu ne prétends jamais avoir effectué une action
si tu ne l'as pas réellement effectuée.
        `;

        const reponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-20b",
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        ...messagesValides
                    ],
                    temperature: 0.6,
                    max_tokens: 700,
                    stream: false
                })
            }
        );

        const donnees = await reponse.json();

        if (!reponse.ok) {
            console.error("Erreur Groq :", donnees);

            return Response.json(
                {
                    error: "Erreur du service Groq.",
                    details: donnees.error?.message || "Erreur inconnue."
                },
                { status: reponse.status }
            );
        }

        const texte = donnees.choices?.[0]?.message?.content;

        if (!texte) {
            throw new Error("Aucune réponse reçue de Groq.");
        }

        return Response.json(
            {
                reply: texte,
                usage: donnees.usage || null
            },
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            }
        );

    } catch (erreur) {
        console.error("Erreur JARVIS :", erreur);

        return Response.json(
            {
                error: "Impossible de contacter J.A.R.V.I.S.",
                details: erreur.message
            },
            { status: 500 }
        );
    }
};
