// app/(providers)/providers/verification/page.tsx
export const metadata = { title: "Verification Process" };

export default function VerificationProcessPage() {
  return (
    <main className="portal-layout min-h-screen">
      <section className="mx-auto w-full max-w-[900px] px-4 py-8">
        <div className="card">
          <div className="card-body">
            {/* Title */}
            <h1 className="page-title text-primary-500">
              Verification Process
            </h1>

            <p className="body-regular text-neutral-600 mt-4">
              To ensure trust, safety, and service quality, Karya follows a
              structured verification process for all service providers. Only
              verified providers are highlighted in search results and
              recommendation rankings.
            </p>

            <hr className="my-6 border-neutral-200" />

            {/* Step 1 */}
            <h2 className="section-title text-primary-500">
              Step 1: Profile Completion
            </h2>

            <p className="body-regular mt-4 text-neutral-700">
              Providers must complete their service profile with accurate
              information including:
            </p>

            <ul className="body-regular mt-3 list-disc pl-5 space-y-2 text-neutral-700">
              <li>Full name and contact details</li>
              <li>Service categories and specialization</li>
              <li>Service coverage area</li>
              <li>Experience and pricing details</li>
            </ul>

            <hr className="my-6 border-neutral-200" />

            {/* Step 2 */}
            <h2 className="section-title text-primary-500">
              Step 2: Document Submission
            </h2>

            <p className="body-regular mt-4 text-neutral-700">
              Providers are required to upload valid supporting documents such
              as:
            </p>

            <ul className="body-regular mt-3 list-disc pl-5 space-y-2 text-neutral-700">
              <li>Government-issued identification</li>
              <li>Professional licenses or certifications (if applicable)</li>
              <li>
                Business registration documents (if operating as a company)
              </li>
              <li>Experience proof or portfolio (optional but recommended)</li>
            </ul>

            <hr className="my-6 border-neutral-200" />

            {/* Step 3 */}
            <h2 className="section-title text-primary-500">
              Step 3: Review & Approval
            </h2>

            <p className="body-regular mt-4 text-neutral-700">
              Submitted documents are reviewed by the platform’s verification
              team. During this process:
            </p>

            <ul className="body-regular mt-3 list-disc pl-5 space-y-2 text-neutral-700">
              <li>Identity authenticity is checked</li>
              <li>Licenses and certifications are validated</li>
              <li>Profile information consistency is reviewed</li>
            </ul>

            <p className="body-regular mt-4 text-neutral-700">
              If additional clarification is required, providers may be
              contacted to resubmit or update documents.
            </p>

            <hr className="my-6 border-neutral-200" />

            {/* Step 4 */}
            <h2 className="section-title text-primary-500">
              Step 4: Verified Status & Ranking Impact
            </h2>

            <p className="body-regular mt-4 text-neutral-700">
              Once approved, providers receive a verified status badge. Verified
              providers:
            </p>

            <ul className="body-regular mt-3 list-disc pl-5 space-y-2 text-neutral-700">
              <li>Appear higher in recommendation rankings</li>
              <li>Gain increased visibility in search results</li>
              <li>Build stronger trust with potential clients</li>
            </ul>

            <hr className="my-6 border-neutral-200" />

            {/* Security Note */}
            <h2 className="section-title text-primary-500">
              Data Security & Privacy
            </h2>

            <p className="body-regular mt-4 text-neutral-700">
              All uploaded documents are securely stored and handled in
              accordance with our Privacy Policy. Documents are used strictly
              for verification purposes and are not publicly visible.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
