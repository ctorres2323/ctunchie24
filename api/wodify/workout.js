// api/wodify/workout.js
// Clean NBHD → Wodify proxy that returns a simple, structured workout object.
// With CORS enabled so Shopify storefront JS can call it.

export default async function handler(req, res) {
  const LOCATION = "Neighborhood Gym";
  const PROGRAM = "NBHD METCON";

  // Basic CORS for GET/OPTIONS
  const setCors = () => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  };

  if (req.method === "OPTIONS") {
    setCors();
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.WODIFY_API_KEY;
    if (!apiKey) {
      setCors();
      return res.status(500).json({ error: "Missing Wodify API key" });
    }

    // Build today as YYYY-MM-DD (Wodify format)
    const today = new Date();
    const date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    const url = `https://api.wodify.com/v1/workouts/formattedworkout?date=${encodeURIComponent(
      date
    )}&location=${encodeURIComponent(LOCATION)}&program=${encodeURIComponent(
      PROGRAM
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey
      }
    });

    const rawText = await response.text();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      setCors();
      return res.status(500).json({
        error: "Wodify did not return JSON",
        preview: rawText.slice(0, 400)
      });
    }

    const apiWod = parsed.APIWod || parsed;

    if (!apiWod || typeof apiWod !== "object") {
      setCors();
      return res.status(500).json({
        error: "Unexpected Wodify shape",
        preview: JSON.stringify(parsed).slice(0, 400)
      });
    }

    const header = apiWod.WodHeader || {};
    const formattedHtml = apiWod.FormattedWOD || "";
    const compsRaw = Array.isArray(apiWod.Components) ? apiWod.Components : [];

    // Flatten components (each entry has a .Component object)
    const flatComponents = compsRaw.map((c) => c.Component || c);

    const stripHtml = (html = "") =>
      html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    // Walk components in order: track current "section" (Strength / Metcon / Accessory)
    let currentSection = null;
    const sections = [];
    let coachNotes = null;

    flatComponents.forEach((comp) => {
      const type = comp.ComponentTypeName || "";
      const name = (comp.Name || "").trim();
      const desc = comp.Description || "";
      const repScheme = comp.RepScheme || "";
      const comments = comp.Comments || "";

      // Section markers (Strength / Metcon / Accessory)
      if (type === "Section") {
        currentSection = name || currentSection;
        return;
      }

      const sectionLabel = currentSection || type || null;

      const entry = {
        section: sectionLabel,
        type: type || null,
        name: name || null,
        rep_scheme: repScheme || null,
        html: desc || "",
        text: stripHtml(desc || "")
      };

      sections.push(entry);

      // Use first non-empty comments as coach notes if we don't already have one
      if (!coachNotes && comments && comments.trim().length) {
        coachNotes = comments;
      }
    });

    const findFirst = (matcher) => sections.find(matcher) || null;

    const strength = findFirst(
      (s) =>
        /strength/i.test(s.section || "") ||
        /strength/i.test(s.name || "") ||
        s.type === "Weightlifting"
    );

    const metcon = findFirst(
      (s) =>
        /metcon/i.test(s.section || "") ||
        /metcon/i.test(s.name || "") ||
        s.type === "Metcon"
    );

    const accessories = sections.filter(
      (s) =>
        s !== strength &&
        s !== metcon &&
        (/access/i.test(s.section || "") || /access/i.test(s.name || ""))
    );

    const result = {
      date,
      location: LOCATION,
      program: PROGRAM,
      title: header.Name || null,
      strength: strength,
      metcon: metcon,
      accessories: accessories,
      coach_notes: coachNotes
        ? {
            html: coachNotes,
            text: stripHtml(coachNotes)
          }
        : null,
      formatted_html: formattedHtml || null
    };

    setCors();
    return res.status(200).json(result);
  } catch (e) {
    setCors();
    return res.status(500).json({
      error: "Proxy error",
      details: e.message || String(e)
    });
  }
}
