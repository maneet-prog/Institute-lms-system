import { useEffect, useRef, useState } from "react";
import { Content } from "@/types/lms";

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

export interface ListeningExamProps {
    content: Content;
    studentName: string;
    autoStart: boolean;
    allowSave: boolean;
    presentationVariant?: string;
}

function isYoutubeUrl(url: string): boolean {
    return /youtube\\.com|youtu\\.be/i.test(url);
}

export function ListeningExam({
    content,
    studentName,
    autoStart,
    allowSave,
    presentationVariant = "default"
}: ListeningExamProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [htmlContent, setHtmlContent] = useState<string>("");
    // Track if the student has explicitly started the exam
    const [hasStarted, setHasStarted] = useState<boolean>(false);

    useEffect(() => {
        // Prevent generating the HTML content if the user hasn't clicked start
        if (!hasStarted) return;

        const renderer = content.quiz?.renderer;
        const fileUrl = content.file_url || "";
        const extUrl = content.external_url || "";
        const rawAudio =
            renderer && renderer.kind === "tecai_listening"
                ? renderer.audio_url || extUrl || ""
                : extUrl || "";
        const promptFileUrl =
            renderer && renderer.kind === "tecai_listening"
                ? renderer.prompt_file_url || content.file_url || ""
                : content.file_url || "";

        const youtubeUrl = isYoutubeUrl(extUrl)
            ? extUrl
            : isYoutubeUrl(rawAudio)
                ? rawAudio
                : "";
        const plainAudioUrl = youtubeUrl ? "" : rawAudio;

        const sourceLabel = content.title || "Listening Exam";
        const initialSeconds = Number(content.duration || 60) * 60;
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TEC Listening Module v1.10</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://unpkg.com/mammoth/mammoth.browser.min.js"></script>
    <script src="https://www.youtube.com/iframe_api"></script>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: "Segoe UI", Arial; height: 100vh; overflow: hidden; background: #f5f7fb; }
        header { position: fixed; top: 0; width: 100%; height: 60px; background: #0b1f3a; color: white; padding: 10px 20px; z-index: 1000; display: flex; justify-content: space-between; align-items: center; }
        .controls { position: fixed; top: 60px; width: 100%; height: 55px; background: white; display: flex; align-items: center; gap: 15px; padding: 0 20px; border-bottom: 1px solid #ddd; z-index: 999; flex-wrap: wrap; }
        button { background: #0b1f3a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        button:hover { background: #163d6b; }
        .source-name { font-size: 14px; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
        .timer { margin-left: auto; font-weight: bold; color: #e63946; font-size: 1.2em; }
        .container { position: fixed; top: 115px; bottom: 60px; width: 100%; display: flex; justify-content: center; overflow: hidden; }
        .main-content { width: 100%; max-width: 900px; background: white; padding: 40px; overflow-y: auto; box-shadow: 0 0 15px rgba(0, 0, 0, 0.05); }
        .main-content div[id^="q"] { background: #fff; padding: 15px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #eee; transition: border 0.3s; }
        .drag-container { border: 2px dashed #bbb; padding: 10px; margin: 10px 0; min-height: 50px; border-radius: 6px; background: #fafafa; }
        .draggable { display: inline-block; padding: 6px 12px; margin: 5px; background: #0b1f3a; color: white; border-radius: 4px; cursor: grab; }
        .dropzone { display: inline-block; min-width: 100px; min-height: 28px; border-bottom: 2px solid #0b1f3a; margin: 0 5px; vertical-align: middle; background: #f0f4f8; }
        .question-nav { position: fixed; bottom: 0; width: 100%; height: 60px; background: white; border-top: 1px solid #ddd; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px; padding: 5px; overflow-x: auto; }
        .question-nav button { min-width: 35px; height: 35px; border-radius: 6px; background: #edf1f7; color: #333; font-weight: 600; }
        .question-nav button:hover { background: #0b1f3a; color: white; }
        h2, h4 { margin: 0; }
        #hiddenAudio { display: none; }
        #loadingOverlay { position: fixed; top: 115px; left: 0; width: 100%; height: calc(100% - 175px); background: rgba(255,255,255,0.9); display: flex; justify-content: center; align-items: center; z-index: 2000; font-size: 18px; color: #333; }
        input[type="checkbox"]:disabled { opacity: 0.5; cursor: not-allowed; }
        .type-8-group { padding: 10px; background: #f0f4f8; border-radius: 5px; margin-bottom: 15px; }
        body { -webkit-user-select: none; -ms-user-select: none; user-select: none; }
        img { -webkit-user-drag: none; user-drag: none; }
        .type-9-header-row { display: flex; font-weight: bold; background: #0b1f3a; color: white; padding: 10px; border-radius: 4px 4px 0 0; margin-top: 20px; }
        .type-9-row { display: flex; align-items: center; border-bottom: 1px solid #e0e6ed; padding: 10px; background: white; }
        .type-9-statement-head, .type-9-statement { flex: 2; padding-right: 15px; }
        .type-9-options-head, .type-9-options { flex: 3; display: flex; justify-content: space-around; align-items: center; }
        .type-9-option-label { width: 20px; text-align: center; }
        .type-9-options input[type="radio"] { cursor: pointer; transform: scale(1.2); }
        .type-10-dropdown { padding: 2px 5px; border: 1px solid #0b1f3a; border-radius: 4px; background-color: #fff; font-family: inherit; font-size: 13px; margin: 0 4px; color: #0b1f3a; cursor: pointer; vertical-align: middle; }
    </style>
</head>
<body class="${escapeHtml(presentationVariant)}">

    <header>
        <div>
            <h2>Tajinder's English Classes</h2>
            <h4>Listening Module</h4>
        </div>
    </header>

    <div class="controls">
        <span class="source-name">${escapeHtml(studentName)}</span>
        <span class="source-name">${escapeHtml(sourceLabel)}</span>
        <button type="button" onclick="submitTest()">Submit</button>
        <span class="timer" id="timer">00:00</span>
    </div>

    <audio id="hiddenAudio"></audio>

    <div class="container">
        <div class="main-content" id="mainPanel">
            <div style="text-align: center; color: #888; margin-top: 40px;">
                <p>Loading listening materials…</p>
            </div>
        </div>
    </div>

    <div id="yt-player-container" style="position: absolute; top: -9999px; left: -9999px;">
        <div id="youtube-player"></div>
    </div>

    <div class="question-nav" id="nav"></div>
    <div id="loadingOverlay" style="display: none;">Loading exam content...</div>

    <script>
        const docxUrl = "${escapeHtml(fileUrl)}";
        const youtubeLink = "${escapeHtml(plainAudioUrl)}";
        const initialSeconds = ${initialSeconds};
        const autoStart = ${autoStart ? "true" : "false"};
        const allowSave = ${allowSave ? "true" : "false"};
        let studentName = "${escapeHtml(studentName)}";

        let qNum = 1;
        let type4Answers = {};
        let renderedSets = new Set();
        let totalSeconds = initialSeconds;
        let type9Headers = [];
        let timerInterval;
        let ytPlayer;

        function formatTime(total) {
            let m = Math.floor(total / 60);
            let s = Math.floor(total % 60);
            return \`\${m}:\${s < 10 ? '0' + s : s}\`;
        }

        function getYTVideoId(url) {
            const regExp = /^.*(youtu.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=|\\&v=)([^#\\&\\?]*).*/;
            const match = url.match(regExp);
            return match && match[2].length === 11 ? match[2] : null;
        }

        function onYouTubeIframeAPIReady() {}

        function playYouTube(url) {
            const videoId = getYTVideoId(url);
            if (!videoId) return;
            if (ytPlayer && typeof ytPlayer.loadVideoById === "function") {
                ytPlayer.loadVideoById(videoId);
                ytPlayer.playVideo();
            } else {
                ytPlayer = new YT.Player("youtube-player", {
                    height: "0",
                    width: "0",
                    videoId: videoId,
                    playerVars: { 'autoplay': 1, 'controls': 0, 'disablekb': 1, 'origin': 'https://www.thesillysyllabus.com' },
                    events: {
                        'onReady': function (event) {
                            event.target.playVideo();
                        }
                    }
                });
            }
        }

        function startTimer(audio) {
            clearInterval(timerInterval);
            timerInterval = setInterval(function () {
                let remaining;
                if (audio && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                    remaining = Math.floor(audio.duration - audio.currentTime);
                } else {
                    totalSeconds--;
                    remaining = totalSeconds;
                }
                document.getElementById("timer").innerText = formatTime(Math.max(0, remaining));
                if (remaining <= 0) {
                    clearInterval(timerInterval);
                    downloadAnswers();
                }
            }, 1000);
        }

        async function fetchAndParseDocx() {
            if (!docxUrl) {
                document.getElementById("mainPanel").innerHTML = "<p>Error: No exam document URL.</p>";
                return;
            }
            document.getElementById("loadingOverlay").style.display = "flex";
            try {
                const response = await fetch(docxUrl);
                if (!response.ok) throw new Error("Failed to load exam file.");
                const arrayBuffer = await response.arrayBuffer();
                const zip = await JSZip.loadAsync(arrayBuffer);
                const xml = await zip.file("word/document.xml").async("string");
                const content = await parseDocument(xml, zip);
                process(content);

                const audio = document.getElementById("hiddenAudio");
                if (youtubeLink) {
                    playYouTube(youtubeLink);
                    startTimer(null);
                } else {
                    startTimer(null);
                }
            } catch (err) {
                console.error(err);
                document.getElementById("mainPanel").innerHTML = \`<p>Error loading exam: \${err && err.message ? err.message : err}</p>\`;
            } finally {
                document.getElementById("loadingOverlay").style.display = "none";
            }
        }

        async function parseDocument(xml, zip) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, "application/xml");
            const body = doc.getElementsByTagName("w:body")[0].childNodes;
            let content = [];
            let sectionTracker = 0;

            const relsXml = zip.file("word/_rels/document.xml.rels") ? await zip.file("word/_rels/document.xml.rels").async("text") : null;
            let relationships = [];
            if (relsXml) {
                const relsDoc = new DOMParser().parseFromString(relsXml, "text/xml");
                relationships = Array.from(relsDoc.getElementsByTagName("Relationship"));
            }

            for (let node of body) {
                if (node.nodeName === "w:p") {
                    let text = "";
                    let html = "";
                    const runs = node.getElementsByTagName("w:r");

                    for (let r of runs) {
                        let t = r.getElementsByTagName("w:t")[0];
                        if (!t) continue;

                        let val = t.textContent;
                        text += val;

                        if (r.getElementsByTagName("w:b").length) val = \`<b>\${val}</b>\`;
                        if (r.getElementsByTagName("w:i").length) val = \`<i>\${val}</i>\`;
                        if (r.getElementsByTagName("w:u").length) val = \`<u>\${val}</u>\`;

                        html += val;

                        const drawings = r.getElementsByTagName("w:drawing");
                        for (let d of drawings) {
                            html += await getImageHtml(d, zip, relationships);
                        }
                    }

                    let trimmedText = text.trim();
                    if (trimmedText.match(/\\[TECAI\\s*START\\]/i)) {
                        sectionTracker++;
                    }

                    content.push({ type: "p", text: text.trim(), html });
                }

                if (node.nodeName === "w:tbl") {
                    const tableHTML = await renderTable(node, zip, relationships);
                    content.push({ type: "table", html: tableHTML });
                }
            }

            return content;
        }

        async function getImageHtml(drawingNode, zip, relationships) {
            const blip = drawingNode.getElementsByTagName("a:blip")[0];
            if (!blip) return "";
            const embed = blip.getAttribute("r:embed");
            const rel = relationships.find(function (r) {
                return r.getAttribute("Id") === embed;
            });
            if (rel) {
                const target = rel.getAttribute("Target");
                const imgFile = zip.file(\`word/\${target}\`);
                if (imgFile) {
                    const base64 = await imgFile.async("base64");
                    let ext = target.split(".").pop().toLowerCase();
                    let mime = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : "image/jpeg";
                    return \`<br><img src="data:\${mime};base64,\${base64}" style="max-width:150px;">\`;
                }
            }
            return "";
        }

        async function renderTable(tblNode, zip, relationships) {
            let html = "<table style='border:none;border-collapse:collapse;width:100%'>";
            const rows = tblNode.getElementsByTagName("w:tr");
            for (let row of rows) {
                html += "<tr>";
                const cells = row.getElementsByTagName("w:tc");
                for (let cell of cells) {
                    html += "<td style='padding:8px;'>";
                    const paragraphs = cell.getElementsByTagName("w:p");
                    for (let p of paragraphs) {
                        const texts = p.getElementsByTagName("w:t");
                        let fullText = "";
                        for (let t of texts) fullText += t.textContent;
                        fullText = fullText.replace(/\\s+/g, " ").trim();
                        if (fullText.match(/\\[TECAI\\s*TYPE\\s*4\\s*SET\\s*(\\d+)\\]/i)) {
                            let mod = fullText.replace(/\\[TECAI\\s*TYPE\\s*4\\s*SET\\s*(\\d+)\\]/gi, function (m, id) {
                                return \`<div class="table-q-placeholder" data-type="4" data-set-id="\${id}"></div>\`;
                            });
                            html += \`<div>\${mod}</div>\`;
                        }
                        else if (fullText.match(/\\[TECAI\\s*Type\\s*6\\]/i)) {
                            let mod = fullText.replace(/\\[TECAI\\s*Type\\s*6\\]/gi, () => {
                                return \`<span class="table-q-placeholder" data-type="6"></span>\`;
                            });
                            html += \`<div>\${mod}</div>\`;
                        }
                        else {
                            let parsed = parseTECAIInline(fullText);
                            html += \`<div>\${parsed}</div>\`;
                        }
                    }
                    const drawings = cell.getElementsByTagName("w:drawing");
                    for (let d of drawings) {
                        html += await getImageHtml(d, zip, relationships);
                    }
                    html += "</td>";
                }
                html += "</tr>";
            }
            html += "</table><br>";
            return html;
        }

        function parseTECAIInline(text) {
            if (!text) return "";
            let output = text;
            output = output.replace(/\\[TECAI\\s*Type\\s*6\\]/gi, function () {
                const currentIndex = qNum++;
                return \`<b>\${currentIndex}.</b><input name="q\${currentIndex}" style="width:100px;margin:0 5px;">\`;
            });
            output = output.replace(/\\[\\s*input\\s*box\\s*\\]/gi, function () {
                const currentIndex = qNum++;
                return \`<b>\${currentIndex}.</b><input name="q\${currentIndex}" style="width:100px;margin:0 5px;">\`;
            });
            return output;
        }

        function process(content) {
            let currentSection = 0;
            let inBlock = false;
            let panelHTML = "";
            qNum = 1;
            type4Answers = {};
            renderedSets = new Set();

            const answerRegex = /\\[TECAI\\s*TYPE\\s*4\\s*ANSWER\\s*SET\\s*(\\d+)\\]/i;
            const optionRegex = /\\[TECAI\\s*TYPE\\s*4\\s*OPTIONS\\s*START\\s*SET\\s*(\\d+)\\]/i;

            let tempSection = 0;
            content.forEach(function (p) {
                let txt = p.text || "";
                if (txt.match(/\\[TECAI\\s*START\\]/i)) {
                    tempSection++;
                    return;
                }
                if (txt.match(/\\[TECAI\\s*END\\]/i)) return;
                let m = txt.match(answerRegex);
                if (m) {
                    let id = m[1];
                    let sectionId = \`\${tempSection}_\${id}\`;
                    let clean = txt.replace(answerRegex, "").trim();
                    if (!type4Answers[sectionId]) type4Answers[sectionId] = [];
                    type4Answers[sectionId].push(clean);
                }
            });

            content.forEach(function (p) {
                let txt = p.text || "";
                if (txt.match(/\\[TECAI\\s*START\\]/i)) {
                    inBlock = true;
                    currentSection++;
                    return;
                }
                if (txt.match(/\\[TECAI\\s*END\\]/i)) {
                    inBlock = false;
                    return;
                }

                if (p.type === "table") {
                    let tempDiv = document.createElement("div");
                    tempDiv.innerHTML = p.html;
                    let placeholders = tempDiv.querySelectorAll(".table-q-placeholder");
                    placeholders.forEach(function (ph) {
                        let type = ph.getAttribute("data-type");
                        let currentQ = qNum++;

                        if (type === "4") {
                            let id = ph.getAttribute("data-set-id");
                            let dataset = \`\${currentSection}_\${id}\`;
                            ph.outerHTML = \`<div id="q\${currentQ}"><b>\${currentQ}.</b> <span class="dropzone" data-set="\${dataset}"></span></div>\`;
                        } else if (type === "6") {
                            ph.outerHTML = \`<b id="q\${currentQ}">\${currentQ}.</b> <input name="q\${currentQ}" style="width:100px;margin:0 5px;">\`;
                        }
                    });
                    panelHTML += tempDiv.innerHTML;
                    return;
                }

                if (inBlock) {
                    if (txt.match(answerRegex)) return;
                    let line = p.html || "";

                    let optMatch = txt.match(optionRegex);
                    if (optMatch) {
                        let id = optMatch[1];
                        let sectionId = \`\${currentSection}_\${id}\`;
                        if (!renderedSets.has(sectionId)) {
                            panelHTML += \`<div><b>Options:</b><div class="drag-container" data-set="\${sectionId}" id="set_\${sectionId}">\`;
                            (type4Answers[sectionId] || []).forEach(function (it, i) {
                                panelHTML += \`<div class="draggable" draggable="true" data-set="\${sectionId}" id="drag_\${sectionId}_\${i}">\${it}</div>\`;
                            });
                            panelHTML += \`</div></div>\`;
                            renderedSets.add(sectionId);
                        }
                        return;
                    }

                    if (txt.match(/\\[TECAI\\s*Type\\s*1\\]/i)) {
                        let clean = line.replace(/\\[TECAI\\s*Type\\s*1\\]/i, "");
                        panelHTML += \`<div id="q\${qNum}"><b>\${qNum}.</b> \${clean}<br><label><input type="radio" name="q\${qNum}" value="TRUE"> TRUE</label><label><input type="radio" name="q\${qNum}" value="FALSE"> FALSE</label><label><input type="radio" name="q\${qNum}" value="NOT GIVEN"> NOT GIVEN</label></div>\`;
                        qNum++;
                        return;
                    }
                    if (txt.match(/\\[TECAI\\s*Type\\s*2\\]/i)) {
                        let clean = line.replace(/\\[TECAI\\s*Type\\s*2\\]/i, "");
                        panelHTML += \`<div id="q\${qNum}"><b>\${qNum}.</b> \${clean}<br><label><input type="radio" name="q\${qNum}" value="YES"> YES</label><label><input type="radio" name="q\${qNum}" value="NO"> NO</label><label><input type="radio" name="q\${qNum}" value="NOT GIVEN"> NOT GIVEN</label></div>\`;
                        qNum++;
                        return;
                    }
                    if (txt.match(/\\[TECAI\\s*Type\\s*3\\]/i)) {
                        let temp = document.createElement("div");
                        temp.innerHTML = line;
                        let parts = temp.textContent.split(/\\[TECAI\\s*Type\\s*3\\]/i);
                        let out = "";
                        parts.forEach(function (t, i) {
                            out += t;
                            if (i < parts.length - 1) out += \`<input name="q\${qNum}_\${i}" style="width:120px;">\`;
                        });
                        panelHTML += \`<div id="q\${qNum}"><b>\${qNum}.</b> \${out}</div>\`;
                        qNum++;
                        return;
                    }
                    if (txt.match(/\\[TECAI\\s*TYPE\\s*4\\s*SET\\s*\\d+\\]/i)) {
                        let mod = txt.replace(/\\[TECAI\\s*TYPE\\s*4\\s*SET\\s*(\\d+)\\]/gi, function (m, id) {
                            return \`<span class="dropzone" data-set="\${currentSection}_\${id}"></span>\`;
                        });
                        panelHTML += \`<p id="q\${qNum}"><b>\${qNum}.</b> \${mod}</p>\`;
                        qNum++;
                        return;
                    }
                    if (txt.match(/\\[TECAI\\s*Type\\s*5\\]/i)) {
                        let clean = txt.replace(/\\[TECAI\\s*Type\\s*5\\]/i, "");
                        panelHTML += \`<div id="q\${qNum}"><b>\${qNum}.</b> \${clean}<br>\`;
                        return;
                    }
                    if (txt.match(/\\[TECAI\\s*TYPE\\s*5\\.1\\s*OPTIONS\\]/i)) {
                        let opts = txt.replace(/\\[TECAI\\s*TYPE\\s*5\\.1\\s*OPTIONS\\]/i, "").split("/").map(function (o) { return o.trim(); });
                        let targetQ = qNum;
                        opts.forEach(function (opt) {
                            panelHTML += \`<label><input type="radio" name="q\${targetQ}" value="\${opt}"> \${opt}</label><br>\`;
                        });
                        panelHTML += \`</div>\`;
                        qNum++;
                        return;
                    }
                    if (txt.match(/\\[TECAI\\s*TYPE\\s*5\\.2\\s*OPTIONS\\]/i)) {
                        let opts = txt.replace(/\\[TECAI\\s*TYPE\\s*5\\.2\\s*OPTIONS\\]/i, "").split("/").map(function (o) { return o.trim(); });
                        let targetQ = qNum;
                        opts.forEach(function (opt) {
                            panelHTML += \`<label><input type="checkbox" name="q\${targetQ}" value="\${opt}"> \${opt}</label><br>\`;
                        });
                        panelHTML += \`</div>\`;
                        qNum++;
                        return;
                    }
                    if (txt.match(/\\[TECAI\\s*Type\\s*6\\]/i)) {
                        let temp = document.createElement("div");
                        temp.innerHTML = line;
                        let parts = temp.textContent.split(/\\[TECAI\\s*Type\\s*6\\]/i);
                        let out = "";
                        let startQ = qNum;
                        parts.forEach(function (t, i) {
                            out += t;
                            if (i < parts.length - 1) {
                                out += \`<b id="q\${qNum}">\${qNum}.</b><input name="q\${qNum}" style="width:120px; margin:0 5px;">\`;
                                qNum++;
                            }
                        });
                        panelHTML += \`<div id="q\${startQ}">\${out}</div>\`;
                        return;
                    }
                    if (txt.match(/\\[TECAI\\s*TYPE\\s*7\\]/i) && !txt.match("OPTIONS")) {
                        let clean = txt.replace(/\\[TECAI\\s*TYPE\\s*7\\]/i, "").trim();
                        panelHTML += \`<div id="q\${qNum}"><b>\${qNum}.</b> \${clean}\`;
                        return;
                    }
                    if (txt.match(/\\[TECAI\\s*TYPE\\s*7\\s*OPTIONS\\]/i)) return;

                    let prevP = content[content.indexOf(p) - 1];
                    if (
                        prevP &&
                        prevP.text &&
                        prevP.text.match(/\\[TECAI\\s*TYPE\\s*7\\s*OPTIONS\\]/i) &&
                        !txt.match("END")
                    ) {
                        let options = txt.split("/").map(function (o) { return o.trim(); });
                        let selectHTML = \`<select name="q\${qNum}" style="margin-left:10px; padding:4px;"><option value="">Select...</option>\`;
                        options.forEach(function (opt) {
                            selectHTML += \`<option value="\${opt}">\${opt}</option>\`;
                        });
                        selectHTML += \`</select></div>\`;
                        panelHTML += selectHTML;
                        qNum++;
                        return;
                    }

                    if (txt.match(/\\[TECAI\\s*TYPE\\s*8\\]/i)) {
                        let limit = 2;
                        for (let i = content.indexOf(p); i < content.length; i++) {
                            if (content[i] && content[i].text) {
                                let peek = content[i].text;
                                let mm = peek && peek.match(/\\[TECAI\\s*TYPE\\s*8\\.(\\d+)\\s*OPTIONS\\]/i);
                                if (mm) {
                                    limit = parseInt(mm[1], 10);
                                    break;
                                }
                            }
                        }
                        let qRange = limit > 1 ? \`\${qNum}–\${qNum + limit - 1}\` : \`\${qNum}\`;
                        let clean = txt.replace(/\\[TECAI\\s*TYPE\\s*8\\]/i, "");
                        panelHTML += \`<div id="q\${qNum}" class="question-container type-8-group" data-limit="\${limit}"><b>\${qRange}.</b> \${clean}<br>\`;
                        return;
                    }

                    if (txt.match(/\\[TECAI\\s*TYPE\\s*8\\.(\\d+)\\s*OPTIONS\\]/i)) {
                        let match = txt.match(/8\\.(\\d+)/);
                        let limit = match ? parseInt(match[1], 10) : 2;
                        let opts = txt.replace(/\\[TECAI\\s*TYPE\\s*8\\.\\d+\\s*OPTIONS\\]/i, "").split("/").map(function (o) { return o.trim(); });
                        opts.forEach(function (opt) {
                            panelHTML += \`<label style="display:block; margin: 5px 0;"><input type="checkbox" name="q\${qNum}" value="\${opt}" onchange="limitCheckboxes(this, \${limit})"> \${opt}</label>\`;
                        });
                        panelHTML += \`</div>\`;
                        qNum += limit;
                        return;
                    }
                        
                    //Type 9 - Matrix
                    if (txt.includes("[TECAI TYPE 9 HEADERS]")) {
                        let rawHeaders = txt.split(']')[1] || "";
                        type9Headers = rawHeaders.split('/').map(h => h.trim());

                        // Render the Header Bar
                        let headerHtml = \`
        <div class="type-9-header-row">
            <div class="type-9-statement-head">Questions</div>
            <div class="type-9-options-head">
                \${type9Headers.map(h => \`<div style="flex:1; text-align:center;">\${h}</div>\`).join('')}
            </div>
        </div>\`;

                        panelHTML += headerHtml;
                        return;
                    }

                    // 2. Detect and render Type 9 Question Row
                    if (txt.includes("[TECAI TYPE 9]")) {
                        let currentQ = qNum++;
                        // Remove the tag so it doesn't show in the question text
                        let cleanStatement = txt.replace(/\\[TECAI\\s*TYPE\\s*9\\]/gi, '').trim();

                        let rowHtml = \`
        <div class="type-9-row" id="q\${currentQ}">
            <div class="type-9-statement"><b>\${currentQ}.</b> \${cleanStatement}</div>
            <div class="type-9-options">
                \${type9Headers.map(header => \`
                    <div style="flex:1; text-align:center;">
                        <input type="radio" name="q\${currentQ}" value="\${header}" title="\${header}">
                    </div>
                \`).join('')}
            </div>
        </div>\`;

                        panelHTML += rowHtml;
                        return;
                    }

                    //type 10 - Dropdown within a paragraph
                    if (txt.includes("[TECAI Type 10:")) {
                        let modHtml = txt.replace(/\\[TECAI\\s*Type\\s*10:\\s*([^\\]]+)\\]/gi, (match, optionsString) => {
                            let currentQ = qNum++;
                            let options = optionsString.split('/').map(opt => opt.trim());

                            let selectHtml = \`<select name="q\${currentQ}" class="type-10-dropdown">\`;
                            selectHtml += \`<option value="">Select...</option>\`;

                            options.forEach(opt => {
                                selectHtml += \`<option value="\${opt}">\${opt}</option>\`;
                            });
                            selectHtml += \`</select>\`;

                            return \`<b id="q\${currentQ}">\${currentQ}.</b> \${selectHtml}\`;
                        });

                        rightHTML += \`<p>\${modHtml}</p>\`;
                        return;
                    }

                    panelHTML += \`<p>\${line}</p>\`;
                } else {
                    panelHTML += \`<p>\${p.html}</p>\`;
                }
            });

            document.getElementById("mainPanel").innerHTML = panelHTML;
            createNav();
        }

        document.addEventListener("dragstart", function (e) {
            let el = e.target.closest(".draggable");
            if (el) e.dataTransfer.setData("id", el.id);
        });

        document.addEventListener("dragover", function (e) {
            if (e.target.closest(".dropzone") || e.target.closest(".drag-container")) e.preventDefault();
        });

        document.addEventListener("drop", function (e) {
            e.preventDefault();
            let el = document.getElementById(e.dataTransfer.getData("id"));
            if (!el) return;
            let drop = e.target.closest(".dropzone");
            let container = e.target.closest(".drag-container");
            let set = el.dataset.set;
            if (drop) {
                if (set !== drop.dataset.set) return alert("Wrong set");
                if (drop.firstChild) document.getElementById(\`set_\${set}\`).appendChild(drop.firstChild);
                drop.innerHTML = "";
                drop.appendChild(el);
            } else if (container) {
                if (set !== container.dataset.set) return alert("Wrong set");
                container.appendChild(el);
            }
        });

        function createNav() {
            const nav = document.getElementById("nav");
            nav.innerHTML = "";
            let processedQs = new Set();
            for (let i = 1; i < qNum; i++) {
                if (processedQs.has(i)) continue;
                let btn = document.createElement("button");
                btn.classList.add("nav-btn");
                let container = document.getElementById(\`q\${i}\`);
                let label = \`\${i}\`;
                if (container && container.classList.contains("type-8-group")) {
                    let limit = parseInt(container.getAttribute("data-limit") || "1", 10);
                    if (limit > 1) {
                        label = \`\${i}–\${i + limit - 1}\`;
                        for (let j = 1; j < limit; j++) processedQs.add(i + j);
                    }
                }
                btn.innerText = label;
                btn.onclick = function () {
                    document.getElementById(\`q\${i}\`).scrollIntoView({ behavior: "smooth" });
                };
                nav.appendChild(btn);
            }
        }

        function limitCheckboxes(el, max) {
            let name = el.name;
            let checkboxes = document.querySelectorAll(\`input[name="\${name}"]\`);
            let checkedCount = document.querySelectorAll(\`input[name="\${name}"]:checked\`).length;
            checkboxes.forEach(function (cb) {
                if (checkedCount >= max) {
                    if (!cb.checked) cb.disabled = true;
                } else {
                    cb.disabled = false;
                }
            });
        }

        function buildAnswerText() {
            const now = new Date().toLocaleString();
            return \`Name: \${studentName}\\nDate: \${now}\\nAnswers:\\n      \\n\${collectAnswers()}\\n\\nSelf Assessment:\\n[ ] Confident\\n[ ] Need Practice\\n[ ] Time Management Issue\\n\`;
        }

        function downloadAnswers() {
            const content = buildAnswerText();
            const blob = new Blob([content], { type: "text/plain" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = \`\${studentName}_\${Date.now()}.txt\`;
            a.click();
            const timeTaken = initialSeconds - totalSeconds;
            if (allowSave && window.parent) {
                window.parent.postMessage({ type: "tecai-submit", responseText: content, timeTakenSeconds: timeTaken }, "*");
            }
        }

        function collectAnswers() {
            let data = [];
            for (let i = 1; i < qNum; i++) {
                let qDiv = document.getElementById(\`q\${i}\`);
                if (!qDiv) {
                    let directInput = document.querySelector(\`input[name="q\${i}"]\`);
                    if (directInput) {
                        data.push(\`\${i}.\${directInput.value.trim() || " "}\`);
                        continue;
                    }
                    data.push(\`\${i}. \`);
                    continue;
                }

                // 1. Handle Type 8 (Question Ranges/Groups) 
                if (qDiv && qDiv.classList.contains("type-8-group")) {
                    let limit = parseInt(qDiv.getAttribute("data-limit"));
                    let checked = qDiv.querySelectorAll('input:checked');
                    let values = Array.from(checked).map(c => c.value);
                    let rangeLabel = (limit > 1) ? \`\${i}–\${i + limit - 1}\` : \`\${i}\`;
                    data.push(\`\${rangeLabel}.\${values.join(" | ") || " "}\`);
                    i += (limit - 1);
                    continue;
                }

                // 2. Handle TYPE 4 (Drag and Drop)
                if (qDiv && qDiv.querySelectorAll(".dropzone").length > 0) {
                    let drops = qDiv.querySelectorAll(".dropzone");
                    let values = [];
                    drops.forEach(d => {
                        let dragged = d.querySelector(".draggable");
                        values.push(dragged ? dragged.innerText.trim() : " ");
                    });
                    data.push(\`\${i}.\${values.join(" | ")}\`);
                    continue;
                }

                let inputs = document.querySelectorAll(\`[name="q\${i}"], [name^="q\${i}_"]\`);

                if (inputs.length > 0) {
                    let values = [];

                    inputs.forEach(inp => {
                        if (inp.tagName === "SELECT") {
                            if (inp.value) values.push(inp.value);
                        } else if (inp.type === "radio" || inp.type === "checkbox") {
                            if (inp.checked) values.push(inp.value);
                        } else {
                            if (inp.value.trim()) values.push(inp.value.trim());
                        }
                    });

                    data.push(\`\${i}. \${values.join(" | ") || " "}\`);
                    continue;
                }

                let dropdown = qDiv.querySelector("select");
                if (dropdown) {
                    data.push(\`\${i}. \${dropdown.value.trim() || " "}\`);
                    continue;
                }
                let textInputs = qDiv.querySelectorAll('input[type="text"], input:not([type])');
                if (textInputs.length > 0) {
                    textInputs.forEach(function (inp) {
                        let nameMatch = inp.name.match(/q(\\d+)/);
                        let currentNum = nameMatch ? nameMatch[1] : i;
                        data.push(\`\${currentNum}. \${inp.value.trim() || " "}\`);
                    });
                    if (textInputs.length > 1) {
                        let lastInpName = textInputs[textInputs.length - 1].name.match(/q(\\d+)/);
                        if (lastInpName) i = parseInt(lastInpName[1], 10);
                    }
                    continue;
                }
                data.push(\`\${i}. \`);
            }
            return data.join("\\n");
        }

        function submitTest() {
            if (confirm("Are you sure you want to submit?")) downloadAnswers();
        }

        window.addEventListener("load", function () {
            document.getElementById("timer").innerText = formatTime(initialSeconds);
            if (autoStart) fetchAndParseDocx();
            else fetchAndParseDocx();
        });
    </script>
</body>
</html>`;

        setHtmlContent(html);
    }, [content, studentName, autoStart, allowSave, presentationVariant, hasStarted]);

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
            {/* Permission Prompt Modal */}
            {!hasStarted && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#0b1f3a",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                        color: "white",
                        fontFamily: '"Segoe UI", Arial, sans-serif',
                        padding: "20px",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            color: "#333",
                            padding: "40px",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                            maxWidth: "450px",
                            width: "100%",
                        }}
                    >
                        <h2 style={{ margin: "0 0 10px 0", color: "#0b1f3a" }}>Listening Examination</h2>
                        <p style={{ color: "#555", fontSize: "15px", marginBottom: "30px", lineHeight: "1.5" }}>
                            Hello, <strong>{studentName || "Student"}</strong>.<br />
                            This module contains embedded audio files. Please ensure your volume is turned up before starting.
                        </p>
                        <button
                            type="button"
                            onClick={() => setHasStarted(true)}
                            style={{
                                background: "#0b1f3a",
                                color: "white",
                                border: "none",
                                padding: "12px 30px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "16px",
                                transition: "background 0.2s",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = "#163d6b")}
                            onMouseOut={(e) => (e.currentTarget.style.background = "#0b1f3a")}
                        >
                            Start Exam & Play Audio
                        </button>
                    </div>
                </div>
            )}

            {/* Exam Frame */}
            {hasStarted && (
                <iframe
                    ref={iframeRef}
                    srcDoc={htmlContent}
                    style={{ width: "100vw", height: "100vh", border: "none" }}
                    title="TECAI Listening Exam"
                    allow="autoplay; encrypted-media"
                />
            )}
        </div>
    );
}