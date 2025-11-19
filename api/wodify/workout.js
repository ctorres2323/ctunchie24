// api/wodify/workout.js

export default async function handler(req, res) {
  try {
    const apiKey = process.env.WODIFY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing Wodify API key" });
    }

    // TODO: update these to match your exact Wodify values
    const LOCATION = "YOUR_LOCATION_NAME"; // e.g. "Neighborhood Gym"
    const PROGRAM = "YOUR_PROGRAM_NAME";   // e.g. "CrossFit" or "MetCon"

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

    // Try to parse JSON, but don't crash if it fails
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({
        error: "Wodify did not return JSON",
        preview: raw.slice(0, 400),
      });
    }

    // If we actually get JSON, return it so we can inspect and use it
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
