const JSZip = require("jszip");
const { DOMParser } = require("@xmldom/xmldom");
const AppError = require("./AppError");

const TECAI_READING_KIND = "tecai_reading";
const TECAI_WRITING_KIND = "tecai_writing";
const DEFAULT_TIMER_SECONDS = 3600;

const normalizeParagraph = (paragraph) => ({
  type: paragraph?.type === "table" ? "table" : "p",
  html: typeof paragraph?.html === "string" ? paragraph.html : "",
  text: typeof paragraph?.text === "string" ? paragraph.text : ""
});

const sanitizeRenderer = (renderer) => {
  if (!renderer || typeof renderer !== "object") {
    return null;
  }

  if (renderer.kind === TECAI_READING_KIND && Array.isArray(renderer.paragraphs)) {
    console.log("DEBUG: Renderer entering Sanitize:", renderer);
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
  const relsFile = zip.file("word/_rels/document.xml.rels");
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

  const imgFile = zip.file(`word/${target}`);
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

        const imgFile = zip.file(`word/${target}`);
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

const buildTecaiQuizFromDocx = async (file) => {
  if (!file?.buffer) {
    throw new AppError("Upload a DOCX file to generate the TECAI exam.", 400);
  }

  const zip = await JSZip.loadAsync(file.buffer);
  const documentFile = zip.file("word/document.xml");
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
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new AppError("The uploaded DOCX file is missing word/document.xml.", 400);
  }

  const xml = await documentFile.async("string");
  const blocks = await parseDocument(xml, zip);

  console.log("DEBUG: Raw Blocks parsed from DOCX:", JSON.stringify(blocks, null, 2));

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

module.exports = {
  TECAI_READING_KIND,
  TECAI_WRITING_KIND,
  DEFAULT_TIMER_SECONDS,
  buildTecaiQuizFromDocx,
  buildTecaiWritingQuizFromDocx,
  sanitizeRenderer
};
