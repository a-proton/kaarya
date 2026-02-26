// app/(marketing)/about/page.tsx
export const metadata = { title: "Our Story" };

export default function AboutPage() {
  return (
    <main className="portal-layout min-h-screen">
      <section className="mx-auto w-full max-w-[900px] px-4 py-8">
        <div className="card">
          <div className="card-body">
            {/* Title */}
            <h1 className="page-title text-primary-500">Our Story</h1>

            <p className="body-regular text-neutral-600 mt-4">
              Karya is a modern service marketplace built to connect clients
              with reliable and verified professionals such as contractors,
              electricians, plumbers, and household helpers. Our goal is to
              simplify service discovery while ensuring transparency, trust, and
              efficient project management.
            </p>

            <hr className="my-6 border-neutral-200" />

            {/* What We Solve */}
            <h2 className="section-title text-primary-500">What We Solve</h2>

            <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
              <li>
                Finding trusted and verified service providers within a defined
                radius (e.g., 5 km or customizable distance).
              </li>
              <li>
                Ensuring authenticity through structured document verification.
              </li>
              <li>
                Intelligent recommendation using similarity-based ranking that
                considers ratings, reviews, verification, and distance.
              </li>
              <li>
                Managing long-term projects with structured milestones, daily
                updates, inventory tracking, and employee attendance.
              </li>
            </ul>

            <hr className="my-6 border-neutral-200" />

            {/* How It Works */}
            <h2 className="section-title text-primary-500">
              How It Works at a Glance
            </h2>

            <p className="body-regular mt-4 text-neutral-700">
              Service providers register and upload required documents for
              verification. Once approved, their profiles become visible on the
              client interface.
            </p>

            <p className="body-regular mt-4 text-neutral-700">
              Clients can browse providers without login, filter by radius, and
              receive AI-powered recommendations based on ratings, verification
              status, proximity, and chatbot-driven preferences.
            </p>

            <p className="body-regular mt-4 text-neutral-700">
              After connection, providers can create projects, add clients, post
              daily site updates, define milestones, manage inventory, and track
              employee attendance. Clients can review updates, provide feedback,
              submit payment details (including eSewa), and raise external
              queries.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
