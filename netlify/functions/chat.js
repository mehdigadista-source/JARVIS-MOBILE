
export default async (request) => {
    // Autoriser uniquement les requêtes POST
    if (request.method !== "POST") {
        return Response.json(
            { error: "Méthode non autorisée." },
            { status: 405 }
        );
    }

    try {
        // Récupération de la clé API depuis Netlify
        const apiKey = Netlify.env.get("GROQ_API_KEY");

        console.log(
            "GROQ_API_KEY présente :",
            Boolean(apiKey)
        );

        if (!apiKey) {
            return Response.json(
                { error: "Clé API Groq introuvable dans Netlify." },
                { status: 500 }
            );
        }

        // Lecture des messages
        const body = await request.json();
        const messages = body.messages;

        if (!Array.isArray(messages)) {
            return Response.json(
                { error: "Format des messages invalide." },
                { status: 400 }
            );
        }

        // Vérification des messages
        const messagesValides = messages
            .filter(message =>
                message &&
                ["user", "assistant"].includes(message.role) &&
                typeof message.content === "string"
            )
            .slice(-12);

        if (messagesValides.length === 0) {
            return Response.json(
                { error: "Aucun message valide." },
                { status: 400 }
            );
        }

        // Appel à Groq
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
                            content: `
Tu es J.A.R.V.I.S, l'assistant personnel de Monsieur.

Tu réponds toujours en français.
Tu es poli, intelligent, précis et naturel.
Tu appelles ton utilisateur Monsieur.
Tu aides en informatique, technologie,
automobile, sciences et culture générale.

Tu évites les réponses inutilement longues.
                            `
                        },
                        ...messagesValides
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                })
            }
        );

        const donnees = await reponse.json();

        // Gestion des erreurs Groq
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
            throw new Error("Groq n'a renvoyé aucune réponse.");
        }

        return Response.json({
            reply: texte
        });

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
