import { ExternalLinkIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Article } from "@/lib/export";

export function ArticleView({ article }: { article: Article }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-xl wrap-anywhere">{article.title}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-x-2.5">
          {article.author ? (
            <>
              <span>{article.author}</span>
              <span aria-hidden>·</span>
            </>
          ) : null}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-4"
          >
            {article.domain}
            <ExternalLinkIcon className="size-3.5" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="prose max-w-none wrap-anywhere prose-neutral dark:prose-invert prose-img:rounded-lg prose-pre:bg-muted prose-pre:text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node는 DOM에 넘기지 않으려고 걸러낸다
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node는 DOM에 넘기지 않으려고 걸러낸다
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto">
                <table {...props} />
              </div>
            ),
          }}
        >
          {article.markdown}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
}
