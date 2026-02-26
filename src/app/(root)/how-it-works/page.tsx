// app/(marketing)/how-it-works/page.tsx
export const metadata = { title: "How It Works" };

export default function HowItWorksPage() {
  return (
    <main className="portal-layout min-h-screen">
      <section className="mx-auto w-full max-w-[900px] px-4 py-8">
        <div className="card">
          <div className="card-body">
            {/* Title */}
            <h1 className="page-title text-primary-500">How It Works</h1>

            <p className="body-regular text-neutral-600 mt-4">
              Karya connects clients and service providers through a structured,
              transparent, and intelligent system designed to simplify service
              discovery and long-term project management.
            </p>

            <hr className="my-6 border-neutral-200" />

            {/* For Providers */}
            <h2 className="section-title text-primary-500">
              For Service Providers
            </h2>

            <ol className="body-regular mt-4 list-decimal pl-5 space-y-3 text-neutral-700">
              <li>
                Register and create a detailed profile including services,
                pricing, service areas, and experience.
              </li>
              <li>
                Upload required verification documents such as identification,
                licenses, or certifications.
              </li>
              <li>
                Once verified, your profile becomes visible in client search
                results and recommendation rankings.
              </li>
              <li>
                When hired, create and manage projects through your dashboard.
              </li>
            </ol>

            <hr className="my-6 border-neutral-200" />

            {/* For Clients */}
            <h2 className="section-title text-primary-500">For Clients</h2>

            <ol className="body-regular mt-4 list-decimal pl-5 space-y-3 text-neutral-700">
              <li>Browse service providers without mandatory login.</li>
              <li>
                Filter providers by radius (default 5 km or custom distance).
              </li>
              <li>
                Receive AI-powered recommendations based on:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Location proximity</li>
                  <li>Verification status</li>
                  <li>Ratings and reviews</li>
                  <li>Chatbot responses (project needs, urgency, budget)</li>
                </ul>
              </li>
              <li>Connect with providers and initiate collaboration.</li>
            </ol>

            <hr className="my-6 border-neutral-200" />

            {/* Project Management */}
            <h2 className="section-title text-primary-500">
              After Connection – Project Management
            </h2>

            <ul className="body-regular mt-4 list-disc pl-5 space-y-3 text-neutral-700">
              <li>Providers create project entries and add client sites.</li>
              <li>Post daily progress updates visible to clients.</li>
              <li>Define milestones for long-term projects.</li>
              <li>Manage inventory and track material usage.</li>
              <li>Add employees working on site and manage attendance.</li>
              <li>
                Clients can review updates, provide feedback, submit payment
                details (including eSewa), and raise queries.
              </li>
            </ul>

            <hr className="my-6 border-neutral-200" />

            {/* Recommendation Engine */}
            <h2 className="section-title text-primary-500">
              Intelligent Recommendation Engine
            </h2>

            <p className="body-regular mt-4 text-neutral-700">
              The platform uses a similarity-based ranking system that considers
              ratings, reviews, verification status, geographic distance, and
              chatbot-provided preferences. This ensures clients are matched
              with the most relevant and trustworthy providers.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
