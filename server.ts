import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

// We'll import the question generator backend functions
import { generateProceduralQuestion } from "./src/services/proceduralEngine";
import { generateIQQuestionFromLLM } from "./src/services/llmEngine";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // IMPORTANT: Trust proxy is required if running behind a reverse proxy (e.g., in a containerized environment)
  // This correctly passes IP addresses for rate limiting to function.
  app.set("trust proxy", 1);

  // Apply Helmet Security Headers
  app.use(helmet({
    // Disable certain policies specifically for Vite/React dev iframes in AI Studio to run properly
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  app.use(cors());
  app.use(express.json({ limit: "10kb" })); // Limit payload size against DoS
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));
  
  // Protect against HTTP Parameter Pollution attacks
  app.use(hpp());

  // Define Rate Limiters
  // 1. Global Limiter: General guard against DDoS on all endpoints
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 global requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests globally from this IP, please try again later." }
  });
  app.use(globalLimiter);

  // 2. API specific strict limiter
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 150, // Max 150 API limit reads per window (strict)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many queries to the API, please try again later." }
  });

  // Background Cache holding questions to ensure 1ms fetch times
  // Simulating an active 1M+ Database Queue
  const cache: any = {
    VISUAL_MATRIX: [],
    NUMERICAL: [],
    LOGICAL: [],
    AUDIO_TONES: [],
    MEMORY: [],
    SPEED: []
  };

  const refillCache = async () => {
     // Slowly refill cache items up to 5 each for ALL modalities
     const ALLOWED_MODALITIES = ['VISUAL_MATRIX', 'NUMERICAL', 'LOGICAL', 'AUDIO_TONES', 'MEMORY', 'SPEED'] as const;
     
     for (const mod of ALLOWED_MODALITIES) {
        if (cache[mod].length < 5) {
           try {
              // Fetch a random difficulty to slowly populate the buffer realistically
              const diffs = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
              const diff = diffs[Math.floor(Math.random() * diffs.length)];
              const q = await generateIQQuestionFromLLM(mod as any, diff as any);
              if (q) cache[mod].push(q);
              
              // Add a slight delay to prevent rate limiting from Gemini API
              await new Promise(r => setTimeout(r, 1000));
           } catch (e) {
             console.error("Queue replenish failed, falling back to procedural", e);
           }
        }
     }
  };

  // Trigger background refill periodically
  setInterval(refillCache, 15000); // Check every 15s instead of 30s
  refillCache();

  // Allowed strict enums for backend validation parameter security
  const ALLOWED_MODALITIES = ['VISUAL_MATRIX', 'NUMERICAL', 'LOGICAL', 'AUDIO_TONES', 'MEMORY', 'SPEED'];
  const ALLOWED_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];

  // API ROUTES
  app.get("/api/questions", apiLimiter, async (req, res) => {
    const { modality, difficulty } = req.query as { modality: string, difficulty: string };
    
    try {
      // Security Validation: Strict Type Allowlist Parameter Checking
      if (!modality || !difficulty) {
         return res.status(400).json({ error: "Missing required query parameters." });
      }
      
      if (!ALLOWED_MODALITIES.includes(modality)) {
         return res.status(422).json({ error: "Invalid modality parameter provided." });
      }

      if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
         return res.status(422).json({ error: "Invalid difficulty parameter provided." });
      }
      
      // Real LLM-based API questions take precedence if cached
      if (cache[modality].length > 0) {
          // Find matching difficulty if possible
          const index = cache[modality].findIndex((q: any) => q.difficulty === difficulty);
          if (index !== -1) {
            const q = cache[modality].splice(index, 1)[0];
            return res.json(q);
          } else {
             // Just pull the first available one as fallback if exact difficulty is draining
             const q = cache[modality].splice(0, 1)[0];
             return res.json(q);
          }
      }

      // Procedural fallback (if queue empty)
      const q = generateProceduralQuestion(modality as any, difficulty as any);
      return res.json(q);
    } catch (err: any) {
      console.error("API Error", err);
      // Absolute fallback
      const q = generateProceduralQuestion(modality as any, difficulty as any);
      return res.json(q);
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support React Router HTML5 History if used
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
