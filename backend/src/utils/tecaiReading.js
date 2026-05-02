const JSZip = require("jszip");
const { DOMParser } = require("@xmldom/xmldom");
const AppError = require("./AppError");

const TECAI_READING_KIND = "tecai_reading";
const DEFAULT_TIMER_SECONDS = 3600;

const normalizeParagraph = (paragraph) => ({
  html: typeof paragraph?.html === "string" ? paragraph.html : "",
  text: typeof paragraph?.text === "string" ? paragraph.text : ""
});

const sanitizeRenderer = (renderer) => {
  if (!renderer || renderer.kind !== TECAI_READING_KIND || !Array.isArray(renderer.paragraphs)) {
    return null;
  }

  return {
    kind: TECAI_READING_KIND,
    timer_seconds:
      Number(renderer.timer_seconds || renderer.timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS,
    paragraphs: renderer.paragraphs.map(normalizeParagraph)
  };
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
  const paragraphs = getParagraphs(xml);

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

module.exports = {
  TECAI_READING_KIND,
  DEFAULT_TIMER_SECONDS,
  buildTecaiQuizFromDocx,
  sanitizeRenderer
};
