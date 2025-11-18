export default async function handler(req, res) {
  try {
    const apiKey = process.env.WODIFY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing Wodify API key" });
    }

    const today = new Date().toISOString().split("T")[0];

    // NOTE: This URL is our current guess. Wodify might require a different endpoint.
    const wodifyUrl = `https://app.wodify.com/API/Service.svc/GetDailyWorkouts?date=${today}`;

    const response = await fetch(wodifyUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        APIKey: apiKey
      }
    });

    // Read as text first – don't assume JSON
    const raw = await response.text();

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      // not JSON, probably HTML
    }

    if (!response.ok) {
      return res.status(500).json({
        error: "Wodify returned a non-200 status",
        status: response.status,
        preview: raw.slice(0, 400)
      });
    }

    if (!parsed || typeof parsed !== "object") {
      return res.status(500).json({
        error: "Wodify did not return JSON",
        preview: raw.slice(0, 400)
      });
    }

    // If we actually get JSON, return it so we can inspect
    return res.status(200).json({
      date: today,
      raw: parsed
    });
  } catch (e) {
    return res.status(500).json({
      error: "Proxy error",
      details: e.message || String(e)
    });
  }
}
