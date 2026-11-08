function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.HA_TOKEN) {
      return json({ error: "Jeton Home Assistant manquant." }, 500);
    }

    const body = await request.json();
    const action = body.action;

    const services = {
      volume: {
        domain: "media_player",
        service: "volume_set"
      },
      play: {
        domain: "media_player",
        service: "media_play"
      },
      pause: {
        domain: "media_player",
        service: "media_pause"
      },
      stop: {
        domain: "media_player",
        service: "media_stop"
      }
    };

    const entity = "media_player.chambre";

    let domain;
    let service;
    let data = { entity_id: entity };

    if (action === "volume") {
      const volume = Number(body.volume);

      if (!Number.isFinite(volume) || volume < 0 || volume > 100) {
        return json({ error: "Volume invalide." }, 400);
      }

      domain = "media_player";
      service = "volume_set";
      data.volume_level = volume / 100;

    } else if (services[action]) {
      domain = services[action].domain;
      service = services[action].service;

    } else if (action === "announce") {
      const message = String(body.message || "").trim();

      if (!message || message.length > 300) {
        return json({ error: "Annonce invalide." }, 400);
      }

      domain = "tts";
      service = "speak";
      data = {
        entity_id: "tts.google_translate_en_com",
        media_player_entity_id: entity,
        message
      };

    } else {
      return json({ error: "Commande non autorisée." }, 400);
    }

    const response = await fetch(
      "http://homeassistant.local:8123/api/services/" +
      domain + "/" + service,
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.HA_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      }
    );

    const result = await response.text();

    if (!response.ok) {
      return json({
        error: "Home Assistant a refusé la commande.",
        details: result.slice(0, 500)
      }, response.status);
    }

    return json({ success: true, action });

  } catch (error) {
    return json({ error: "Erreur interne : " + error.message }, 500);
  }
}
