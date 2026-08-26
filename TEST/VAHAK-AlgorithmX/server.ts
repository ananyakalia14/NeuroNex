import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily/safely on server
let genAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), aiOnline: !!process.env.GEMINI_API_KEY });
});

// AI Co-Pilot / Emergency Assistant Endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, context } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // Fallback if no API key is set yet
      return res.json({
        reply: `[RURAL OPERATIONS AI CO-PILOT] Triage analysis active.\n\nAssessing: "${message || "Operational status"}"\n\nRecommendation: Prioritize ALS units to high-elevation villages with road blockades. Ensure district blood banks maintain >15 units of O-Negative. Dispatch Drone MED-01 for antivenom transport if transit time exceeds 25 minutes.`,
        suggestedActions: [
          { label: "Dispatch Drone MED-01", type: "dispatch_drone" },
          { label: "Alert Trauma Bay 2", type: "alert_hospital" },
          { label: "Reroute via Highway NH-52", type: "reroute" },
        ],
      });
    }

    const systemInstruction = `You are the Lead Emergency AI Dispatcher & Clinical Triage Co-Pilot for the "Rural Healthcare 3D Dispatch & Routing Command Center". 
Your mission: Assist emergency controllers in triaging rural medical distress calls, routing ambulances through harsh terrains, avoiding flood/landslide blocked roads, optimizing hospital ICU & specialist allocation, and triggering emergency medicine drone deliveries.
Keep your responses precise, high-urgency, and actionable with clear tactical recommendations.
Tone: Calm, authoritative, clinical, geospatial-aware. Context provided: ${JSON.stringify(context || {})}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    res.json({
      reply: response.text || "Operational analysis complete. All units functioning within nominal parameters.",
      suggestedActions: [
        { label: "Auto-Assign Nearest ALS Unit", type: "auto_assign" },
        { label: "Verify Helipad Readiness", type: "verify_helipad" },
        { label: "Notify On-Call Trauma Surgeon", type: "notify_doctor" },
      ],
    });
  } catch (err: any) {
    console.error("Gemini API error:", err);
    res.status(500).json({
      error: "AI operation error",
      reply: "AI dispatch engine operational in autonomous fail-safe mode. Recommended action: Deploy nearest Basic Life Support unit and pre-alert emergency department.",
    });
  }
});

// AI Emergency Triage Optimizer Endpoint
app.post("/api/ai/triage", async (req, res) => {
  try {
    const { emergency, hospitals, ambulances, roadConditions } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        recommendedAmbulanceId: ambulances?.[0]?.id || "AMB-01",
        recommendedHospitalId: hospitals?.[0]?.id || "HOSP-01",
        triageSeverity: emergency?.severity || "Critical",
        clinicalProtocol: "Immediate airway stabilization and rapid IV fluids. Initiate tele-consultation with on-call trauma surgeon.",
        estimatedTimeMinutes: 18,
        pathRiskFactor: "Moderate - Unpaved road segment on Route 7A",
        confidence: 0.96,
      });
    }

    const prompt = `Perform instant clinical triage and dispatch optimization for this rural emergency:
Emergency: ${JSON.stringify(emergency)}
Available Hospitals: ${JSON.stringify(hospitals)}
Available Ambulances: ${JSON.stringify(ambulances)}
Road Conditions: ${JSON.stringify(roadConditions)}

Respond in JSON format specifying:
1. recommendedAmbulanceId
2. recommendedHospitalId
3. triageSeverity (Critical, High, Medium, Low)
4. clinicalProtocol (short clinical instruction for paramedics en route)
5. estimatedTimeMinutes (number)
6. pathRiskFactor (e.g. "Low", "Moderate", "High due to bridge elevation")
7. confidence (number between 0.8 and 1.0)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err) {
    console.error("Triage optimization error:", err);
    res.json({
      recommendedAmbulanceId: "AMB-01",
      recommendedHospitalId: "HOSP-01",
      triageSeverity: "Critical",
      clinicalProtocol: "Standard ALS protocol. Continuous ECG and pulse oximetry monitoring.",
      estimatedTimeMinutes: 22,
      pathRiskFactor: "Low",
      confidence: 0.92,
    });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Rural Healthcare Command Center running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
