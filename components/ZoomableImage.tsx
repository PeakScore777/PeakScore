"use client";

import { useCallback, useState } from "react";
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
  // InnerImageZoom calculates the zoomed dimensions as naturalWidth * zoomScale.
  // A fixed value of 1 fails for low-resolution images whose natural size is no
  // larger than the rendered image. Adapt the factor per image so click always
  // reveals roughly 2.6x the on-screen detail, regardless of source dimensions.
  const [zoomScale, setZoomScale] = useState(2.6);
  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const renderedWidth = image.getBoundingClientRect().width;
    const naturalWidth = image.naturalWidth;

    if (renderedWidth > 0 && naturalWidth > 0) {
      const targetScale = (renderedWidth * 2.6) / naturalWidth;
      setZoomScale(Math.max(0.25, Math.min(4, targetScale)));
    }
  }, []);

  return (
    <InnerImageZoom
      src={src}
      zoomSrc={zoomSrc ?? src}
      zoomType="click"
      moveType="pan"
      zoomScale={zoomScale}
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
        onLoad: handleImageLoad,
        onError: () => setZoomScale(2.6),
      }}
    />
  );
}
