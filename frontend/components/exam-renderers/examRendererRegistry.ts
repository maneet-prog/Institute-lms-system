import type { Content, Course, Module, SubCourse } from "@/types/lms";

/** Declarative rules: first match wins. Keeps course/subtype logic data-driven. */
const VARIANT_RULES: Array<{
    id: string;
    when: (ctx: ExamRoutingContext) => boolean;
}> = [
    {
        id: "ielts-general",
        when: (ctx) =>
            containsIgnoreCase(ctx.courseName, "ielts") &&
            (containsIgnoreCase(ctx.subcourseName, "general") ||
                containsIgnoreCase(ctx.subcourseName, "general training"))
    },
    {
        id: "ielts-academic",
        when: (ctx) =>
            containsIgnoreCase(ctx.courseName, "ielts") &&
            (containsIgnoreCase(ctx.subcourseName, "academic") || containsIgnoreCase(ctx.subcourseName, "ielts academic"))
    },
    {
        id: "pte",
        when: (ctx) => containsIgnoreCase(ctx.courseName, "pte") || containsIgnoreCase(ctx.subcourseName, "pte")
    }
];

export interface ExamRoutingContext {
    courseName?: string | null;
    subcourseName?: string | null;
    /** reading | listening | writing | speaking | general — from module or content */
    moduleCategory?: string | null;
}

export interface ResolvedExamPresentation {
    /** Stable id for styling / future alternate shells (e.g. ielts-general-reading) */
    variantId: string;
}

function containsIgnoreCase(hay: string | null | undefined, needle: string): boolean {
    if (!hay || !needle) return false;
    return hay.toLowerCase().includes(needle.toLowerCase());
}

function slugPart(value: string | null | undefined): string {
    if (!value) return "";
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/**
 * Metadata overrides (from content.exam.metadata or quiz) — optional extension point without API changes.
 */
function metadataOverrides(content: Content): Partial<ExamRoutingContext> {
    const meta = content.exam?.metadata as Record<string, unknown> | undefined;
    if (!meta) return {};
    return {
        courseName: typeof meta.exam_family === "string" ? meta.exam_family : undefined,
        subcourseName: typeof meta.sub_type === "string" ? meta.sub_type : undefined,
        moduleCategory: typeof meta.module_category === "string" ? meta.module_category : undefined
    };
}

export function buildExamRoutingContext(
    content: Content,
    examContext?: { course?: Course; exam_type?: SubCourse; module?: Module }
): ExamRoutingContext {
    const meta = metadataOverrides(content);
    const moduleCategory =
        meta.moduleCategory ??
        content.category ??
        examContext?.module?.exam_type ??
        "reading";

    return {
        courseName: meta.courseName ?? examContext?.course?.course_name ?? null,
        subcourseName: meta.subcourseName ?? examContext?.exam_type?.subcourse_name ?? null,
        moduleCategory
    };
}

export function resolveExamPresentation(ctx: ExamRoutingContext): ResolvedExamPresentation {
    const base =
        VARIANT_RULES.find((rule) => rule.when(ctx))?.id ??
        "default";

    const mod = slugPart(ctx.moduleCategory || "module");
    const variantId = mod ? `${base}:${mod}` : base;

    return { variantId };
}
