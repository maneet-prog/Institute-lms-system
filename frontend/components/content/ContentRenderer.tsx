"use client";

import { Content, StudentWorkspaceContent } from "@/types/lms";

import { QuizContent } from "@/components/content/QuizContent";

function getUrl(content: Content | StudentWorkspaceContent) {
  return content.resolved_url ?? content.file_url ?? content.external_url ?? content.url ?? "";
}

function getYoutubeEmbedUrl(url: string) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export function ContentRenderer({ content }: { content: Content | StudentWorkspaceContent }) {
  const url = getUrl(content);

  if (content.type === "video") {
    const youtubeEmbed = content.external_url ? getYoutubeEmbedUrl(content.external_url) : null;
    return url ? (
      <div className="space-y-3">
        {youtubeEmbed ? (
          <iframe
            src={youtubeEmbed}
            className="aspect-video w-full rounded-xl border"
            title={content.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video controls className="w-full rounded-xl bg-slate-950">
            <source src={url} />
          </video>
        )}
        {content.external_url ? (
          <a href={content.external_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700 hover:underline">
            Open external video
          </a>
        ) : null}
      </div>
    ) : null;
  }

  if (content.type === "audio") {
    return (
      <audio controls className="w-full">
        <source src={url} />
      </audio>
    );
  }

  if (content.type === "pdf" || content.type === "document") {
    return (
      <div className="space-y-3">
        {url ? <iframe src={url} className="h-[480px] w-full rounded-xl border" title={content.title} /> : null}
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700 hover:underline">
            Open document in new tab
          </a>
        ) : null}
      </div>
    );
  }

  if (content.type === "quiz") {
    return <QuizContent content={content} />;
  }

  return (
    <div className="space-y-3">
      {content.description ? (
        <div
          className="prose prose-slate max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: content.description }}
        />
      ) : content.body_text ? (
        <p className="whitespace-pre-wrap text-sm text-slate-700">{content.body_text}</p>
      ) : null}
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700 hover:underline">
          Open attached resource
        </a>
      ) : null}
    </div>
  );
}
