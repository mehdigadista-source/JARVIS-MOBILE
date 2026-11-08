
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.JARVIS_GATEWAY_URL || !env.JARVIS_GATEWAY_TOKEN) {
    return Response.json(
      { error: "Configuration JARVIS manquante" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const allowedActions = ["play", "pause", "stop", "volume", "announce"];

    if (!allowedActions.includes(body.action)) {
      return Response.json({ error: "Action non autorisée" }, { status: 400 });
    }

    if (body.action === "volume") {
      const volume = Number(body.volume);
      if (!Number.isFinite(volume) || volume < 0 || volume > 100) {
        return Response.json({ error: "Volume invalide" }, { status: 400 });
      }
    }

    if (body.action === "announce") {
      if (
        typeof body.message !== "string" ||
        !body.message.trim() ||
        body.message.length > 300
      ) {
        return Response.json({ error: "Message invalide" }, { status: 400 });
      }
    }

    const gatewayUrl = env.JARVIS_GATEWAY_URL.replace(/\/+$/, "");

    const response = await fetch(`${gatewayUrl}/command`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.JARVIS_GATEWAY_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const result = await response.json().catch(() => ({}));

    return Response.json(result, { status: response.status });

  } catch (error) {
    return Response.json(
      { error: "Impossible de contacter la passerelle JARVIS" },
      { status: 502 }
    );
  }
}
