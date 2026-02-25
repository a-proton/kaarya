import { Suspense } from "react";
import EarningsViewClient from "./EarningsViewClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--color-neutral-50)" }}
        >
          <div className="text-center">
            <div
              className="animate-spin mb-4"
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "9999px",
                border: "3px solid var(--color-neutral-200)",
                borderTopColor: "var(--color-primary)",
                margin: "0 auto",
              }}
            />
            <p
              className="font-medium"
              style={{ fontSize: "0.9rem", color: "var(--color-neutral-500)" }}
            >
              Loading project details…
            </p>
          </div>
        </div>
      }
    >
      <EarningsViewClient />
    </Suspense>
  );
}
