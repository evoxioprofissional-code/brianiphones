/* eslint-disable @next/next/no-img-element */
import type { Product } from "@/lib/types";
import { DeviceArt } from "./DeviceArt";

export function ProductMedia({ p, index = 0, className = "" }: { p: Product; index?: number; className?: string }) {
  const img = p.images[index];
  if (img) {
    return <img src={img} alt={`${p.name} ${p.color}`} className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <DeviceArt
      id={`${p.id}-${index}`}
      category={p.category}
      name={p.name}
      color={p.colorHex}
      className={`h-full w-full ${className}`}
    />
  );
}
