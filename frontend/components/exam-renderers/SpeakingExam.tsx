"use client";

import { useEffect, useRef, useState } from "react";
import { Content } from "@/types/lms";

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

interface SpeakingExamProps {
    content: Content;
    studentName: string;
    autoStart: boolean;
    allowSave: boolean;
}

export function SpeakingExam({
    content,
    studentName,
    autoStart,
    allowSave
}: SpeakingExamProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [htmlContent, setHtmlContent] = useState<string>("");

    useEffect(() => {
        const fileUrl = content.file_url || "";
        const sourceLabel = content.title || "Speaking Exam";
        const initialSeconds = Number(content.duration || 60) * 60;

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TEC Speaking Module</title>
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
        .container { position: fixed; top: 115px; bottom: 60px; width: 100%; padding: 20px; overflow-y: auto; text-align: center; }
    </style>
</head>
<body>
    <header>
        <h2>Tajinder's English Classes</h2>
        <h4>Speaking Module</h4>
    </header>

    <div class="controls">
        <span class="source-name" style="margin-right: 15px;">${escapeHtml(studentName)}</span>
        <span class="source-name" style="margin-right: 15px;">${escapeHtml(sourceLabel)}</span>
        <button onclick="submitTest()">Submit</button>
        <span class="timer" id="timer">60:00</span>
    </div>

    <div class="container" id="mainContent">
        <h3>Speaking Exam Placeholder</h3>
        <p>File URL: <a href="${escapeHtml(fileUrl)}" target="_blank">${escapeHtml(fileUrl)}</a></p>
        <p>Parsing logic to be implemented...</p>
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
                const userinfo = "Name: ${escapeHtml(studentName)} \\nDate: " + new Date().toLocaleString() + " \\nAnswer: \\n[Speaking Submission]";
                const blob = new Blob([userinfo], { type: "text/plain" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = \`Speaking_\${Date.now()}.txt\`;
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
            title="TECAI Speaking Exam"
        />
    );
}
