import { Suspense } from "react";
import { ProductView } from "@/components/site/ProductView";

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="h-screen" />}>
      <ProductView />
    </Suspense>
  );
}
