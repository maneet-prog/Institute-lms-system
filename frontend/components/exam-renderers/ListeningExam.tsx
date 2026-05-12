"use client";

import { useEffect, useRef, useState } from "react";
import { Content } from "@/types/lms";

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

interface ListeningExamProps {
    content: Content;
    studentName: string;
    autoStart: boolean;
    allowSave: boolean;
}

export function ListeningExam({
    content,
    studentName,
    autoStart,
    allowSave
}: ListeningExamProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");

  useEffect(() => {
    const renderer = content.quiz?.renderer;
    const audioUrl =
      renderer && renderer.kind === "tecai_listening" ? renderer.audio_url || content.external_url || "" : content.external_url || "";
    const promptFileUrl =
      renderer && renderer.kind === "tecai_listening" ? renderer.prompt_file_url || content.file_url || "" : content.file_url || "";
    const instructions =
      renderer && renderer.kind === "tecai_listening" ? renderer.instructions || content.instructions || "" : content.instructions || "";
    const sourceLabel = content.title || "Listening Exam";
    const initialSeconds = Number(content.duration || 60) * 60;

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TEC Listening Module</title>
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
        .container { position: fixed; top: 115px; bottom: 60px; width: 100%; padding: 20px; overflow-y: auto; }
        .panel { max-width: 1024px; margin: 0 auto; display: grid; gap: 16px; }
        .card { background: white; border: 1px solid #d9e2ef; border-radius: 10px; padding: 16px; }
        .label { color: #3f4b5f; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
        .value { margin-top: 8px; color: #1f2937; font-size: 14px; }
        .answer-box { width: 100%; min-height: 180px; padding: 12px; border-radius: 8px; border: 1px solid #c9d3e3; resize: vertical; font-size: 14px; line-height: 1.5; }
    </style>
</head>
<body>
    <header>
        <h2>Tajinder's English Classes</h2>
        <h4>Listening Module</h4>
    </header>

    <div class="controls">
        <span class="source-name" style="margin-right: 15px;">${escapeHtml(studentName)}</span>
        <span class="source-name" style="margin-right: 15px;">${escapeHtml(sourceLabel)}</span>
        <button onclick="submitTest()">Submit</button>
        <span class="timer" id="timer">60:00</span>
    </div>

    <div class="container" id="mainContent">
      <div class="panel">
        <div class="card">
          <div class="label">Instructions</div>
          <div class="value">${escapeHtml(instructions || "Listen carefully and submit your response.")}</div>
        </div>
        <div class="card">
          <div class="label">Audio Source</div>
          <div class="value">
            ${
              audioUrl
                ? `<audio controls style="width:100%; margin-top: 6px;"><source src="${escapeHtml(audioUrl)}"></audio>
                   <div style="margin-top:8px;"><a href="${escapeHtml(audioUrl)}" target="_blank" rel="noopener noreferrer">Open audio in new tab</a></div>`
                : `<span>No audio link configured.</span>`
            }
          </div>
        </div>
        <div class="card">
          <div class="label">Prompt File</div>
          <div class="value">
            ${
              promptFileUrl
                ? `<a href="${escapeHtml(promptFileUrl)}" target="_blank" rel="noopener noreferrer">Open prompt file</a>`
                : `<span>No prompt file uploaded.</span>`
            }
          </div>
        </div>
        <div class="card">
          <div class="label">Your Response</div>
          <textarea id="answerBox" class="answer-box" placeholder="Write your listening answers here..."></textarea>
        </div>
      </div>
    </div>

    <script>
        let totalSeconds = ${initialSeconds};
        let timerInterval;

        function formatTime(total) {
            let m = Math.floor(total / 60);
            let s = total % 60;
            return \`\${m}:\${s < 10 ? '0' + s : '' + s}\`;
        }

        function startTimer() {
            timerInterval = setInterval(() => {
                totalSeconds--;
                document.getElementById("timer").innerText = formatTime(totalSeconds);
                if (totalSeconds <= 0) {
                    clearInterval(timerInterval);
                    submitTest();
                }
            }, 1000);
        }

        function submitTest() {
            if (confirm("Are you sure you want to submit?")) {
                const answer = (document.getElementById("answerBox")?.value || "").trim();
                if (!answer) {
                    alert("Please write your response before submitting.");
                    return;
                }
                const userinfo = "Name: ${escapeHtml(studentName)} \\nDate: " + new Date().toLocaleString() + " \\nAnswer: \\n" + answer;
                const blob = new Blob([userinfo], { type: "text/plain" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = \`Listening_\${Date.now()}.txt\`;
                a.click();

                if (${allowSave ? "true" : "false"} && window.parent) {
                    window.parent.postMessage({ type: "tecai-submit", responseText: userinfo }, "*");
                }
            }
        }

        window.addEventListener("load", () => {
            document.getElementById("timer").innerText = formatTime(totalSeconds);
            if (${autoStart ? "true" : "false"}) startTimer();
            else startTimer();
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
      title="TECAI Listening Exam"
    />
  );
}
