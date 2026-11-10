import { useState, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & { fallback?: string };

export function ProductImage({
  src,
  fallback = "/fallback-product.svg",
  onError,
  ...props
}: Props) {
  const [current, setCurrent] = useState(src);
  return (
    <img
      {...props}
      src={current}
      onError={(event) => {
        if (current !== fallback) setCurrent(fallback);
        onError?.(event);
      }}
    />
  );
}
