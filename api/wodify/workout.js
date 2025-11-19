export default async function handler(req, res) {
  // 1. ALLOW CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // ==================================================
    // 2. CONFIGURATION
    // ==================================================
    
    const WODIFY_API_KEY = 'b7TZjvVAv78lKNS9mKzmH4mZ2cAOhHAranrLCNxS'; 
    
    // We try the standard name first. 
    // If this still fails, we will try "Neighborhood Gym OC" next.
    const LOCATION_NAME = 'Neighborhood Gym'; 

    // ==================================================
    // 3. DATE HANDLING (FORCE CALIFORNIA TIME)
    // ==================================================
    // This fixes the "404" error caused by the server thinking it's tomorrow
    const date = new Date().toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Convert MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = date.split('/');
    const dateStr = `${year}-${month}-${day}`;

    // ==================================================
    // 4. FETCH FROM WODIFY
    // ==================================================
    const encodedLocation = encodeURIComponent(LOCATION_NAME);
    const wodifyUrl = `https://app.wodify.com/API/WODs_v1.aspx?apiKey=${WODIFY_API_KEY}&date=${dateStr}&location=${encodedLocation}&type=json`;
    
    const response = await fetch(wodifyUrl);
    
    if (!response.ok) {
      // Detailed error to help us debug if "Neighborhood Gym" is the wrong name
      throw new Error(`Wodify 404. Tried fetching for date: ${dateStr} at Location: ${LOCATION_NAME}`);
    }

    const rawData = await response.json();

    // ==================================================
    // 5. PARSE DATA
    // ==================================================
    const wodList = rawData.RecordList?.APIWod;
    
    if (!wodList || wodList.length === 0) {
      return res.status(200).json({
        status: "rest_day",
        date: dateStr,
        program: "Rest Day",
        strength: { name: "Recovery", text: "No programmed workout found for today." },
        metcon: { name: "Active Recovery", text: "Go for a run or mobilize." },
        coach_notes: { text: "Check the Wodify app for full schedule." }
      });
    }

    const mainWod = wodList[0]; 
    const components = mainWod.Components?.Component || [];
    const strengthComp = components[0] || {};
    const metconComp = components[1] || {};

    const cleanData = {
      status: "success",
      date: dateStr,
      program: mainWod.Program?.Name || "Daily WOD",
      strength: {
        name: strengthComp.Name || "Strength",
        text: strengthComp.Description || "See Wodify for details."
      },
      metcon: {
        name: metconComp.Name || "Metcon",
        text: metconComp.Description || "See Wodify for details."
      },
      coach_notes: {
        text: mainWod.Comment || "Train hard. Live well."
      }
    };

    res.status(200).json(cleanData);

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Failed to fetch WOD", details: error.message });
  }
}
