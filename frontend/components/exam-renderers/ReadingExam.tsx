"use client";

import { useEffect, useRef, useState } from "react";
import { Content } from "@/types/lms";

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

interface ReadingExamProps {
    content: Content;
    studentName: string;
    autoStart: boolean;
    allowSave: boolean;
}

export function ReadingExam({
    content,
    studentName,
    autoStart,
    allowSave
}: ReadingExamProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [htmlContent, setHtmlContent] = useState<string>("");

    useEffect(() => {
        const fileUrl = content.file_url || "";
        const sourceLabel = content.title || "Reading Exam";
        const initialSeconds = Number(content.duration || 60) * 60; // default 60 minutes

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TEC Reading Module</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://unpkg.com/mammoth/mammoth.browser.min.js"></script>

    <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: "Segoe UI", Arial; height: 100vh; overflow: hidden; background: #f5f7fb; }
        header { position: fixed; top: 0; width: 100%; height: 60px; background: #0b1f3a; color: white; padding: 10px 20px; z-index: 1000; }
        header h2 { margin: 0; font-size: 18px; }
        header h4 { margin: 2px 0 0; font-size: 13px; opacity: 0.8; }
        .controls { position: fixed; top: 60px; width: 100%; height: 55px; background: white; display: flex; align-items: center; gap: 10px; padding: 0 15px; border-bottom: 1px solid #ddd; z-index: 999; }
        button { background: #0b1f3a; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
        button:hover { background: #163d6b; }
        .source-name { font-size: 14px; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
        .timer { margin-left: auto; font-weight: bold; color: #e63946; }
        .container { position: fixed; top: 115px; bottom: 60px; width: 100%; display: flex; }
        .left, .right { width: 50%; padding: 15px; overflow-y: auto; }
        .left { background: white; border-right: 1px solid #ddd; }
        .right { background: #fafbff; }
        .right div[id^="q"] { background: white; padding: 10px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #e0e0e0; }
        .drag-container { border: 2px dashed #bbb; padding: 10px; margin: 10px 0; min-height: 40px; border-radius: 6px; }
        .draggable { display: inline-block; padding: 5px 10px; margin: 5px; background: #0b1f3a; color: white; border-radius: 5px; cursor: grab; }
        .dropzone { display: inline-block; min-width: 120px; min-height: 25px; border-bottom: 2px solid #000; margin: 0 5px; }
        .question-nav { position: fixed; bottom: 0; width: 100%; height: 60px; background: white; border-top: 1px solid #ddd; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px; padding: 5px; overflow-x: auto; }
        .question-nav button { min-width: 35px; height: 35px; border-radius: 6px; background: #edf1f7; color: #333; font-weight: 600; }
        .question-nav button:hover { background: #0b1f3a; color: white; }
        #loadingOverlay { position: fixed; top: 115px; left: 0; width: 100%; height: calc(100% - 175px); background: rgba(255,255,255,0.9); display: flex; justify-content: center; align-items: center; z-index: 2000; font-size: 18px; color: #333; }
        input[type="checkbox"]:disabled { opacity: 0.5; cursor: not-allowed; }
        .type-8-group { padding: 10px; background: #f0f4f8; border-radius: 5px; margin-bottom: 15px; }
    </style>
</head>
<body>

    <header>
        <h2>Tajinder's English Classes</h2>
        <h4>Reading Module</h4>
    </header>

    <div class="controls">
        <span class="source-name" style="margin-right: 15px;">${escapeHtml(studentName)}</span>
        <span class="source-name" style="margin-right: 15px;">${escapeHtml(sourceLabel)}</span>
        <button onclick="submitTest()">Submit</button>
        <span class="timer" id="timer">60:00</span>
    </div>

    <div class="container">
        <div class="left" id="leftPanel"></div>
        <div class="right" id="rightPanel"></div>
    </div>

    <div class="question-nav" id="nav"></div>
    <div id="loadingOverlay" style="display: none;">Loading exam content...</div>

    <script>
        const fileUrl = "${escapeHtml(fileUrl)}";
        const initialSeconds = ${initialSeconds};
        const autoStart = ${autoStart ? "true" : "false"};
        const allowSave = ${allowSave ? "true" : "false"};

        let studentName = "${escapeHtml(studentName)}";
        let qNum = 1;
        let type4Answers = {};
        let renderedSets = new Set();
        let totalSeconds = initialSeconds;
        let timerInterval;
        let sectionTracker = 0;

        function formatTime(total) {
            let m = Math.floor(total / 60);
            let s = total % 60;
            return \`\${m}:\${s < 10 ? '0' + s : '' + s}\`;
        }

        async function fetchAndParseDocx() {
            if (!fileUrl) {
                document.getElementById("leftPanel").innerHTML = "Error: No exam file provided.";
                return;
            }
            document.getElementById("loadingOverlay").style.display = "flex";
            try {
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error("Failed to load exam file.");
                const arrayBuffer = await response.arrayBuffer();
                const zip = await JSZip.loadAsync(arrayBuffer);
                const xml = await zip.file("word/document.xml").async("string");
                const content = await parseDocument(xml, zip);
                process(content);
                startTimer();
            } catch (err) {
                console.error(err);
                document.getElementById("leftPanel").innerHTML = "Error loading exam: " + err.message;
            } finally {
                document.getElementById("loadingOverlay").style.display = "none";
            }
        }

        async function parseDocument(xml, zip) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, "application/xml");
            const body = doc.getElementsByTagName("w:body")[0].childNodes;
            let content = [];

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
                    
                    content.push({ type: "p", text: trimmedText, html });
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
            const rel = relationships.find(r => r.getAttribute("Id") === embed);
            if (rel) {
                const target = rel.getAttribute("Target");
                const imgFile = zip.file("word/" + target);
                if (imgFile) {
                    const base64 = await imgFile.async("base64");
                    let ext = target.split('.').pop().toLowerCase();
                    let mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
                    return \`<br><img src="data:\${mime};base64,\${base64}" style="max-width:150px;">\`;
                }
            }
            return "";
        }

        async function renderTable(tblNode, zip, relationships) {
            let html = "<table border='1' style='border-collapse:collapse;width:100%'>";
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
                            let mod = fullText.replace(/\\[TECAI\\s*TYPE\\s*4\\s*SET\\s*(\\d+)\\]/gi, (m, id) => {
                                return \`<div class="table-q-placeholder" data-set-id="\${id}"></div>\`;
                            });
                            html += \`<div>\${mod}</div>\`;
                        } else {
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
            output = output.replace(/\\[TECAI\\s*Type\\s*6\\]/gi, () => {
                return \`<b>\${qNum++}.</b><input name="q\${qNum - 1}" style="width:100px;margin:0 5px;">\`;
            });
            output = output.replace(/\\[\\s*input\\s*box\\s*\\]/gi, () => {
                return \`<b>\${qNum++}.</b><input name="q\${qNum - 1}" style="width:100px;margin:0 5px;">\`;
            });
            return output;
        }

        function startTimer() {
            timerInterval = setInterval(() => {
                totalSeconds--;
                document.getElementById("timer").innerText = formatTime(totalSeconds);
                if (totalSeconds <= 0) {
                    clearInterval(timerInterval);
                    downloadAnswers();
                }
            }, 1000);
        }

        function process(content) {
            let currentSection = 0;
            let inBlock = false;
            let rightHTML = "", leftHTML = "";
            qNum = 1;
            type4Answers = {};
            renderedSets = new Set();
            let currentType7Options = [];

            const answerRegex = /\\[TECAI\\s*TYPE\\s*4\\s*ANSWER\\s*SET\\s*(\\d+)\\]/i;
            const optionRegex = /\\[TECAI\\s*TYPE\\s*4\\s*OPTIONS\\s*START\\s*SET\\s*(\\d+)\\]/i;

            let tempSection = 0;
            content.forEach(p => {
                let txt = p.text || "";
                if (txt.match(/\\[TECAI\\s*START\\]/i)) { tempSection++; return; }
                if (txt.match(/\\[TECAI\\s*END\\]/i)) return;
                let m = txt.match(answerRegex);
                if (m) {
                    let id = m[1];
                    let sectionId = tempSection + "_" + id;
                    let clean = txt.replace(answerRegex, "").trim();
                    if (!type4Answers[sectionId]) type4Answers[sectionId] = [];
                    type4Answers[sectionId].push(clean);
                }
            });

            content.forEach(p => {
                let txt = p.text || "";
                if (txt.match(/\\[TECAI\\s*START\\]/i)) { inBlock = true; currentSection++; return; }
                if (txt.match(/\\[TECAI\\s*END\\]/i)) { inBlock = false; return; }

                if (p.type === "table" || /^<table[\\s>]/i.test(p.html || "")) {
                    let tempDiv = document.createElement("div");
                    tempDiv.innerHTML = p.html;

                    let placeholders = tempDiv.querySelectorAll(".table-q-placeholder");
                    placeholders.forEach(ph => {
                        let id = ph.getAttribute("data-set-id");
                        let currentQ = qNum++;
                        let dataset = currentSection + "_" + id;
                        ph.outerHTML = \`<div id="q\${currentQ}"><b>\${currentQ}.</b> <span class="dropzone" data-set="\${dataset}"></span></div>\`;
                    });
                    if (inBlock) { rightHTML += tempDiv.innerHTML; } else { leftHTML += tempDiv.innerHTML; }
                    return;
                }

                if (inBlock) {
                    if (txt.match(answerRegex)) return;
                    let line = p.html || "";

                    let optMatch = txt.match(optionRegex);
                    if (optMatch) {
                        let id = optMatch[1];
                        let sectionId = currentSection + "_" + id;
                        if (!renderedSets.has(sectionId)) {
                            rightHTML += \`<div><b>Options:</b><div class="drag-container" data-set="\${sectionId}" id="set_\${sectionId}">\`;
                            (type4Answers[sectionId] || []).forEach((it, i) => {
                                rightHTML += \`<div class="draggable" draggable="true" data-set="\${sectionId}" id="drag_\${sectionId}_\${i}">\${it}</div>\`;
                            });
                            rightHTML += \`</div></div>\`;
                            renderedSets.add(sectionId);
                        }
                        return;
                    }

                    if (txt.match(/\\[TECAI\\s*Type\\s*1\\]/i)) {
                        let clean = line.replace(/\\[TECAI\\s*Type\\s*1\\]/i, "");
                        rightHTML += \`<div id="q\${qNum}"><b>\${qNum}.</b> \${clean}<br>
        <label><input type="radio" name="q\${qNum}" value="TRUE"> TRUE</label>
        <label><input type="radio" name="q\${qNum}" value="FALSE"> FALSE</label>
        <label><input type="radio" name="q\${qNum}" value="NOT GIVEN"> NOT GIVEN</label></div>\`;
                        qNum++; return;
                    }
                    if (txt.match(/\\[TECAI\\s*Type\\s*2\\]/i)) {
                        let clean = line.replace(/\\[TECAI\\s*Type\\s*2\\]/i, "");
                        rightHTML += \`<div id="q\${qNum}"><b>\${qNum}.</b> \${clean}<br>
        <label><input type="radio" name="q\${qNum}" value="YES"> YES</label>
        <label><input type="radio" name="q\${qNum}" value="NO"> NO</label>
        <label><input type="radio" name="q\${qNum}" value="NOT GIVEN"> NOT GIVEN</label></div>\`;
                        qNum++; return;
                    }
                    if (txt.match(/\\[TECAI\\s*Type\\s*3\\]/i)) {
                        let temp = document.createElement("div");
                        temp.innerHTML = line;
                        let parts = temp.textContent.split(/\\[TECAI\\s*Type\\s*3\\]/i);
                        let out = "";
                        parts.forEach((t, i) => {
                            out += t;
                            if (i < parts.length - 1) out += \`<input name="q\${qNum}_\${i}" style="width:120px;">\`;
                        });
                        rightHTML += \`<div id="q\${qNum}"><b>\${qNum}.</b> \${out}</div>\`;
                        qNum++; return;
                    }
                    if (txt.match(/\\[TECAI\\s*TYPE\\s*4\\s*SET\\s*\\d+\\]/i)) {
                        let mod = line.replace(/\\[TECAI\\s*TYPE\\s*4\\s*SET\\s*(\\d+)\\]/gi, (m, id) => \`<span class="dropzone" data-set="\${currentSection + "_" + id}"></span>\`);
                        rightHTML += \`<p id="q\${qNum}"><b>\${qNum}.</b> \${mod}</p>\`;
                        qNum++; return;
                    }
                    if (txt.match(/\\[TECAI\\s*Type\\s*5\\]/i)) {
                        let clean = txt.replace(/\\[TECAI\\s*Type\\s*5\\]/i, "");
                        rightHTML += \`<div id="q\${qNum}"><b>\${qNum}.</b> \${clean}<br>\`;
                        return;
                    }
                    if (txt.match(/\\[TECAI\\s*TYPE\\s*5\\.1\\s*OPTIONS\\]/i)) {
                        let opts = txt.replace(/\\[TECAI\\s*TYPE\\s*5\\.1\\s*OPTIONS\\]/i, "").split("/").map(o => o.trim());
                        let targetQ = qNum;
                        opts.forEach(opt => rightHTML += \`<label><input type="radio" name="q\${targetQ}" value="\${opt}"> \${opt}</label><br>\`);
                        rightHTML += \`</div>\`;
                        qNum++; return;
                    }
                    if (txt.match(/\\[TECAI\\s*TYPE\\s*5\\.2\\s*OPTIONS\\]/i)) {
                        let opts = txt.replace(/\\[TECAI\\s*TYPE\\s*5\\.2\\s*OPTIONS\\]/i, "").split("/").map(o => o.trim());
                        let targetQ = qNum;
                        opts.forEach(opt => rightHTML += \`<label><input type="checkbox" name="q\${targetQ}" value="\${opt}"> \${opt}</label><br>\`);
                        rightHTML += \`</div>\`;
                        qNum++; return;
                    }
                    if (txt.match(/\\[TECAI\\s*Type\\s*6\\]/i)) {
                        let temp = document.createElement("div");
                        temp.innerHTML = line;
                        let parts = temp.textContent.split(/\\[TECAI\\s*Type\\s*6\\]/i);
                        let out = "";
                        let startQ = qNum;
                        parts.forEach((t, i) => {
                            out += t;
                            if (i < parts.length - 1) {
                                out += \`<b id="q\${qNum}">\${qNum}.</b><input name="q\${qNum}" style="width:120px; margin:0 5px;">\`;
                                qNum++;
                            }
                        });
                        rightHTML += \`<div id="q\${startQ}">\${out}</div>\`;
                        return;
                    }
                    if (txt.match(/\\[TECAI\\s*TYPE\\s*7\\]/i) && !txt.match("OPTIONS")) {
                        let clean = txt.replace(/\\[TECAI\\s*TYPE\\s*7\\]/i, "").trim();
                        rightHTML += \`<div id="q\${qNum}"> <b>\${qNum}.</b> \${clean}\`;
                        return;
                    }

                    if (txt.match(/\\[TECAI\\s*TYPE\\s*7\\s*OPTIONS\\]/i)) {
                        return;
                    }

                    let prevP = content[content.indexOf(p)-1];
                    if (prevP && prevP.text.match(/\\[TECAI\\s*TYPE\\s*7\\s*OPTIONS\\]/i) && !txt.match("END")) {
                        let options = txt.split("/").map(o => o.trim());

                        let selectHTML = \`<select name = "q\${qNum}" style = "margin-left:10px; padding:4px;" >
            <option value="">Select...</option>\`;
                        options.forEach(opt => {
                            selectHTML += \`<option value = "\${opt}" > \${opt}</option> \`;
                        });
                        selectHTML += \`</select></div> \`;

                        rightHTML += selectHTML;
                        qNum++;
                        return;
                    }

                    // TYPE 8 (Multi-Select with Range Numbering)
                    if (txt.match(/\\[TECAI\\s*TYPE\\s*8\\]/i)) {
                        let limit = 2; // Default
                        for (let i = content.indexOf(p); i < content.length; i++) {
                            let peek = content[i].text;
                            let m = peek.match(/\\[TECAI\\s*TYPE\\s*8\\.(\\d+)\\s*OPTIONS\\]/i);
                            if (m) {
                                limit = parseInt(m[1]);
                                break;
                            }
                        }

                        // 2. Format the range label (e.g., 41 – 42)
                        let qRange = (limit > 1) ? \`\${qNum}–\${qNum+limit-1}\` : \`\${qNum}\`;
                        let clean = txt.replace(/\\[TECAI\\s*TYPE\\s*8\\]/i, "");

                        // 3. Add 'type-8-group' class and data-limit for the Navigation function to find
                        rightHTML += \`<div id="q\${qNum}" class="question-container type-8-group" data-limit="\${limit}">
                    <b>\${qRange}.</b> \${clean}<br>\`;
                        return;
                    }

                    if (txt.match(/\\[TECAI\\s*TYPE\\s*8\\.(\\d+)\\s*OPTIONS\\]/i)) {
                        let match = txt.match(/8\\.(\\d+)/);
                        let limit = match ? parseInt(match[1]) : 2;
                        let opts = txt.replace(/\\[TECAI\\s*TYPE\\s*8\\.\\d+\\s*OPTIONS\\]/i, "").split("/").map(o => o.trim());

                        opts.forEach(opt => {
                            rightHTML += \`
            <label style="display:block; margin: 5px 0;">
                <input type="checkbox" name="q\${qNum}" value="\${opt}" onchange="limitCheckboxes(this, \${limit})"> 
                \${opt}
            </label>\`;
                        });

                        rightHTML += \`</div>\`;
                        qNum += limit; // Increment counter by the number of questions covered
                        return;
                    }

                    rightHTML += \`<p>\${line}</p>\`;
                } else {
                    leftHTML += \`<p>\${p.html}</p>\`;
                }
            });

            document.getElementById("rightPanel").innerHTML = rightHTML;
            document.getElementById("leftPanel").innerHTML = leftHTML;
            createNav();
        }

        document.addEventListener("dragstart", e => {
            let el = e.target.closest(".draggable");
            if (el) e.dataTransfer.setData("id", el.id);
        });

        document.addEventListener("dragover", e => {
            if (e.target.closest(".dropzone") || e.target.closest(".drag-container")) e.preventDefault();
        });

        document.addEventListener("drop", e => {
            e.preventDefault();
            let el = document.getElementById(e.dataTransfer.getData("id"));
            if (!el) return;
            let drop = e.target.closest(".dropzone");
            let container = e.target.closest(".drag-container");
            let set = el.dataset.set;

            if (drop) {
                if (set !== drop.dataset.set) return alert("Wrong set");
                if (drop.firstChild) document.getElementById("set_" + set).appendChild(drop.firstChild);
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
                let label = i.toString();

                // Check if this is a Type 8 range
                if (container && container.classList.contains("type-8-group")) {
                    let limit = parseInt(container.getAttribute("data-limit") || "1");
                    if (limit > 1) {
                        label = \`\${i}–\${i+limit-1}\`;
                        // Skip the hidden numbers in the range
                        for (let j = 1; j < limit; j++) {
                            processedQs.add(i + j);
                        }
                    }
                }

                btn.innerText = label;
                btn.onclick = () => {
                    document.getElementById(\`q\${i}\`).scrollIntoView({ behavior: "smooth" });
                };
                nav.appendChild(btn);
            }
        }

        function limitCheckboxes(el, max) {
            let name = el.name;
            let checkboxes = document.querySelectorAll(\`input[name="\${name}"]\`);
            let checkedCount = document.querySelectorAll(\`input[name="\${name}"]:checked\`).length;

            checkboxes.forEach(cb => {
                if (checkedCount >= max) {
                    // If limit reached, disable all UNCHECKED boxes
                    if (!cb.checked) {
                        cb.disabled = true;
                    }
                } else {
                    // If below limit, ensure all boxes are enabled
                    cb.disabled = false;
                }
            });
        }

        function buildAnswerText() {
            const now = new Date().toLocaleString();
            return \`Name: \${studentName} \\nDate: \${now} \\nAnswers: \\n      \\n\${collectAnswers()}\\n\\nSelf Assessment:\\n[ ] Confident\\n[ ] Need Practice\\n[ ] Time Management Issue\\n\`;
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
                    data.push(\`\${i}. \`);
                    continue;
                }

                if (qDiv.classList.contains("type-8-group")) {
                    let limit = parseInt(qDiv.getAttribute("data-limit"));
                    let checked = qDiv.querySelectorAll('input:checked');
                    let values = Array.from(checked).map(c => c.value);

                    let rangeLabel = (limit > 1) ? \`\${i}–\${i + limit - 1}\` : \`\${i}\`;
                    data.push(\`\${rangeLabel}. \${values.join(" | ") || " "}\`);

                    i += (limit - 1); // Skip indices covered by range
                    continue;
                }

                let drops = qDiv.querySelectorAll(".dropzone");
                if (drops.length > 0) {
                    let values = [];
                    drops.forEach(d => {
                        let dragged = d.querySelector(".draggable");
                        values.push(dragged ? dragged.innerText.trim() : " ");
                    });
                    data.push(\`\${i}. \${values.join(" | ")}\`);
                    continue;
                }

                let checkedInputs = qDiv.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
                if (checkedInputs.length > 0) {
                    let values = Array.from(checkedInputs).map(input => input.value);
                    data.push(\`\${i}. \${values.join(" | ")}\`);
                    continue;
                }

                let dropdown = qDiv.querySelector("select");
                if (dropdown) {
                    data.push(\`\${i}. \${dropdown.value.trim() || " "}\`);
                    continue;
                }

                let textInputs = qDiv.querySelectorAll('input[type="text"], input:not([type])');
                if (textInputs.length > 0) {
                    textInputs.forEach(inp => {
                        let nameMatch = inp.name.match(/q(\\d+)/);
                        let currentNum = nameMatch ? nameMatch[1] : i;

                        data.push(\`\${currentNum}. \${inp.value.trim() || " "}\`);
                    });

                    if (textInputs.length > 1) {
                        let lastInpName = textInputs[textInputs.length - 1].name.match(/q(\\d+)/);
                        if (lastInpName) {
                            i = parseInt(lastInpName[1]);
                        }
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

        window.addEventListener("load", () => {
            document.getElementById("timer").innerText = formatTime(totalSeconds);
            if (autoStart) fetchAndParseDocx();
            else fetchAndParseDocx(); // We can start parsing right away
        });
    </script>
</body>
</html>`;

        setHtmlContent(html);
    }, [content, studentName, autoStart, allowSave]);

    return (
        <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            style={{ width: "100vw", height: "100vh", border: "none" }}
            title="TECAI Reading Exam"
        />
    );
}