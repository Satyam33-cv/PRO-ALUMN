"use client";

import React, { memo } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { ExternalLink } from "lucide-react";

interface AnnouncementBodyProps {
  content?: string;
  className?: string;
  truncate?: boolean;
}

// Custom sanitizer schema allowing safe HTML tags and attributes
const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a || []),
      "href",
      "target",
      "rel",
      "title",
      "className",
      "class",
    ],
    span: [...(defaultSchema.attributes?.span || []), "className", "class"],
    p: [...(defaultSchema.attributes?.p || []), "className", "class"],
    div: [...(defaultSchema.attributes?.div || []), "className", "class"],
    ul: [...(defaultSchema.attributes?.ul || []), "className", "class"],
    ol: [...(defaultSchema.attributes?.ol || []), "className", "class"],
    li: [...(defaultSchema.attributes?.li || []), "className", "class"],
    code: [...(defaultSchema.attributes?.code || []), "className", "class"],
    strong: [...(defaultSchema.attributes?.strong || []), "className", "class"],
    b: [...(defaultSchema.attributes?.b || []), "className", "class"],
    em: [...(defaultSchema.attributes?.em || []), "className", "class"],
    i: [...(defaultSchema.attributes?.i || []), "className", "class"],
  },
};

export const AnnouncementBody = memo(function AnnouncementBody({
  content = "",
  className = "",
  truncate = false,
}: AnnouncementBodyProps) {
  if (!content || typeof content !== "string") {
    return null;
  }

  // Pre-process content to handle common plain newlines cleanly
  const normalizedContent = content.trim();

  return (
    <div
      className={`announcement-body text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal ${
        truncate ? "line-clamp-2" : ""
      } ${className}`}
    >
      <Markdown
        rehypePlugins={[rehypeRaw, [rehypeSanitize, customSchema]]}
        components={{
          // Paragraph styling
          p: ({ node, ...props }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300" {...props} />
          ),
          // Bold / Strong styling
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-slate-900 dark:text-slate-100" {...props} />
          ),
          b: ({ node, ...props }) => (
            <b className="font-bold text-slate-900 dark:text-slate-100" {...props} />
          ),
          // Italic / Em styling
          em: ({ node, ...props }) => (
            <em className="italic text-slate-800 dark:text-slate-200" {...props} />
          ),
          i: ({ node, ...props }) => (
            <i className="italic text-slate-800 dark:text-slate-200" {...props} />
          ),
          // Links with secure attributes, icon, and responsive hover
          a: ({ node, href, children, ...props }) => {
            const isExternal = href?.startsWith("http://") || href?.startsWith("https://") || href?.startsWith("//");
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-0.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline decoration-indigo-300 dark:decoration-indigo-600 underline-offset-2 transition-colors cursor-pointer"
                {...props}
              >
                <span>{children}</span>
                {isExternal && (
                  <ExternalLink className="inline size-3 shrink-0 ml-0.5 opacity-70 group-hover:opacity-100" />
                )}
              </a>
            );
          },
          // Unordered List styling
          ul: ({ node, ...props }) => (
            <ul className="my-2.5 ml-4 list-disc space-y-1.5 marker:text-indigo-500 dark:marker:text-indigo-400 text-slate-700 dark:text-slate-300 pl-1" {...props} />
          ),
          // Ordered List styling
          ol: ({ node, ...props }) => (
            <ol className="my-2.5 ml-4 list-decimal space-y-1.5 marker:font-semibold marker:text-indigo-600 dark:marker:text-indigo-400 text-slate-700 dark:text-slate-300 pl-1" {...props} />
          ),
          // List item styling
          li: ({ node, ...props }) => (
            <li className="leading-relaxed pl-1" {...props} />
          ),
          // Inline code styling
          code: ({ node, className: codeClassName, children, ...props }) => {
            const isMultiLine = typeof children === "string" && children.includes("\n");
            if (isMultiLine) {
              return (
                <code
                  className="block my-2 overflow-x-auto rounded-lg bg-slate-100 dark:bg-slate-800/80 p-3 text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded-md bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Blockquote styling
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-3 border-l-3 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 py-1.5 px-3.5 italic text-slate-700 dark:text-slate-300 rounded-r-lg"
              {...props}
            />
          ),
          // Headings styling
          h1: ({ node, ...props }) => (
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2.5 mb-1" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2 mb-1" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-3 border-slate-200 dark:border-slate-800" {...props} />
          ),
        }}
      >
        {normalizedContent}
      </Markdown>
    </div>
  );
});
