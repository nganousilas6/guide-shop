import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type CarouselSlide = {
  src: string;
  alt: string;
  caption: string;
};

const AUTOPLAY_MS = 5000;

export function HomeCarousel({ slides }: { slides: CarouselSlide[] }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const count = slides.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }, [index]);

  if (count === 0) return null;

  return (
    <div
      data-ocid="home.carousel"
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {slides.map((slide, slideIndex) => (
          <figure
            key={slide.src}
            className="relative w-full shrink-0 snap-center"
            aria-hidden={slideIndex !== index}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              loading={slideIndex === 0 ? "eager" : "lazy"}
              className="aspect-square w-full object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-secondary/85 to-transparent px-4 pb-3 pt-8">
              <span className="font-display text-sm font-bold text-secondary-foreground">
                {slide.caption}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            data-ocid="home.carousel_prev"
            aria-label={t("home.carouselPrev")}
            onClick={() => goTo(index - 1)}
            className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/85 text-foreground shadow-card transition-smooth hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            data-ocid="home.carousel_next"
            aria-label={t("home.carouselNext")}
            onClick={() => goTo(index + 1)}
            className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/85 text-foreground shadow-card transition-smooth hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>

          <div className="absolute inset-x-0 bottom-11 flex items-center justify-center gap-1.5">
            {slides.map((slide, dotIndex) => (
              <button
                key={slide.src}
                type="button"
                data-ocid={`home.carousel_dot.${dotIndex + 1}`}
                aria-label={t("home.carouselGoTo", { index: dotIndex + 1 })}
                aria-current={dotIndex === index}
                onClick={() => goTo(dotIndex)}
                className={cn(
                  "h-1.5 rounded-full transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  dotIndex === index
                    ? "w-5 bg-primary"
                    : "w-1.5 bg-card/80 hover:bg-card",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
