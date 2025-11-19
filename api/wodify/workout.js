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
    
    // ✅ FIXED: API Key is now a proper string here
    const WODIFY_API_KEY = 'b7TZjvVAv78lKNS9mKzmH4mZ2cAOhHAranrLCNxS'; 
    
    const today = new Date();
    // Ensure we get the date in YYYY-MM-DD format based on local time or UTC as needed
    // (Using simple ISO split for now)
    const dateStr = today.toISOString().split('T')[0]; 

    // ==================================================
    // 3. FETCH FROM WODIFY
    // ==================================================
    // ✅ FIXED: Now it correctly references the variable above
    const wodifyUrl = `https://app.wodify.com/API/WODs_v1.aspx?apiKey=${WODIFY_API_KEY}&date=${dateStr}&type=json`;
    
    const response = await fetch(wodifyUrl);
    
    if (!response.ok) {
      throw new Error(`Wodify API returned status: ${response.status}`);
    }

    const rawData = await response.json();

    // ==================================================
    // 4. PARSE & CLEAN DATA
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

    // Select the first program
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

    // ==================================================
    // 5. SEND TO SHOPIFY
    // ==================================================
    res.status(200).json(cleanData);

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Failed to fetch WOD", details: error.message });
  }
}
