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
  autoStart,
  allowSave
}: {
  sourceLabel: string;
  renderer: TecaiQuizRenderer;
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
        <button onclick="setName()">Add Student Name</button>
        <input type="file" id="fileInput" disabled>
        <span class="source-name">${escapeHtml(sourceLabel)}</span>
        <button onclick="startTest()">Start</button>
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

        let studentName = "Student";
        let qNum = 1;
        let type4Answers = {};
        let renderedSets = new Set();
        let totalSeconds = initialSeconds;
        let timerInterval;

        function setName() {
            let name = prompt("Enter student name:");
            if (name) studentName = name;
        }

        async function startTest() {
            const paragraphs = preloadedParagraphs;
            if (!paragraphs || !paragraphs.length) return alert("Exam data not found");

            clearInterval(timerInterval);
            totalSeconds = initialSeconds;
            document.getElementById("timer").innerText = "60:00";

            process(paragraphs);
            startTimer();
        }

        function startTimer() {
            timerInterval = setInterval(() => {
                totalSeconds--;

                let m = Math.floor(totalSeconds / 60);
                let s = totalSeconds % 60;

                document.getElementById("timer").innerText = \`\${m}:\${s < 10 ? '0' + s : '' + s}\`;

                if (totalSeconds <= 0) {
                    clearInterval(timerInterval);
                    downloadAnswers();
                }
            }, 1000);
        }

        function process(paragraphs) {

            let inBlock = false;
            let rightHTML = "", leftHTML = "";
            qNum = 1;
            type4Answers = {};
            renderedSets = new Set();

            const answerRegex = /\\[TECAI\\s*TYPE\\s*4\\s*ANSWER\\s*SET\\s*(\\d+)\\]/i;
            const optionRegex = /\\[TECAI\\s*TYPE\\s*4\\s*OPTIONS\\s*START\\s*SET\\s*(\\d+)\\]/i;

            paragraphs.forEach(p => {
                let m = p.text.match(answerRegex);
                if (m) {
                    let id = m[1];
                    let clean = p.text.replace(answerRegex, "").trim();
                    if (!type4Answers[id]) type4Answers[id] = [];
                    type4Answers[id].push(clean);
                }
            });

            paragraphs.forEach(p => {
                let txt = p.text;

                if (txt.includes("[TECAI START]")) { inBlock = true; return; }
                if (txt.includes("[TECAI END]")) { inBlock = false; return; }

                if (inBlock) {

                    if (txt.match(answerRegex)) return;

                    let line = p.html;

                    let optMatch = txt.match(optionRegex);
                    if (optMatch) {
                        let id = optMatch[1];

                        if (!renderedSets.has(id)) {
                            rightHTML += \`<div><b>Options:</b>
          <div class="drag-container" data-set="\${id}" id="set_\${id}">\`;

                            type4Answers[id].forEach((it, i) => {
                                rightHTML += \`<div class="draggable" draggable="true"
            data-set="\${id}" id="drag_\${id}_\${i}">\${it}</div>\`;
                            });

                            rightHTML += \`</div></div>\`;
                            renderedSets.add(id);
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
                            (m, id) => \`<span class="dropzone" data-set="\${id}"></span>\`
                        );
                        rightHTML += \`<p id="q\${qNum}">\${mod}</p>\`;
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

                let r = document.querySelector(\`input[name="q\${i}"]:checked\`);
                let textInputs = document.querySelectorAll(\`
  input[name="q\${i}"]:not([type="radio"]),
  input[name^="q\${i}_"]:not([type="radio"])
\`);

                let qDiv = document.getElementById(\`q\${i}\`);
                let drops = qDiv ? qDiv.querySelectorAll(".dropzone") : [];

                if (r != null) {
                    data.push(\`\${i}. \${r.value}\`);
                }

                else if (textInputs.length > 0) {
                    let values = [];
                    textInputs.forEach(inp => {
                        values.push(inp.value.trim() || " ");
                    });
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
            if (autoStart) {
                startTest();
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
  autoStart = false,
  allowSave = false
}: {
  content: Content;
  renderer: TecaiQuizRenderer;
  submission?: StudentSubmission | null;
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
    () =>
      buildTecaiExamHtml({
        sourceLabel: content.title || "TECAI Exam",
        renderer,
        autoStart,
        allowSave: allowSave && !isLocked
      }),
    [allowSave, autoStart, content.title, isLocked, renderer]
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
          response_text: data.responseText
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

  if (!renderer.paragraphs.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-sm text-slate-700">
        This TECAI exam does not have any parsed DOCX paragraphs yet.
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
