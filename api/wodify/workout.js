// api/wodify/workout.js

export default async function handler(req, res) {
  try {
    const apiKey = process.env.WODIFY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing Wodify API key" });
    }

    // Exact names from your Wodify account
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

    // Try to parse JSON; if it isn't JSON, show a preview so we can debug
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({
        error: "Wodify did not return JSON",
        preview: raw.slice(0, 400),
      });
    }

    // If we actually get JSON, return it
    return res.status(200).json({
      date,
      location: LOCATION,
      program: PROGRAM,
      data: parsed,
    });
  } catch (e) {
    return res.status(500).json({
      error: "Proxy error",
      details: e.message || String(e),
    });
  }
}
