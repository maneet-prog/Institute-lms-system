"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useSubmitStudentContentMutation } from "@/hooks/useLmsQueries";
import { Content, StudentSubmission, TecaiQuizRenderer } from "@/types/lms";

const escapeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

function buildTecaiExamHtml({
    sourceLabel,
    renderer,
    studentName,
    autoStart,
    allowSave
}: {
    sourceLabel: string;
    renderer: Extract<TecaiQuizRenderer, { kind: "tecai_reading" }>;
    studentName: string;
    autoStart: boolean;
    allowSave: boolean;
}) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TEC Reading Module v1.10</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: "Segoe UI", Arial;
            height: 100vh;
            overflow: hidden;
            background: #f5f7fb;
        }

        header {
            position: fixed;
            top: 0;
            width: 100%;
            height: 60px;
            background: #0b1f3a;
            color: white;
            padding: 10px 20px;
            z-index: 1000;
        }

        header h2 {
            margin: 0;
            font-size: 18px;
        }

        header h4 {
            margin: 2px 0 0;
            font-size: 13px;
            opacity: 0.8;
        }

        .controls {
            position: fixed;
            top: 60px;
            width: 100%;
            height: 55px;
            background: white;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 15px;
            border-bottom: 1px solid #ddd;
            z-index: 999;
        }

        button {
            background: #0b1f3a;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
        }

        button:hover {
            background: #163d6b;
        }

        input[type="file"] {
            padding: 4px;
        }

        .source-name {
            font-size: 14px;
            color: #1f2937;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 240px;
        }

        .timer {
            margin-left: auto;
            font-weight: bold;
            color: #e63946;
        }

        .container {
            position: fixed;
            top: 115px;
            bottom: 60px;
            width: 100%;
            display: flex;
        }

        .left,
        .right {
            width: 50%;
            padding: 15px;
            overflow-y: auto;
        }

        .left {
            background: white;
            border-right: 1px solid #ddd;
        }

        .right {
            background: #fafbff;
        }

        .right div[id^="q"] {
            background: white;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
        }

        .drag-container {
            border: 2px dashed #bbb;
            padding: 10px;
            margin: 10px 0;
            min-height: 40px;
            border-radius: 6px;
        }

        .draggable {
            display: inline-block;
            padding: 5px 10px;
            margin: 5px;
            background: #0b1f3a;
            color: white;
            border-radius: 5px;
            cursor: grab;
        }

        .dropzone {
            display: inline-block;
            min-width: 120px;
            min-height: 25px;
            border-bottom: 2px solid #000;
            margin: 0 5px;
        }

        .question-nav {
            position: fixed;
            bottom: 0;
            width: 100%;
            height: 60px;
            background: white;
            border-top: 1px solid #ddd;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 6px;
            padding: 5px;
            overflow-x: auto;
        }

        .question-nav button {
            width: 35px;
            height: 35px;
            border-radius: 6px;
            background: #edf1f7;
            color: #333;
            font-weight: 600;
        }

        .question-nav button:hover {
            background: #0b1f3a;
            color: white;
        }
    </style>
</head>

<body>

    <header>
        <h2>Tajinder's English Classes</h2>
        <h4>Reading Module</h4>
    </header>

    <div class="controls">
        <span class="source-name" style="margin-right: 15px;">${escapeHtml(studentName)}</span>
        <input type="file" id="fileInput" disabled hidden>
        <span class="source-name" style="margin-right: 15px;">${escapeHtml(sourceLabel)}</span>
        <button onclick="submitTest()">Submit</button>
        <span class="timer" id="timer">60:00</span>
    </div>

    <div class="container">
        <div class="left" id="leftPanel"></div>
        <div class="right" id="rightPanel"></div>
    </div>

    <div class="question-nav" id="nav"></div>

    <script>
        const preloadedParagraphs = ${escapeJson(renderer.paragraphs)};
        const initialSeconds = ${Number(renderer.timer_seconds || 3600) || 3600};
        const autoStart = ${autoStart ? "true" : "false"};
        const allowSave = ${allowSave ? "true" : "false"};

        let studentName = "${escapeHtml(studentName)}";
        let qNum = 1;
        let type4Answers = {};
        let renderedSets = new Set();
        let totalSeconds = initialSeconds;
        let timerInterval;

        function formatTime(total) {
            let m = Math.floor(total / 60);
            let s = total % 60;
            return \`\${m}:\${s < 10 ? '0' + s : '' + s}\`;
        }

        function setName() {
            let name = prompt("Enter student name:", studentName);
            if (name) studentName = name;
        }

        async function startTest() {
            const paragraphs = preloadedParagraphs;
            if (!paragraphs || !paragraphs.length) return alert("Exam data not found");

            clearInterval(timerInterval);
            totalSeconds = initialSeconds;
            document.getElementById("timer").innerText = formatTime(totalSeconds);

            process(paragraphs);
            startTimer();
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

            const answerRegex = /\\[TECAI\\s*TYPE\\s*4\\s*ANSWER\\s*SET\\s*(\\d+)\\]/i;
            const optionRegex = /\\[TECAI\\s*TYPE\\s*4\\s*OPTIONS\\s*START\\s*SET\\s*(\\d+)\\]/i;

            let tempSection = 0;

            content.forEach(p => {
                let txt = p.text || "";

                if (txt.includes("[TECAI START]")) {
                    tempSection++;
                    return;
                }
                if (txt.includes("[TECAI END]")) return;

                let m = txt.match(answerRegex);
                if (m) {
                    let id = m[1];
                    let sectionId = tempSection + "_" + id;

                    let clean = txt.replace(answerRegex, "").trim();

                    if (!type4Answers[sectionId]) {
                        type4Answers[sectionId] = [];
                    }

                    type4Answers[sectionId].push(clean);
                }
            });

            content.forEach(p => {
                let txt = p.text || "";

                if (txt.includes("[TECAI START]")) { inBlock = true; currentSection++; return; }
                if (txt.includes("[TECAI END]")) { inBlock = false; return; }

                if (p.type === "table" || /^<table[\\s>]/i.test(p.html || "")) {
                    if (inBlock) {
                        rightHTML += p.html;
                    } else {
                        leftHTML += p.html;
                    }
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
                            rightHTML += \`<div><b>Options:</b>
          <div class="drag-container" data-set="\${sectionId}" id="set_\${sectionId}">\`;

                            (type4Answers[sectionId] || []).forEach((it, i) => {
                                rightHTML += \`<div class="draggable" draggable="true"
            data-set="\${sectionId}" id="drag_\${sectionId}_\${i}">\${it}</div>\`;
                            });

                            rightHTML += \`</div></div>\`;
                            renderedSets.add(sectionId);
                        }
                        return;
                    }

                    if (txt.includes("[TECAI Type 1]")) {
                        let clean = line.replace(/\\[TECAI Type 1\\]/i, "");
                        rightHTML += \`<div id="q\${qNum}">
        <b>\${qNum}.</b> \${clean}<br>
        <label><input type="radio" name="q\${qNum}" value="TRUE"> TRUE</label>
        <label><input type="radio" name="q\${qNum}" value="FALSE"> FALSE</label>
        <label><input type="radio" name="q\${qNum}" value="NOT GIVEN"> NOT GIVEN</label>
        </div>\`;
                        qNum++;
                        return;
                    }

                    if (txt.includes("[TECAI Type 2]")) {
                        let clean = line.replace(/\\[TECAI Type 2\\]/i, "");
                        rightHTML += \`<div id="q\${qNum}">
        <b>\${qNum}.</b> \${clean}<br>
        <label><input type="radio" name="q\${qNum}" value="YES"> YES</label>
        <label><input type="radio" name="q\${qNum}" value="NO"> NO</label>
        <label><input type="radio" name="q\${qNum}" value="NOT GIVEN"> NOT GIVEN</label>
        </div>\`;
                        qNum++;
                        return;
                    }

                    if (txt.includes("[TECAI Type 3]")) {
                        let temp = document.createElement("div");
                        temp.innerHTML = line;
                        let parts = temp.textContent.split(/\\[TECAI Type 3\\]/i);
                        let out = "";
                        parts.forEach((t, i) => {
                            out += t;
                            if (i < parts.length - 1) {
                                out += \`<input name="q\${qNum}_\${i}" style="width:120px;">\`;
                            }
                        });

                        rightHTML += \`<div id="q\${qNum}"><b>\${qNum}.</b> \${out}</div>\`;
                        qNum++;
                        return;
                    }

                    if (txt.match(/\\[TECAI\\s*TYPE\\s*4\\s*SET\\s*\\d+\\]/i)) {
                        let mod = line.replace(/\\[TECAI\\s*TYPE\\s*4\\s*SET\\s*(\\d+)\\]/gi,
                            (m, id) => \`<span class="dropzone" data-set="\${currentSection + "_" + id}"></span>\`
                        );
                        rightHTML += \`<p id="q\${qNum}"><b>\${qNum}.</b> \${mod}</p>\`;
                        qNum++;
                        return;
                    }

                    if (txt.includes("[TECAI Type 5]")) {
                        let clean = line.replace(/\\[TECAI Type 5\\]/i, "");
                        rightHTML += \`<div id="q\${qNum}"><b>\${qNum}.</b> \${clean}<br>\`;
                        return;
                    }

                    if (txt.includes("[TECAI TYPE 5.1 OPTIONS]")) {
                        let opts = txt.replace(/\\[TECAI TYPE 5.1 OPTIONS\\]/i, "").split("/").map(o => o.trim());
                        let targetQ = qNum;

                        opts.forEach(opt => {
                            rightHTML += \`<label><input type="radio" name="q\${targetQ}" value="\${opt}"> \${opt}</label><br>\`;
                        });

                        rightHTML += \`</div>\`;
                        qNum++;
                        return;
                    }

                    if (txt.includes("[TECAI TYPE 5.2 OPTIONS]")) {
                        let opts = txt.replace(/\\[TECAI TYPE 5.2 OPTIONS\\]/i, "").split("/").map(o => o.trim());
                        let targetQ = qNum;

                        opts.forEach(opt => {
                            rightHTML += \`<label><input type="checkbox" name="q\${targetQ}" value="\${opt}"> \${opt}</label><br>\`;
                        });

                        rightHTML += \`</div>\`;
                        qNum++;
                        return;
                    }

                    if (txt.includes("[TECAI Type 6]")) {

                        let temp = document.createElement("div");
                        temp.innerHTML = line;

                        let parts = temp.textContent.split(/\\[TECAI Type 6\\]/i);

                        let out = "";
                        let startQ = qNum;

                        parts.forEach((t, i) => {
                            out += t;

                            if (i < parts.length - 1) {

                                out += \`<b id="q\${qNum}">\${qNum}.</b> 
            <input name="q\${qNum}" style="width:120px; margin:0 5px;">\`;

                                qNum++;
                            }
                        });

                        rightHTML += \`<div id="q\${startQ}">\${out}</div>\`;

                        return;
                    }


                    rightHTML += \`<p>\${line}</p>\`;
                }
                else {
                    leftHTML += \`<p>\${p.html}</p>\`;
                }
            });

            document.getElementById("rightPanel").innerHTML = rightHTML;
            document.getElementById("leftPanel").innerHTML = leftHTML;

            createNav(qNum - 1);
        }

        document.addEventListener("dragstart", e => {
            let el = e.target.closest(".draggable");
            if (el) e.dataTransfer.setData("id", el.id);
        });

        document.addEventListener("dragover", e => {
            if (e.target.closest(".dropzone") || e.target.closest(".drag-container")) {
                e.preventDefault();
            }
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
                if (drop.firstChild) {
                    document.getElementById("set_" + set).appendChild(drop.firstChild);
                }
                drop.innerHTML = "";
                drop.appendChild(el);
            }
            else if (container) {
                if (set !== container.dataset.set) return alert("Wrong set");
                container.appendChild(el);
            }
        });

        function createNav(n) {
            let nav = "";
            for (let i = 1; i <= n; i++) {
                nav += \`<button onclick="document.getElementById('q\${i}').scrollIntoView()">\${i}</button>\`;
            }
            document.getElementById("nav").innerHTML = nav;
        }

        function buildAnswerText() {
            const now = new Date().toLocaleString();

            return \`Name: \${studentName} 
Date: \${now} 
Answers: 
      
\${collectAnswers()}

Self Assessment:
[ ] Confident
[ ] Need Practice
[ ] Time Management Issue
\`;
        }

        function downloadAnswers() {
            const content = buildAnswerText();

            const blob = new Blob([content], { type: "text/plain" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = \`\${studentName}_\${Date.now()}.txt\`;
            a.click();

            if (allowSave && window.parent) {
                window.parent.postMessage({
                    type: "tecai-submit",
                    responseText: content
                }, "*");
            }
        }

        function collectAnswers() {
            let data = [];
            for (let i = 1; i < qNum; i++) {
                let checkedInputs = document.querySelectorAll(\`input[name="q\${i}"]:checked\`);
                
                let textInputs = document.querySelectorAll(\`
                    input[name="q\${i}"]:not([type="radio"]):not([type="checkbox"]),
                    input[name^="q\${i}_"]:not([type="radio"]):not([type="checkbox"])
                \`);

                let qDiv = document.getElementById(\`q\${i}\`);
                let drops = qDiv ? qDiv.querySelectorAll(".dropzone") : [];

                if (checkedInputs.length > 0) {
                    let values = [];
                    checkedInputs.forEach(input => values.push(input.value));
                    data.push(\`\${i}. \${values.join(" | ")}\`);
                }
                else if (textInputs.length > 0) {
                    let values = [];
                    textInputs.forEach(inp => values.push(inp.value.trim() || " "));
                    data.push(\`\${i}. \${values.join(" | ")}\`);
                }
                else if (drops.length > 0) {
                    let values = [];
                    drops.forEach(d => {
                        let dragged = d.querySelector(".draggable");
                        values.push(dragged ? dragged.innerText.trim() : " ");
                    });
                    data.push(\`\${i}. \${values.join(" | ")}\`);
                }
                else {
                    data.push(\`\${i}. \`);
                }
            }
            return data.join("\\n");
        }

        function submitTest() {
            if (confirm("Are you sure you want to submit?")) {
                downloadAnswers();
            }
        }

        window.addEventListener("load", () => {
            document.getElementById("timer").innerText = formatTime(totalSeconds);
            if (autoStart) {
                startTest();
            }
        });
    </script>

</body>
</html>`;
}

function buildTecaiWritingHtml({
    sourceLabel,
    renderer,
    studentName,
    autoStart,
    allowSave
}: {
    sourceLabel: string;
    renderer: Extract<TecaiQuizRenderer, { kind: "tecai_writing" }>;
    studentName: string;
    autoStart: boolean;
    allowSave: boolean;
}) {
    const writingBlocks = Array.isArray(renderer.blocks) ? renderer.blocks : [];
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TEC Reading Module v1.10</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: "Segoe UI", Arial;
            height: 100vh;
            overflow: hidden;
            /* ❌ NO PAGE SCROLL */
            background: #f5f7fb;
        }

        /* HEADER */
        header {
            position: fixed;
            top: 0;
            width: 100%;
            height: 60px;
            background: #0b1f3a;
            color: white;
            padding: 10px 20px;
            z-index: 1000;
        }

        header h2 {
            margin: 0;
            font-size: 18px;
        }

        header h4 {
            margin: 2px 0 0;
            font-size: 13px;
            opacity: 0.8;
        }

        /* CONTROLS */
        .controls {
            position: fixed;
            top: 60px;
            width: 100%;
            height: 55px;
            background: white;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 15px;
            border-bottom: 1px solid #ddd;
            z-index: 999;
        }

        button {
            background: #0b1f3a;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
        }

        button:hover {
            background: #163d6b;
        }

        .timer {
            margin-left: auto;
            font-weight: bold;
            color: #e63946;
        }

        /* MAIN CONTENT AREA */
        .container {
            position: fixed;
            top: 115px;
            /* header + controls */
            bottom: 60px;
            /* nav height */
            width: 100%;
            display: flex;
        }

        .left,
        .right {
            width: 50%;
            padding: 15px;
            overflow-y: auto;
            /* ✅ INTERNAL SCROLL ONLY */
        }

        .left {
            background: white;
            border-right: 1px solid #ddd;
        }

        .right {
            background: #fafbff;
        }

        img {
            width: 70%;
            height: auto;
            margin: 10px 0;
        }

        #essayBox {
            width: 100%;
            height: 80%;
            padding: 15px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 8px;
            resize: none;
            line-height: 1.6;
        }

        .word-count {
            margin-left: auto;
            font-weight: bold;
            color: #0b1f3a;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        td {
            border: 1px solid #ccc;
            padding: 8px;
        }
    </style>
</head>
<body>
    <header>
        <h2>Tajinder's English Classes</h2>
        <h4>Writing Module</h4>
    </header>

    <div class="controls">
        <span>${escapeHtml(studentName)}</span>
        <span>${escapeHtml(sourceLabel)}</span>
        <button onclick="submitEssay()">Submit</button>
        <span class="word-count" id="wordCounter">Words: 0</span>
        <span class="timer" id="timer">60:00</span>
    </div>

    <div class="container">
        <div class="left" id="left"></div>
        <div class="right">
            <h3>Your Response:</h3>
            <textarea id="essayBox" placeholder="Start writing your essay here..."
                oninput="updateWordCount()"></textarea>
        </div>
    </div>

    <script>
        const preloadedContent = ${escapeJson(writingBlocks)};
        const initialSeconds = ${Number(renderer.timer_seconds || 3600) || 3600};
        const autoStart = ${autoStart ? "true" : "false"};
        const allowSave = ${allowSave ? "true" : "false"};

        let studentName = "${escapeHtml(studentName)}";
        let totalSeconds = initialSeconds;
        let timerInterval;
        let startedAt = null;
        let qNum = 1;

        function startTimer() {
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                totalSeconds--;

                let m = Math.floor(totalSeconds / 60);
                let s = totalSeconds % 60;

                document.getElementById("timer").innerText = \`\${m}:\${s < 10 ? '0' + s : '' + s}\`;

                if (totalSeconds <= 0) {
                    clearInterval(timerInterval);
                    submitEssay(true);
                }
            }, 1000);
        }

        async function startWritingTask() {
            let content = preloadedContent;
            if (!content || !content.length) {
                return alert("Exam data not found");
            }

            totalSeconds = initialSeconds;
            startedAt = Date.now();
            document.getElementById("timer").innerText = "60:00";

            renderTask(content);
            startTimer();
        }

        async function parseDocument(xml, zip) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, "application/xml");
            const body = doc.getElementsByTagName("w:body")[0].childNodes;
            let content = [];

            for (let node of body) {
                if (node.nodeName === "w:p") {
                    let p_html = "";
                    const runs = node.getElementsByTagName("w:r");

                    for (let r of runs) {
                        let runText = "";
                        const t = r.getElementsByTagName("w:t")[0];
                        if (t) {
                            runText = t.textContent;

                            if (r.getElementsByTagName("w:b").length > 0) runText = \`<b>\${runText}</b>\`;
                            if (r.getElementsByTagName("w:i").length > 0) runText = \`<i>\${runText}</i>\`;
                            if (r.getElementsByTagName("w:u").length > 0) runText = \`<u>\${runText}</u>\`;

                            p_html += runText;
                        }

                        const drawings = r.getElementsByTagName("w:drawing");
                        for (let d of drawings) {
                            const imgHtml = await getImageHtml(d, zip);
                            if (imgHtml) p_html += imgHtml;
                        }
                    }
                    content.push(p_html);
                }
                if (node.nodeName === "w:tbl") {
                    const tableHTML = await renderTable(node, zip);
                    content.push({ type: "table", html: tableHTML });
                }
            }
            return content;
        }

        async function renderTable(tblNode, zip) {
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

                        for (let t of texts) {
                            fullText += t.textContent;
                        }

                        fullText = fullText.replace(/\\s+/g, " ").trim();

                        let parsed = parseTECAIInline(fullText);

                        html += \`<div>\${parsed}</div>\`;
                    }

                    const drawings = cell.getElementsByTagName("w:drawing");

                    for (let d of drawings) {
                        const imgHtml = await getImageHtml(d, zip);
                        if (imgHtml) html += \`<br>\${imgHtml}\`;
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
                return \`<b>\${qNum++}.</b>
        <input name="q\${qNum - 1}" style="width:100px;margin:0 5px;">\`;
            });

            output = output.replace(/\\[\\s*input\\s*box\\s*\\]/gi, () => {
                return \`<b>\${qNum++}.</b>
        <input name="q\${qNum - 1}" style="width:100px;margin:0 5px;">\`;
            });

            return output;
        }

        async function getImageHtml(drawingNode, zip) {
            if (drawingNode.html) {
                return drawingNode.html;
            }

            const blip = drawingNode.getElementsByTagName("a:blip")[0];
            if (!blip) return null;

            const embedId = blip.getAttribute("r:embed");
            const relsXml = await zip.file("word/_rels/document.xml.rels").async("text");
            const relsDoc = new DOMParser().parseFromString(relsXml, "text/xml");
            const rel = Array.from(relsDoc.getElementsByTagName("Relationship"))
                .find(r => r.getAttribute("Id") === embedId);

            if (rel) {
                const target = rel.getAttribute("Target");
                const blob = await zip.file("word/" + target).async("blob");
                return \`<br><img src="\${URL.createObjectURL(blob)}">\`;
            }
            return null;
        }

        function renderTask(content) {
            const leftPanel = document.getElementById("left");
            leftPanel.innerHTML = "";

            content.forEach(item => {
                if (typeof item === "string") {
                    const p = document.createElement("p");
                    p.innerHTML = item;
                    leftPanel.appendChild(p);
                } else if (item.type === "table") {
                    const div = document.createElement("div");
                    div.innerHTML = item.html;
                    leftPanel.appendChild(div);
                } else if (item.html) {
                    const p = document.createElement("p");
                    p.innerHTML = item.html;
                    leftPanel.appendChild(p);
                }
            });
        }

        function updateWordCount() {
            const text = document.getElementById("essayBox").value.trim();
            const count = text ? text.split(/\\s+/).length : 0;
            document.getElementById("wordCounter").innerText = \`Words: \${count}\`;
        }

        function submitEssay(skipConfirm = false) {
            if (!skipConfirm && !confirm("Are you sure you want to submit?")) {
                return;
            }

            const essay = document.getElementById("essayBox").value;
            const now = new Date().toLocaleString();
            const userinfo = \`Name: \${studentName} 
Date: \${now} 
Answer: 
\${essay}\`;

            if (!allowSave) {
                const blob = new Blob([userinfo], { type: "text/plain" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = \`Essay_\${Date.now()}.txt\`;
                a.click();
            }

            if (allowSave && window.parent) {
                window.parent.postMessage({
                    type: "tecai-submit",
                    responseText: userinfo,
                    examResponses: [
                        {
                            part_id: "writing-response",
                            question_id: null,
                            response_text: essay,
                            response_data: null,
                            word_count: essay.trim() ? essay.trim().split(/\\s+/).length : 0,
                            duration_seconds: 0
                        }
                    ],
                    timeTakenSeconds: startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0
                }, "*");
            }
        }

        window.addEventListener("load", () => {
            document.getElementById("timer").innerText = "60:00";
            if (autoStart) {
                startWritingTask();
            }
        });
    </script>
</body>
</html>`;
}

export function TecaiExamFrame({
    content,
    renderer,
    submission,
    studentName = "Student",
    autoStart = false,
    allowSave = false
}: {
    content: Content;
    renderer: TecaiQuizRenderer;
    submission?: StudentSubmission | null;
    studentName?: string;
    autoStart?: boolean;
    allowSave?: boolean;
}) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [latestSubmission, setLatestSubmission] = useState<StudentSubmission | null>(submission ?? null);
    const isSubmittingRef = useRef(false);
    const submitResponse = useSubmitStudentContentMutation();

    const attemptLimit = content.quiz?.attempt_limit ?? 999;
    const attemptsUsed = latestSubmission?.attempts.length ?? 0;
    const isLocked = allowSave && attemptsUsed >= attemptLimit;
    const srcDoc = useMemo(
        () => {
            if (renderer.kind === "tecai_writing") {
                return buildTecaiWritingHtml({
                    sourceLabel: content.title || "TECAI Writing Exam",
                    renderer,
                    studentName,
                    autoStart,
                    allowSave: allowSave && !isLocked
                });
            }

            return buildTecaiExamHtml({
                sourceLabel: content.title || "TECAI Exam",
                renderer,
                studentName,
                autoStart,
                allowSave: allowSave && !isLocked
            });
        },
        [allowSave, autoStart, content.title, isLocked, renderer, studentName]
    );

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) {
                return;
            }
            if (!allowSave || isLocked) {
                return;
            }

            const data = event.data;
            if (!data || data.type !== "tecai-submit" || typeof data.responseText !== "string") {
                return;
            }
            if (isSubmittingRef.current) {
                return;
            }

            isSubmittingRef.current = true;
            submitResponse.mutate(
                {
                    content_id: content.content_id,
                    response_type: "quiz",
                    response_text: data.responseText,
                    exam_responses: Array.isArray(data.examResponses) ? data.examResponses : undefined,
                    time_taken_seconds:
                        typeof data.timeTakenSeconds === "number" ? data.timeTakenSeconds : undefined
                },
                {
                    onSuccess: (result) => {
                        setLatestSubmission(result);
                        isSubmittingRef.current = false;
                    },
                    onError: () => {
                        isSubmittingRef.current = false;
                    }
                }
            );
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [allowSave, content.content_id, isLocked, submitResponse]);

    if (renderer.kind === "tecai_reading" && !renderer.paragraphs.length) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-sm text-slate-700">
                This TECAI exam does not have any parsed DOCX paragraphs yet.
            </div>
        );
    }

    if (
        renderer.kind === "tecai_writing" &&
        !(Array.isArray(renderer.blocks) && renderer.blocks.length) &&
        !(Array.isArray(renderer.parts) && renderer.parts.length)
    ) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-sm text-slate-700">
                This TECAI writing exam does not have any parsed DOCX content yet.
            </div>
        );
    }

    if (isLocked) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
                <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-xl font-semibold text-slate-900">Attempt limit reached</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        You have already used {attemptsUsed}/{attemptLimit} allowed attempt{attemptLimit > 1 ? "s" : ""} for this exam.
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                        Latest status: {latestSubmission?.review_status || "submitted"}
                        {latestSubmission?.latest_awarded_marks !== null && latestSubmission?.latest_awarded_marks !== undefined
                            ? ` | Marks ${latestSubmission.latest_awarded_marks}`
                            : latestSubmission?.latest_auto_score
                              ? ` | Auto score ${latestSubmission.latest_auto_score}`
                              : ""}
                    </p>
                    {latestSubmission?.feedback ? (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                            Feedback: {latestSubmission.feedback}
                        </div>
                    ) : null}
                    {latestSubmission?.response_text ? (
                        <pre className="mt-4 max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            {latestSubmission.response_text}
                        </pre>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-[#f5f7fb]">
            <iframe ref={iframeRef} title={content.title} srcDoc={srcDoc} className="h-full w-full border-0" />
        </div>
    );
}
