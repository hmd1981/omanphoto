import Link from "next/link";
import Image from "next/image";
import type { JournalPostWithCover } from "@/lib/journal";
import { journalExcerpt, journalTitle } from "@/lib/journal";
import { localizedPath } from "@/lib/locale";
import type { Locale } from "@/lib/locale";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";

type Props = {
  locale: Locale;
  post: JournalPostWithCover;
  readLabel: string;
};

export function JournalPostCard({ locale, post, readLabel }: Props) {
  const href = localizedPath(locale, `/journal/${post.slug}`);
  const title = journalTitle(locale, post);
  const excerpt = journalExcerpt(locale, post);
  const coverSrc = post.coverMedia ? resolveMediaSrc(post.coverMedia).trim() : "";
  const date = post.publishedAt.toLocaleDateString(locale === "ar" ? "ar-OM" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="group border-t border-line/70 py-12 md:py-16">
      <Link href={href} className="grid gap-8 md:grid-cols-12 md:gap-10">
        {coverSrc ? (
          <div className="relative aspect-[16/10] overflow-hidden border border-line/50 bg-surface md:col-span-5">
            {isExternalUrl(coverSrc) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverSrc} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
            ) : (
              <Image
                src={coverSrc}
                alt=""
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            )}
          </div>
        ) : null}
        <div className={coverSrc ? "md:col-span-7" : "md:col-span-12"}>
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted">{date}</p>
          <h2 className="font-display mt-4 text-2xl font-medium leading-[1.15] tracking-[-0.02em] text-ink-bright transition-colors group-hover:text-ink-bright/90 md:text-[1.75rem]">
            {title}
          </h2>
          {excerpt ? (
            <p className="mt-5 max-w-2xl text-sm font-light leading-[1.85] text-ink-muted md:text-[0.9375rem]">
              {excerpt}
            </p>
          ) : null}
          <p className="mt-6 text-[10px] uppercase tracking-[0.34em] text-ink-bright underline-offset-4 group-hover:underline">
            {readLabel}
          </p>
        </div>
      </Link>
    </article>
  );
}
