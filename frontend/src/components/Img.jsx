import { useEffect, useRef, useState } from "react";

// Image that fades in when loaded and shows a branded placeholder if missing.
export default function Img({ src, alt = "", className = "", ...rest }) {
  const [state, setState] = useState(src ? "loading" : "error");
  const imgRef = useRef(null);
  const prevSrc = useRef(src);

  useEffect(() => {
    // Only reset when the picture actually changes.
    if (prevSrc.current !== src) {
      prevSrc.current = src;
      setState(src ? "loading" : "error");
    }
    // A cached picture can finish loading before React is listening - check directly.
    const img = imgRef.current;
    if (img && img.complete) setState(img.naturalWidth > 0 ? "loaded" : "error");
  }, [src]);

  if (state === "error") {
    return <div className={`img-ph ${className}`} role="img" aria-label={alt} />;
  }
  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading="lazy"
      className={`img-fade ${state === "loaded" ? "is-loaded" : ""} ${className}`}
      onLoad={() => setState("loaded")}
      onError={() => setState("error")}
      {...rest}
    />
  );
}
