// api/wodify/workout.js
// TEMP DEBUG VERSION – just show us what Wodify is sending.

export default async function handler(req, res) {
  try {
    const apiKey = process.env.WODIFY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing Wodify API key" });
    }

    const LOCATION = "Neighborhood Gym";
    const PROGRAM = "NBHD METCON";

    const today = new Date();
    const date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const url = `https://api.wodify.com/v1/workouts/formattedworkout?date=${encodeURIComponent(
      date
    )}&location=${encodeURIComponent(LOCATION)}&program=${encodeURIComponent(
      PROGRAM
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    const raw = await response.text();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({
        error: "Wodify did not return JSON",
        preview: raw.slice(0, 400),
      });
    }

    // For now, just return what Wodify gave us so we can inspect it
    return res.status(200).json({
      date,
      location: LOCATION,
      program: PROGRAM,
      raw: parsed
    });
  } catch (e) {
    return res.status(500).json({
      error: "Proxy error",
      details: e.message || String(e),
    });
  }
}
