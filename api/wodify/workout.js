export default async function handler(req, res) {
  try {
    const apiKey = process.env.WODIFY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing Wodify API key" });
    }

    const today = new Date().toISOString().split("T")[0];

    const wodifyUrl = `https://app.wodify.com/API/Service.svc/GetDailyWorkouts?date=${today}`;

    const response = await fetch(wodifyUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "APIKey": apiKey,
      },
    });

    const data = await response.json();

    res.status(200).json({
      date: today,
      workouts: data,
    });
  } catch (e) {
    res.status(500).json({ error: "Proxy error", details: e.message });
  }
}
