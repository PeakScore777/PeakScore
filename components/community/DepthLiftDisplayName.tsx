import type { CSSProperties } from "react";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
};

/** CSS-only hover depth: no canvas, timers, pointer listeners or animation loop. */
export default function DepthLiftDisplayName({
  text,
  className = "",
  style,
  tag = "strong",
}: Props) {
  const Tag = tag;
  return (
    <Tag className={className + " ps-depth-lift"} style={style} aria-label={text}>
      <span className="ps-depth-lift__face" data-depth-text={text} aria-hidden="true">
        {text}
      </span>
    </Tag>
  );
}
