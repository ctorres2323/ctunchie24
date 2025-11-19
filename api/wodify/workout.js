export default async function handler(req, res) {
  // 1. ALLOW CORS (Crucial for Shopify to read this)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any domain (including your Shopify site)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle standard OPTIONS request (Pre-flight check)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. DEFINE YOUR WODIFY API DETAILS
  // (Replace these with your actual Wodify API Key if you have one, 
  // otherwise we can return mock data to test the connection first)
  
  try {
    // --- OPTION A: If you have the Wodify API Key ---
    /*
    const WODIFY_API_KEY = 'YOUR_API_KEY_HERE'; 
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const response = await fetch(`https://app.wodify.com/API/WODs_v1.aspx?apiKey=${WODIFY_API_KEY}&date=${date}&type=json`);
    const data = await response.json();
    */

    // --- OPTION B: MOCK DATA (Use this to test if the connection works first) ---
    const data = {
      status: "success",
      date: new Date().toLocaleDateString(),
      program: "NBHD Performance",
      strength: {
        name: "Back Squat",
        rep_scheme: "5-5-5-5-5",
        text: "Build to a heavy set of 5. Rest 2:00 between sets."
      },
      metcon: {
        name: "The Grinder",
        text: "AMRAP 12:\n12 Box Jumps (24/20)\n10 Deadlifts (225/155)\n8 Handstand Push-ups"
      },
      coach_notes: {
        text: "Focus on form over speed today. Break the deadlifts early."
      }
    };

    // 3. RETURN THE DATA
    res.status(200).json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch workout', details: error.message });
  }
}
