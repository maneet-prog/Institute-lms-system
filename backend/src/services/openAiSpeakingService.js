const fs = require("fs");
const path = require("path");

const env = require("../config/env");

const isConfigured = () => Boolean(env.openai.apiKey);

const isAbsoluteHttpUrl = (value = "") => /^https?:\/\//i.test(String(value));

const readAudioBuffer = async ({ responseUrl, storageKey }) => {
  if (storageKey) {
    const localPath = path.join(process.cwd(), "uploads", storageKey);
    if (fs.existsSync(localPath)) {
      return {
        buffer: fs.readFileSync(localPath),
        filename: path.basename(localPath)
      };
    }
  }

  if (responseUrl && String(responseUrl).startsWith("/uploads/")) {
    const localPath = path.join(process.cwd(), String(responseUrl).replace(/^\/+/, ""));
    if (fs.existsSync(localPath)) {
      return {
        buffer: fs.readFileSync(localPath),
        filename: path.basename(localPath)
      };
    }
  }

  if (isAbsoluteHttpUrl(responseUrl)) {
    const response = await fetch(responseUrl);
    if (!response.ok) {
      throw new Error(`Unable to fetch audio file for evaluation (${response.status}).`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      filename: path.basename(new URL(responseUrl).pathname || "speaking-response.webm")
    };
  }

  throw new Error("No readable audio source was provided for speaking evaluation.");
};

const transcribeAudio = async ({ responseUrl, storageKey }) => {
  if (!isConfigured()) {
    return {
      transcript: null,
      status: "disabled",
      reason: "OPENAI_API_KEY is not configured."
    };
  }

  const { buffer, filename } = await readAudioBuffer({ responseUrl, storageKey });
  const formData = new FormData();
  formData.append("model", env.openai.speechToTextModel);
  formData.append("file", new Blob([buffer]), filename || "speaking-response.webm");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openai.apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI transcription failed (${response.status}): ${detail}`);
  }

  const data = await response.json();
  return {
    transcript: typeof data.text === "string" ? data.text.trim() : "",
    status: "completed"
  };
};

const normalizeScore = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const evaluateTranscript = async ({
  transcript,
  prompt,
  instructions,
  examType = "speaking",
  questionLabel,
  scaleMax = 9
}) => {
  if (!isConfigured()) {
    return {
      status: "disabled",
      overall_score: 0,
      fluency: 0,
      grammar: 0,
      pronunciation: 0,
      vocabulary: 0,
      feedback: "OpenAI evaluation is disabled because OPENAI_API_KEY is not configured.",
      improvement_suggestions: []
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openai.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.openai.evaluationModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert speaking-exam evaluator. Return strict JSON with keys overall_score, fluency, grammar, pronunciation, vocabulary, feedback, improvement_suggestions, strengths. Scores must be numeric."
        },
        {
          role: "user",
          content: JSON.stringify({
            exam_type: examType,
            scale_max: scaleMax,
            question: questionLabel || null,
            prompt,
            instructions,
            transcript
          })
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI evaluation failed (${response.status}): ${detail}`);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (error) {
    parsed = {};
  }

  return {
    status: "completed",
    overall_score: normalizeScore(parsed.overall_score),
    fluency: normalizeScore(parsed.fluency),
    grammar: normalizeScore(parsed.grammar),
    pronunciation: normalizeScore(parsed.pronunciation),
    vocabulary: normalizeScore(parsed.vocabulary),
    feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    improvement_suggestions: Array.isArray(parsed.improvement_suggestions)
      ? parsed.improvement_suggestions.map(String)
      : [],
    scale_max: scaleMax
  };
};

module.exports = {
  isOpenAiConfigured: isConfigured,
  transcribeAudio,
  evaluateTranscript
};
