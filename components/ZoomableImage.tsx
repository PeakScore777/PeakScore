"use client";

import InnerImageZoom from "react-inner-image-zoom";

type ZoomableImageProps = {
  src: string;
  alt: string;
  className?: string;
  zoomSrc?: string;
};

/**
 * Shared click-to-zoom image used in PeakScore question content.
 * Desktop: click to zoom in-place and pan around the enlarged image.
 * Touch: opens the enlarged image in a fullscreen view with a close control.
 */
export default function ZoomableImage({
  src,
  alt,
  className = "h-auto max-h-[480px] w-auto max-w-full object-contain",
  zoomSrc,
}: ZoomableImageProps) {
  return (
    <InnerImageZoom
      src={src}
      zoomSrc={zoomSrc ?? src}
      zoomType="click"
      moveType="pan"
      zoomScale={1}
      zoomPreload={false}
      fullscreenOnMobile
      mobileBreakpoint={640}
      hideCloseButton={false}
      hideHint={false}
      hasSpacer={false}
      className="peakscore-click-zoom"
      imgAttributes={{
        alt,
        className,
        draggable: false,
        loading: "lazy",
      }}
    />
  );
}
