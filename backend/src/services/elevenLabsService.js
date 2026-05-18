const crypto = require("crypto");

const env = require("../config/env");
const SpeakingAudioCache = require("../models/SpeakingAudioCache");
const { uploadFile } = require("./storageService");

const ELEVENLABS_PROVIDER = "elevenlabs";

const normalizeText = (text) => String(text || "").replace(/\s+/g, " ").trim();
const hashText = (text) => crypto.createHash("sha256").update(text).digest("hex");

const isConfigured = () => Boolean(env.elevenlabs.apiKey && env.elevenlabs.voiceId);

const buildAudioAsset = (cacheRow, extraMeta = {}) => ({
  asset_id: `tts-${cacheRow.textHash}`,
  type: "audio",
  title: extraMeta.title || "Speaking prompt audio",
  url: cacheRow.fileUrl,
  content: null,
  mime_type: cacheRow.mimeType || "audio/mpeg",
  meta: {
    provider: ELEVENLABS_PROVIDER,
    voice_id: cacheRow.voiceId,
    cached: true,
    ...cacheRow.meta,
    ...extraMeta
  }
});

const synthesizeSpeech = async ({ text, title, segments = [], meta = {} }) => {
  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    return null;
  }

  if (!isConfigured()) {
    return {
      asset_id: `tts-disabled-${hashText(normalizedText).slice(0, 12)}`,
      type: "audio",
      title: title || "Speaking prompt audio",
      url: "",
      content: null,
      mime_type: "audio/mpeg",
      meta: {
        provider: ELEVENLABS_PROVIDER,
        voice_id: env.elevenlabs.voiceId || null,
        enabled: false,
        status: "disabled",
        reason: "ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID is not configured.",
        source_text: normalizedText,
        ...meta
      }
    };
  }

  const textHash = hashText(normalizedText);
  const cached = await SpeakingAudioCache.findOne({
    provider: ELEVENLABS_PROVIDER,
    voiceId: env.elevenlabs.voiceId,
    textHash
  }).lean();

  if (cached) {
    return buildAudioAsset(cached, {
      title,
      source_text: normalizedText,
      ...meta
    });
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(env.elevenlabs.voiceId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      "xi-api-key": env.elevenlabs.apiKey
    },
    body: JSON.stringify({
      text: normalizedText,
      model_id: env.elevenlabs.modelId,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.7
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${detail}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const upload = await uploadFile(
    {
      buffer: Buffer.from(arrayBuffer),
      mimetype: "audio/mpeg",
      originalname: `${textHash}.mp3`
    },
    ["generated-audio", "speaking", ...segments]
  );

  const cacheRow = await SpeakingAudioCache.create({
    provider: ELEVENLABS_PROVIDER,
    voiceId: env.elevenlabs.voiceId,
    textHash,
    text: normalizedText,
    fileUrl: upload.fileUrl,
    storageKey: upload.storageKey,
    mimeType: "audio/mpeg",
    meta: {
      model_id: env.elevenlabs.modelId,
      ...meta
    }
  });

  return buildAudioAsset(cacheRow.toObject(), {
    title,
    source_text: normalizedText,
    cached: false,
    ...meta
  });
};

module.exports = {
  ELEVENLABS_PROVIDER,
  isElevenLabsConfigured: isConfigured,
  synthesizeSpeech
};
