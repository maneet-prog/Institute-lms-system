"use client";

import { useEffect, useRef, useState } from "react";
import { Content } from "@/types/lms";

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

interface WritingExamProps {
    content: Content;
    studentName: string;
    autoStart: boolean;
    allowSave: boolean;
}

export function WritingExam({
    content,
    studentName,
    autoStart,
    allowSave
}: WritingExamProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [htmlContent, setHtmlContent] = useState<string>("");

    useEffect(() => {
        const fileUrl = content.file_url || "";
        const sourceLabel = content.title || "Writing Exam";
        const initialSeconds = Number(content.duration || 60) * 60;

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TEC Writing Module</title>
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
        img { width: 70%; height: auto; margin: 10px 0; }
        #essayBox { width: 100%; height: 80%; padding: 15px; font-size: 16px; border: 1px solid #ccc; border-radius: 8px; resize: none; line-height: 1.6; }
        .word-count { margin-left: auto; font-weight: bold; color: #0b1f3a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        td { border: 1px solid #ccc; padding: 8px; }
        #loadingOverlay { position: fixed; top: 115px; left: 0; width: 100%; height: calc(100% - 175px); background: rgba(255,255,255,0.9); display: flex; justify-content: center; align-items: center; z-index: 2000; font-size: 18px; color: #333; }
    </style>
</head>
<body>
    <header>
        <h2>Tajinder's English Classes</h2>
        <h4>Writing Module</h4>
    </header>

    <div class="controls">
        <span class="source-name" style="margin-right: 15px;">${escapeHtml(studentName)}</span>
        <span class="source-name" style="margin-right: 15px;">${escapeHtml(sourceLabel)}</span>
        <button onclick="submitEssay()">Submit</button>
        <span class="word-count" id="wordCounter">Words: 0</span>
        <span class="timer" id="timer">60:00</span>
    </div>

    <div class="container">
        <div class="left" id="left"></div>
        <div class="right">
            <h3>Your Response:</h3>
            <textarea id="essayBox" placeholder="Start writing your essay here..." oninput="updateWordCount()"></textarea>
        </div>
    </div>

    <div id="loadingOverlay" style="display: none;">Loading exam content...</div>

    <script>
        const fileUrl = "${escapeHtml(fileUrl)}";
        const initialSeconds = ${initialSeconds};
        const autoStart = ${autoStart ? "true" : "false"};
        const allowSave = ${allowSave ? "true" : "false"};

        let studentName = "${escapeHtml(studentName)}";
        let totalSeconds = initialSeconds;
        let timerInterval;

        function formatTime(total) {
            let m = Math.floor(total / 60);
            let s = total % 60;
            return \`\${m}:\${s < 10 ? '0' + s : '' + s}\`;
        }

        async function fetchAndParseDocx() {
            if (!fileUrl) {
                document.getElementById("left").innerHTML = "Error: No exam file provided.";
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
                renderTask(content);
                startTimer();
            } catch (err) {
                console.error(err);
                document.getElementById("left").innerHTML = "Error loading exam: " + err.message;
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
                            const imgHtml = await getImageHtml(d, zip, relationships);
                            if (imgHtml) p_html += imgHtml;
                        }
                    }
                    content.push(p_html);
                }
                if (node.nodeName === "w:tbl") {
                    const tableHTML = await renderTable(node, zip, relationships);
                    content.push({ type: "table", html: tableHTML });
                }
            }
            return content;
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
                        let parsed = parseTECAIInline(fullText);
                        html += \`<div>\${parsed}</div>\`;
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
            return output;
        }

        async function getImageHtml(drawingNode, zip, relationships) {
            const blip = drawingNode.getElementsByTagName("a:blip")[0];
            if (!blip) return null;
            const embedId = blip.getAttribute("r:embed");
            const rel = relationships.find(r => r.getAttribute("Id") === embedId);
            if (rel) {
                const target = rel.getAttribute("Target");
                const imgFile = zip.file("word/" + target);
                if (imgFile) {
                    const base64 = await imgFile.async("base64");
                    let ext = target.split('.').pop().toLowerCase();
                    let mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
                    return \`<br><img src="data:\${mime};base64,\${base64}">\`;
                }
            }
            return null;
        }

        function renderTask(content) {
            const leftPanel = document.getElementById("left");
            leftPanel.innerHTML = "";
            content.forEach(item => {
                if (typeof item === 'string') {
                    const p = document.createElement("p");
                    p.innerHTML = item;
                    leftPanel.appendChild(p);
                } else if (item.type === "table") {
                    const div = document.createElement("div");
                    div.innerHTML = item.html;
                    leftPanel.appendChild(div);
                }
            });
        }

        function updateWordCount() {
            const text = document.getElementById("essayBox").value.trim();
            const count = text ? text.split(/\\s+/).length : 0;
            document.getElementById("wordCounter").innerText = \`Words: \${count}\`;
        }

        function startTimer() {
            timerInterval = setInterval(() => {
                totalSeconds--;
                document.getElementById("timer").innerText = formatTime(totalSeconds);
                if (totalSeconds <= 0) {
                    clearInterval(timerInterval);
                    submitEssay();
                }
            }, 1000);
        }

        function buildAnswerText() {
            const essay = document.getElementById("essayBox").value;
            const now = new Date().toLocaleString();
            return \`Name: \${studentName} \nDate: \${now} \nAnswer: \n\${essay}\`;
        }

        function submitEssay() {
            if (confirm("Are you sure you want to submit?")) {
                const userinfo = buildAnswerText();
                const blob = new Blob([userinfo], { type: "text/plain" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = \`Essay_\${Date.now()}.txt\`;
                a.click();

                if (allowSave && window.parent) {
                    window.parent.postMessage({ type: "tecai-submit", responseText: userinfo }, "*");
                }
            }
        }

        window.addEventListener("load", () => {
            document.getElementById("timer").innerText = formatTime(totalSeconds);
            if (autoStart) fetchAndParseDocx();
            else fetchAndParseDocx(); 
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
            title="TECAI Writing Exam"
        /> 
    );
}
