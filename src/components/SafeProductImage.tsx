import { useEffect, useState, type ImgHTMLAttributes } from "react";
import placeholderImage from "@/assets/logo-shield.png";

type SafeProductImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  src?: string | null;
  fallbackSrc?: string;
};

export function SafeProductImage({
  src,
  fallbackSrc = placeholderImage,
  ...imageProps
}: SafeProductImageProps) {
  const requestedSrc = src?.trim() || fallbackSrc;
  const [resolvedSrc, setResolvedSrc] = useState(requestedSrc);

  useEffect(() => {
    setResolvedSrc(requestedSrc);
  }, [requestedSrc]);

  return (
    <img
      {...imageProps}
      src={resolvedSrc}
      onError={() => {
        if (resolvedSrc !== fallbackSrc) setResolvedSrc(fallbackSrc);
      }}
    />
  );
}
