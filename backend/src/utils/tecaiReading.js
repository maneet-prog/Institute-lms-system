const JSZip = require("jszip");
const { DOMParser } = require("@xmldom/xmldom");

const AppError = require("./AppError");
const { synthesizeSpeech } = require("../services/elevenLabsService");

const TECAI_READING_KIND = "tecai_reading";
const TECAI_WRITING_KIND = "tecai_writing";
const TECAI_LISTENING_KIND = "tecai_listening";
const TECAI_SPEAKING_KIND = "tecai_speaking";
const DEFAULT_TIMER_SECONDS = 3600;

const normalizeZipPath = (value = "") => String(value).replace(/\\/g, "/").replace(/^\/+/, "");
const getZipFile = (zip, targetPath) => {
  const normalizedTarget = normalizeZipPath(targetPath);
  const direct = zip.file(normalizedTarget);
  if (direct) {
    return direct;
  }

  const matches = Object.values(zip.files || {}).filter(
    (entry) => normalizeZipPath(entry.name) === normalizedTarget
  );
  return matches[0] || null;
};

const normalizeParagraph = (paragraph) => ({
  type: paragraph?.type === "table" ? "table" : "p",
  html: typeof paragraph?.html === "string" ? paragraph.html : "",
  text: typeof paragraph?.text === "string" ? paragraph.text : ""
});

const normalizeAudioAsset = (asset) =>
  asset
    ? {
        asset_id: String(asset.asset_id || asset.assetId || ""),
        type: "audio",
        title: typeof asset.title === "string" ? asset.title : "",
        url: typeof asset.url === "string" ? asset.url : "",
        mime_type: typeof asset.mime_type === "string" ? asset.mime_type : "audio/mpeg",
        meta: asset.meta && typeof asset.meta === "object" ? asset.meta : null
      }
    : null;

const sanitizeSpeakingPart = (part, index) => ({
  part_id: String(part?.part_id || part?.partId || `part-${index + 1}`),
  title: String(part?.title || `Part ${index + 1}`),
  kind: String(part?.kind || "section"),
  instructions: typeof part?.instructions === "string" ? part.instructions : "",
  instruction_audio_asset: normalizeAudioAsset(part?.instruction_audio_asset || part?.instructionAudioAsset),
  questions: Array.isArray(part?.questions)
    ? part.questions.map((question, questionIndex) => ({
        question_id: String(question?.question_id || question?.questionId || `question-${index + 1}-${questionIndex + 1}`),
        prompt: typeof question?.prompt === "string" ? question.prompt : "",
        instructions: typeof question?.instructions === "string" ? question.instructions : "",
        prep_seconds: Math.max(0, Number(question?.prep_seconds || question?.prepSeconds || 0) || 0),
        record_seconds: Math.max(0, Number(question?.record_seconds || question?.recordSeconds || 0) || 0),
        audio_asset: normalizeAudioAsset(question?.audio_asset || question?.audioAsset),
        order_index: Number(question?.order_index || question?.orderIndex || questionIndex) || questionIndex
      }))
    : []
});

const sanitizeRenderer = (renderer) => {
  if (!renderer || typeof renderer !== "object") {
    return null;
  }

  if (renderer.kind === TECAI_READING_KIND && Array.isArray(renderer.paragraphs)) {
    return {
      kind: TECAI_READING_KIND,
      timer_seconds:
        Number(renderer.timer_seconds || renderer.timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS,
      paragraphs: renderer.paragraphs.map(normalizeParagraph)
    };
  }

  if (renderer.kind === TECAI_WRITING_KIND && Array.isArray(renderer.parts)) {
    return {
      kind: TECAI_WRITING_KIND,
      timer_seconds:
        Number(renderer.timer_seconds || renderer.timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS,
      instructions: typeof renderer.instructions === "string" ? renderer.instructions : "",
      parts: renderer.parts.map((part, index) => ({
        part_id: String(part.part_id || part.partId || `part-${index + 1}`),
        title: String(part.title || `Task ${index + 1}`),
        kind: String(part.kind || "task"),
        instructions: typeof part.instructions === "string" ? part.instructions : "",
        prompt_html: typeof part.prompt_html === "string" ? part.prompt_html : "",
        prompt_text: typeof part.prompt_text === "string" ? part.prompt_text : "",
        minimum_words: Math.max(0, Number(part.minimum_words || part.minimumWords || 0) || 0),
        placeholder:
          typeof part.placeholder === "string" ? part.placeholder : "Start writing your response here...",
        resources: Array.isArray(part.resources)
          ? part.resources.map((resource, resourceIndex) => ({
              asset_id: String(resource.asset_id || resource.assetId || `asset-${index + 1}-${resourceIndex + 1}`),
              type: String(resource.type || "text"),
              title: typeof resource.title === "string" ? resource.title : "",
              url: typeof resource.url === "string" ? resource.url : "",
              content: typeof resource.content === "string" ? resource.content : ""
            }))
          : []
      }))
    };
  }

  if (renderer.kind === TECAI_WRITING_KIND && Array.isArray(renderer.blocks)) {
    return {
      kind: TECAI_WRITING_KIND,
      timer_seconds:
        Number(renderer.timer_seconds || renderer.timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS,
      blocks: renderer.blocks.map(normalizeParagraph)
    };
  }

  if (renderer.kind === TECAI_LISTENING_KIND) {
    return {
      kind: TECAI_LISTENING_KIND,
      timer_seconds:
        Number(renderer.timer_seconds || renderer.timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS,
      audio_url: typeof renderer.audio_url === "string" ? renderer.audio_url : "",
      prompt_file_url: typeof renderer.prompt_file_url === "string" ? renderer.prompt_file_url : "",
      instructions: typeof renderer.instructions === "string" ? renderer.instructions : ""
    };
  }

  if (renderer.kind === TECAI_SPEAKING_KIND && Array.isArray(renderer.parts)) {
    return {
      kind: TECAI_SPEAKING_KIND,
      timer_seconds:
        Number(renderer.timer_seconds || renderer.timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS,
      exam_type: typeof renderer.exam_type === "string" ? renderer.exam_type : "general",
      instructions: typeof renderer.instructions === "string" ? renderer.instructions : "",
      allow_rerecord: renderer.allow_rerecord !== false,
      voice: renderer.voice && typeof renderer.voice === "object" ? renderer.voice : null,
      instruction_audio_asset: normalizeAudioAsset(
        renderer.instruction_audio_asset || renderer.instructionAudioAsset
      ),
      parts: renderer.parts.map(sanitizeSpeakingPart)
    };
  }

  return null;
};

const getDataUriMimeType = (path = "") => {
  const normalized = path.toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".gif")) return "image/gif";
  if (normalized.endsWith(".bmp")) return "image/bmp";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
};

const parseTECAIInline = (text, state) => {
  if (!text) return "";

  let output = text;

  output = output.replace(/\[TECAI\s*Type\s*6\]/gi, () => {
    const currentQ = state.qNum++;
    return `<b>${currentQ}.</b>
        <input name="q${currentQ}" style="width:100px;margin:0 5px;">`;
  });

  output = output.replace(/\[\s*input\s*box\s*\]/gi, () => {
    const currentQ = state.qNum++;
    return `<b>${currentQ}.</b>
        <input name="q${currentQ}" style="width:100px;margin:0 5px;">`;
  });

  return output;
};

const getParagraphs = (xml) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const nodes = Array.from(doc.getElementsByTagName("w:p"));

  const paragraphs = [];
  for (const paragraphNode of nodes) {
    let html = "";
    let text = "";
    const runs = Array.from(paragraphNode.getElementsByTagName("w:r"));

    for (const run of runs) {
      const textNode = run.getElementsByTagName("w:t")[0];
      if (!textNode) continue;

      let value = textNode.textContent || "";
      text += value;

      if (run.getElementsByTagName("w:b").length) value = `<b>${value}</b>`;
      if (run.getElementsByTagName("w:i").length) value = `<i>${value}</i>`;
      if (run.getElementsByTagName("w:u").length) value = `<u>${value}</u>`;

      html += value;
    }

    paragraphs.push({
      html,
      text: text.replace(/\s+/g, " ").trim()
    });
  }

  return paragraphs;
};

const getRelationships = async (zip) => {
  const relsFile = getZipFile(zip, "word/_rels/document.xml.rels");
  if (!relsFile) {
    return [];
  }

  const relsXml = await relsFile.async("text");
  const relsDoc = new DOMParser().parseFromString(relsXml, "text/xml");
  return Array.from(relsDoc.getElementsByTagName("Relationship"));
};

const getImageHtml = async (drawingNode, zip, relationships) => {
  const blip = drawingNode.getElementsByTagName("a:blip")[0];
  if (!blip) return "";

  const embed = blip.getAttribute("r:embed");
  const relationship = relationships.find((item) => item.getAttribute("Id") === embed);
  if (!relationship) return "";

  const target = relationship.getAttribute("Target");
  if (!target) return "";

  const imgFile = getZipFile(zip, `word/${target}`);
  if (!imgFile) return "";

  const base64 = await imgFile.async("base64");
  const mimeType = getDataUriMimeType(target);
  return `<br><img src="data:${mimeType};base64,${base64}">`;
};

const renderTable = async (tblNode, zip, state, relationships) => {
  let html = "<table border='1' style='border-collapse:collapse;width:100%'>";

  const rows = Array.from(tblNode.getElementsByTagName("w:tr"));

  for (const row of rows) {
    html += "<tr>";

    const cells = Array.from(row.getElementsByTagName("w:tc"));

    for (const cell of cells) {
      html += "<td style='padding:8px;'>";

      const paragraphs = Array.from(cell.getElementsByTagName("w:p"));

      for (const paragraph of paragraphs) {
        const texts = Array.from(paragraph.getElementsByTagName("w:t"));

        let fullText = "";

        for (const textNode of texts) {
          fullText += textNode.textContent || "";
        }

        fullText = fullText.replace(/\s+/g, " ").trim();

        const parsed = parseTECAIInline(fullText, state);

        html += `<div>${parsed}</div>`;
      }

      const drawings = Array.from(cell.getElementsByTagName("w:drawing"));

      for (const drawing of drawings) {
        const blip = drawing.getElementsByTagName("a:blip")[0];
        if (!blip) continue;

        const embed = blip.getAttribute("r:embed");
        const relationship = relationships.find((item) => item.getAttribute("Id") === embed);

        if (!relationship) continue;

        const target = relationship.getAttribute("Target");
        if (!target) continue;

        const imgFile = getZipFile(zip, `word/${target}`);
        if (!imgFile) continue;

        const base64 = await imgFile.async("base64");
        const mimeType = getDataUriMimeType(target);
        const url = `data:${mimeType};base64,${base64}`;

        html += `<br><img src="${url}" style="max-width:150px;">`;
      }

      html += "</td>";
    }

    html += "</tr>";
  }

  html += "</table><br>";
  return html;
};

const parseDocument = async (xml, zip) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const bodyNode = doc.getElementsByTagName("w:body")[0];
  const bodyChildren = bodyNode ? Array.from(bodyNode.childNodes || []) : [];
  const relationships = await getRelationships(zip);
  const state = { qNum: 1 };

  const content = [];

  for (const node of bodyChildren) {
    if (node.nodeName === "w:p") {
      let text = "";
      let html = "";

      const runs = Array.from(node.getElementsByTagName("w:r"));

      for (const run of runs) {
        const textNode = run.getElementsByTagName("w:t")[0];
        if (!textNode) continue;

        let value = textNode.textContent || "";
        text += value;

        if (run.getElementsByTagName("w:b").length) value = `<b>${value}</b>`;
        if (run.getElementsByTagName("w:i").length) value = `<i>${value}</i>`;
        if (run.getElementsByTagName("w:u").length) value = `<u>${value}</u>`;

        html += value;

        const drawings = Array.from(run.getElementsByTagName("w:drawing"));
        for (const drawing of drawings) {
          html += await getImageHtml(drawing, zip, relationships);
        }
      }

      content.push({ type: "p", text: text.trim(), html });
    }

    if (node.nodeName === "w:tbl") {
      const tableHtml = await renderTable(node, zip, state, relationships);
      content.push({ type: "table", html: tableHtml, text: "" });
    }
  }

  return content;
};

const normalizeSpeakingText = (value) => String(value || "").replace(/\s+/g, " ").trim();
const isSpeakingTag = (value, tag) => new RegExp(`^\\[\\s*${tag}\\s*\\]$`, "i").test(value);
const parseTimedTag = (value, tag) => {
  const match = value.match(new RegExp(`^\\[\\s*${tag}\\s*:\\s*(\\d+)\\s*\\]$`, "i"));
  return match ? Math.max(0, Number(match[1]) || 0) : null;
};
const parsePartTag = (value) => {
  const match = value.match(/^\[\s*(PART[^\]]+)\s*\]$/i);
  return match ? match[1].trim() : null;
};

const parseSpeakingParagraphs = (paragraphs, options = {}) => {
  const startIndex = paragraphs.findIndex((row) => isSpeakingTag(row.text, "TECAI SPEAKING START"));
  const endIndex = paragraphs.findIndex((row, index) => index > startIndex && isSpeakingTag(row.text, "TECAI SPEAKING END"));

  if (startIndex === -1 || endIndex === -1) {
    throw new AppError("The uploaded DOCX file does not contain a valid TECAI speaking block.", 400);
  }

  const lines = paragraphs
    .slice(startIndex + 1, endIndex)
    .map((row) => normalizeSpeakingText(row.text))
    .filter(Boolean);

  const parts = [];
  const examInstructionLines = [];
  let currentPart = null;
  let lastQuestion = null;
  let activeCollector = null;

  const ensurePart = () => {
    if (!currentPart) {
      currentPart = {
        part_id: `part-${parts.length + 1}`,
        title: `Part ${parts.length + 1}`,
        kind: "section",
        instructions: "",
        questions: []
      };
      parts.push(currentPart);
    }
    return currentPart;
  };

  const flushQuestion = () => {
    if (!lastQuestion) return;
    lastQuestion.prompt = normalizeSpeakingText(lastQuestion.prompt);
    lastQuestion.instructions = normalizeSpeakingText(lastQuestion.instructions);
  };

  lines.forEach((line) => {
    const partTitle = parsePartTag(line);
    const prepSeconds = parseTimedTag(line, "PREP");
    const recordSeconds = parseTimedTag(line, "RECORD");

    if (isSpeakingTag(line, "INSTRUCTION")) {
      activeCollector = "instruction";
      return;
    }

    if (isSpeakingTag(line, "QUESTION")) {
      const part = ensurePart();
      lastQuestion = {
        question_id: `${part.part_id}-question-${part.questions.length + 1}`,
        prompt: "",
        instructions: "",
        prep_seconds: 0,
        record_seconds: 0,
        order_index: part.questions.length
      };
      part.questions.push(lastQuestion);
      activeCollector = "question";
      return;
    }

    if (partTitle) {
      flushQuestion();
      currentPart = {
        part_id: `part-${parts.length + 1}`,
        title: partTitle,
        kind: "section",
        instructions: "",
        questions: []
      };
      parts.push(currentPart);
      lastQuestion = null;
      activeCollector = null;
      return;
    }

    if (prepSeconds != null) {
      ensurePart();
      if (lastQuestion) {
        lastQuestion.prep_seconds = prepSeconds;
      }
      activeCollector = null;
      return;
    }

    if (recordSeconds != null) {
      ensurePart();
      if (lastQuestion) {
        lastQuestion.record_seconds = recordSeconds;
      }
      activeCollector = null;
      return;
    }

    if (activeCollector === "instruction") {
      if (lastQuestion) {
        lastQuestion.instructions = normalizeSpeakingText(`${lastQuestion.instructions} ${line}`);
      } else if (currentPart) {
        currentPart.instructions = normalizeSpeakingText(`${currentPart.instructions} ${line}`);
      } else {
        examInstructionLines.push(line);
      }
      return;
    }

    if (activeCollector === "question" && lastQuestion) {
      lastQuestion.prompt = normalizeSpeakingText(`${lastQuestion.prompt} ${line}`);
      return;
    }

    if (lastQuestion && !lastQuestion.prompt) {
      lastQuestion.prompt = normalizeSpeakingText(`${lastQuestion.prompt} ${line}`);
      return;
    }

    if (currentPart) {
      currentPart.instructions = normalizeSpeakingText(`${currentPart.instructions} ${line}`);
      return;
    }

    examInstructionLines.push(line);
  });

  flushQuestion();

  if (!parts.length || !parts.some((part) => part.questions.length)) {
    throw new AppError("At least one [QUESTION] block is required in the TECAI speaking document.", 400);
  }

  const totalTimerSeconds = parts.reduce(
    (sum, part) =>
      sum +
      part.questions.reduce(
        (partSum, question) => partSum + Number(question.prep_seconds || 0) + Number(question.record_seconds || 0),
        0
      ),
    0
  );

  return {
    exam_type: options.examType || "general",
    instructions: normalizeSpeakingText(examInstructionLines.join("\n")),
    allow_rerecord: options.allowRerecord !== false,
    timer_seconds: totalTimerSeconds || DEFAULT_TIMER_SECONDS,
    parts
  };
};

const enrichSpeakingRendererWithAudio = async (renderer, options = {}) => {
  const speakingRenderer = {
    kind: TECAI_SPEAKING_KIND,
    timer_seconds: renderer.timer_seconds,
    exam_type: renderer.exam_type || "general",
    instructions: renderer.instructions || "",
    allow_rerecord: renderer.allow_rerecord !== false,
    voice: {
      provider: "elevenlabs",
      voice_id: options.voiceId || null
    },
    instruction_audio_asset: null,
    parts: []
  };

  if (renderer.instructions) {
    speakingRenderer.instruction_audio_asset = await synthesizeSpeech({
      text: renderer.instructions,
      title: "Exam instructions",
      segments: ["speaking", "instructions"],
      meta: {
        exam_type: renderer.exam_type || "general",
        role: "instruction"
      }
    });
  }

  for (let partIndex = 0; partIndex < renderer.parts.length; partIndex += 1) {
    const part = renderer.parts[partIndex];
    const nextPart = {
      part_id: part.part_id,
      title: part.title,
      kind: part.kind,
      instructions: part.instructions || "",
      instruction_audio_asset: null,
      questions: []
    };

    if (part.instructions) {
      nextPart.instruction_audio_asset = await synthesizeSpeech({
        text: part.instructions,
        title: `${part.title} instructions`,
        segments: ["speaking", part.part_id, "instructions"],
        meta: {
          exam_type: renderer.exam_type || "general",
          part_id: part.part_id,
          role: "part_instruction"
        }
      });
    }

    for (let questionIndex = 0; questionIndex < part.questions.length; questionIndex += 1) {
      const question = part.questions[questionIndex];
      const promptAudio = await synthesizeSpeech({
        text: question.prompt,
        title: `${part.title} prompt`,
        segments: ["speaking", part.part_id, question.question_id],
        meta: {
          exam_type: renderer.exam_type || "general",
          part_id: part.part_id,
          question_id: question.question_id,
          role: "question"
        }
      });

      nextPart.questions.push({
        ...question,
        audio_asset: promptAudio
      });
    }

    speakingRenderer.parts.push(nextPart);
  }

  return speakingRenderer;
};

const buildSpeakingExamParts = (renderer) =>
  renderer.parts.map((part, partIndex) => ({
    partId: part.part_id,
    title: part.title,
    kind: "section",
    instructions: part.instructions || "",
    timerSeconds: part.questions.reduce(
      (sum, question) => sum + Number(question.prep_seconds || 0) + Number(question.record_seconds || 0),
      0
    ),
    passages: [],
    audio: [],
    images: [],
    resources: [],
    questions: part.questions.map((question, questionIndex) => ({
      questionId: question.question_id,
      type: "spoken",
      prompt: question.prompt,
      instructions: question.instructions || null,
      options: [],
      answerData: {
        prep_seconds: question.prep_seconds,
        record_seconds: question.record_seconds,
        audio_asset: question.audio_asset || null
      },
      answerKey: null,
      maxMarks: 0,
      orderIndex: question.order_index ?? questionIndex
    })),
    audio: part.instruction_audio_asset ? [
      {
        assetId: part.instruction_audio_asset.asset_id,
        type: "audio",
        title: part.instruction_audio_asset.title || `${part.title} instructions`,
        url: part.instruction_audio_asset.url || "",
        storageKey: part.instruction_audio_asset.meta?.storage_key || null,
        content: null,
        mimeType: part.instruction_audio_asset.mime_type || "audio/mpeg",
        meta: part.instruction_audio_asset.meta || null
      }
    ] : [],
    answerData: null,
    orderIndex: partIndex
  }));

const buildTecaiQuizFromDocx = async (file) => {
  if (!file?.buffer) {
    throw new AppError("Upload a DOCX file to generate the TECAI exam.", 400);
  }

  const zip = await JSZip.loadAsync(file.buffer);
  const documentFile = getZipFile(zip, "word/document.xml");
  if (!documentFile) {
    throw new AppError("The uploaded DOCX file is missing word/document.xml.", 400);
  }

  const xml = await documentFile.async("string");
  const paragraphs = await parseDocument(xml, zip);

  return {
    mode: "written",
    attemptLimit: 1,
    questions: [],
    renderer: {
      kind: TECAI_READING_KIND,
      timer_seconds: DEFAULT_TIMER_SECONDS,
      paragraphs
    }
  };
};

const buildTecaiWritingQuizFromDocx = async (file) => {
  if (!file?.buffer) {
    throw new AppError("Upload a DOCX file to generate the TECAI writing exam.", 400);
  }

  const zip = await JSZip.loadAsync(file.buffer);
  const documentFile = getZipFile(zip, "word/document.xml");
  if (!documentFile) {
    throw new AppError("The uploaded DOCX file is missing word/document.xml.", 400);
  }

  const xml = await documentFile.async("string");
  const blocks = await parseDocument(xml, zip);

  return {
    mode: "written",
    attemptLimit: 1,
    questions: [],
    renderer: {
      kind: TECAI_WRITING_KIND,
      timer_seconds: DEFAULT_TIMER_SECONDS,
      blocks
    }
  };
};

const buildTecaiSpeakingQuizFromDocx = async (file, options = {}) => {
  if (!file?.buffer) {
    throw new AppError("Upload a DOCX file to generate the TECAI speaking exam.", 400);
  }

  const zip = await JSZip.loadAsync(file.buffer);
  const documentFile = getZipFile(zip, "word/document.xml");
  if (!documentFile) {
    throw new AppError("The uploaded DOCX file is missing word/document.xml.", 400);
  }

  const xml = await documentFile.async("string");
  const paragraphs = getParagraphs(xml);
  const parsedRenderer = parseSpeakingParagraphs(paragraphs, options);
  const renderer = await enrichSpeakingRendererWithAudio(parsedRenderer, options);

  return {
    mode: "written",
    attemptLimit: Math.max(1, Number(options.attemptLimit || 1) || 1),
    questions: [],
    renderer,
    examParts: buildSpeakingExamParts(renderer),
    metadata: {
      exam_type: renderer.exam_type,
      allow_rerecord: renderer.allow_rerecord,
      voice: renderer.voice,
      instruction_audio_asset: renderer.instruction_audio_asset || null
    }
  };
};

module.exports = {
  TECAI_READING_KIND,
  TECAI_WRITING_KIND,
  TECAI_LISTENING_KIND,
  TECAI_SPEAKING_KIND,
  DEFAULT_TIMER_SECONDS,
  buildTecaiQuizFromDocx,
  buildTecaiWritingQuizFromDocx,
  buildTecaiSpeakingQuizFromDocx,
  sanitizeRenderer
};
