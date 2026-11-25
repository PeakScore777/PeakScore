const observedNameNodes = new WeakSet<Element>();
const nameMotionCallbacks = new WeakMap<Element, (visible: boolean) => void>();
let sharedNameMotionObserver: IntersectionObserver | null = null;

/**
 * One shared observer pauses CSS-only name effects outside the viewport.
 * It mutates a data attribute instead of setting React state on scroll.
 */
export function observeNameMotionVisibility(node: HTMLElement | null, onVisibilityChange?: (visible: boolean) => void): () => void {
  if (!node) return () => {};

  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    node.dataset.motionVisible = "true";
    onVisibilityChange?.(true);
    return () => {};
  }

  node.dataset.motionVisible = "false";
  if (onVisibilityChange) nameMotionCallbacks.set(node, onVisibilityChange);

  if (!sharedNameMotionObserver) {
    sharedNameMotionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        target.dataset.motionVisible = entry.isIntersecting ? "true" : "false";
        nameMotionCallbacks.get(target)?.(entry.isIntersecting);
      }
    }, { rootMargin: "80px 0px" });
  }

  if (!observedNameNodes.has(node)) {
    sharedNameMotionObserver.observe(node);
    observedNameNodes.add(node);
  }

  return () => {
    sharedNameMotionObserver?.unobserve(node);
    observedNameNodes.delete(node);
    nameMotionCallbacks.delete(node);
    delete node.dataset.motionVisible;
  };
}
