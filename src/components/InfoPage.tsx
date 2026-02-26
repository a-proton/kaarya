// components/InfoPage.tsx
import type { ReactNode } from "react";

export default function InfoPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="portal-layout min-h-screen">
      <section className="mx-auto w-full max-w-[900px] px-4 py-8">
        <div className="card">
          <div className="card-body">
            <h1 className="page-title text-primary-500">{title}</h1>
            <div className="mt-4">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
