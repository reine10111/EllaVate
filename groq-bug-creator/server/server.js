import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "openai/gpt-oss-20b";

function buildPrompt(feature) {
  return `
You are a QA engineer. Write a bug report for this feature: "${feature}".

Respond ONLY with one valid JSON object in exactly this shape:
{
  "title": "short bug title",
  "description": "2-3 sentence summary of the bug",
  "environment": "browser, OS, app version",
  "severity": "Low | Medium | High | Critical",
  "steps": [
    {
      "action": "what the tester does",
      "data": "test data used, or a dash if none",
      "expected": "what should happen",
      "status": "Passed or Failed",
      "actual": "what really happened"
    }
  ]
}

Rules:
- Give 4 to 7 steps, in order.
- Early setup steps usually pass; the bug shows up in the failing steps.
- For Passed steps, "actual" must be an empty string.
- For Failed steps, "actual" must describe what really happened.
- NEVER use double quotes inside any value. Use single quotes instead.
- No line breaks inside values. No trailing commas.
`;
}

function parseReport(raw) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON");
  const cleaned = raw
    .slice(start, end + 1)
    .replace(/,\s*([}\]])/g, "$1"); // remove trailing commas
  const report = JSON.parse(cleaned);
  if (!Array.isArray(report.steps) || report.steps.length === 0) {
    throw new Error("Report has no steps");
  }
  return report;
}

app.post("/api/generate-bug", async (req, res) => {
  const { feature } = req.body;
  const MAX_TRIES = 3;

  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: buildPrompt(feature) }],
        response_format: { type: "json_object" },
        max_tokens: 4000,
      });

      const raw = response.choices[0]?.message?.content || "";
      const report = parseReport(raw);
      return res.json({ report });
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${MAX_TRIES} failed:`, error.message);
      if (attempt === MAX_TRIES) {
        return res.status(500).json({ error: "Could not generate a valid report" });
      }
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));