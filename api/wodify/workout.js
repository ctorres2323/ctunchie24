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

    // Build today as YYYY-MM-DD (Wodify format)
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

    // Try to parse JSON from Wodify
    let wod;
    try {
      wod = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({
        error: "Wodify did not return JSON",
        preview: raw.slice(0, 400),
      });
    }

    // Some installs may have wrapped data; handle both shapes
    const wodData = wod.data || wod || {};
    const components = Array.isArray(wodData.Components)
      ? wodData.Components
      : [];

    const stripHtml = (html = "") =>
      html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    // Try to find logical sections
    const strengthComp =
      components.find(
        (c) =>
          c.ComponentTypeName === "Weightlifting" ||
          /strength/i.test(c.Name || "")
      ) || null;

    const metconComp =
      components.find(
        (c) =>
          c.ComponentTypeName === "Metcon" &&
          !(strengthComp && c === strengthComp)
      ) || null;

    const extras = components.filter(
      (c) => c !== strengthComp && c !== metconComp
    );

    const coachNotes =
      typeof wodData.CoachNotes === "string" &&
      wodData.CoachNotes.trim().length
        ? wodData.CoachNotes.trim()
        : null;

    const result = {
      date,
      location: LOCATION,
      program: PROGRAM,
      title: wodData.Name || null,

      strength: strengthComp
        ? {
            name: strengthComp.Name || "Strength",
            html: strengthComp.Description || "",
            text: stripHtml(strengthComp.Description || ""),
          }
        : null,

      metcon: metconComp
        ? {
            name: metconComp.Name || "Metcon",
            html: metconComp.Description || "",
            text: stripHtml(metconComp.Description || ""),
          }
        : null,

      extras: extras.map((c) => ({
        type: c.ComponentTypeName || null,
        name: c.Name || null,
        html: c.Description || "",
        text: stripHtml(c.Description || ""),
      })),

      coach_notes: coachNotes,
    };

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({
      error: "Proxy error",
      details: e.message || String(e),
    });
  }
}
