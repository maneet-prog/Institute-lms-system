"use client";

import { useEffect, useRef, useState } from "react";
import { useSubmitStudentContentMutation } from "@/hooks/useLmsQueries";
import { Content, StudentSubmission } from "@/types/lms";

import { ReadingExam } from "../exam-renderers/ReadingExam";
import { WritingExam } from "../exam-renderers/WritingExam";
import { ListeningExam } from "../exam-renderers/ListeningExam";
import { SpeakingExam } from "../exam-renderers/SpeakingExam";

export function TecaiExamFrame({
    content,
    submission,
    studentName = "Student",
    autoStart = false,
    allowSave = false
}: {
    content: Content;
    // kept for backward compatibility if passed (not used in this component)
    renderer?: unknown;
    submission?: StudentSubmission | null;
    studentName?: string;
    autoStart?: boolean;
    allowSave?: boolean;
}) {
    const [latestSubmission, setLatestSubmission] = useState<StudentSubmission | null>(submission ?? null);
    const isSubmittingRef = useRef(false);
    const submitResponse = useSubmitStudentContentMutation();

    const attemptLimit = content.quiz?.attempt_limit ?? 999;
    const attemptsUsed = latestSubmission?.attempts?.length ?? 0;
    const isLocked = allowSave && attemptsUsed >= attemptLimit;

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
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

    const examType = content.category || "reading";

    if (examType === "writing") {
        return <WritingExam content={content} studentName={studentName} autoStart={autoStart} allowSave={allowSave && !isLocked} />;
    }
    if (examType === "listening") {
        return <ListeningExam content={content} studentName={studentName} autoStart={autoStart} allowSave={allowSave && !isLocked} />;
    }
    if (examType === "speaking") {
        return <SpeakingExam content={content} studentName={studentName} autoStart={autoStart} allowSave={allowSave && !isLocked} />;
    }

    return <ReadingExam content={content} studentName={studentName} autoStart={autoStart} allowSave={allowSave && !isLocked} />;
}
