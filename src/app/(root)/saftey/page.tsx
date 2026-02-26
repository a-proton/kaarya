// app/(clients)/clients/safety-guidelines/page.tsx
import InfoPage from "@/components/InfoPage";

export const metadata = { title: "Safety Guidelines" };

export default function SafetyGuidelinesPage() {
  return (
    <InfoPage title="Safety Guidelines">
      <p className="body-regular text-neutral-600">
        Safety and trust are important for both clients and providers. Use these
        guidelines to reduce risk and ensure a smooth service experience.
      </p>

      <hr className="my-6 border-neutral-200" />

      <h2 className="section-title text-primary-500">Before Hiring</h2>
      <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
        <li>
          Prefer verified providers and review their profile details carefully.
        </li>
        <li>Check rating patterns and review quality, not only the score.</li>
        <li>Confirm scope, timeline, and costs before work begins.</li>
      </ul>

      <h2 className="section-title text-primary-500 mt-6">During Work</h2>
      <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
        <li>
          For long work, use milestones and ask for daily progress updates.
        </li>
        <li>
          Keep records of payments and discussions in written form when
          possible.
        </li>
        <li>
          Do not share sensitive information beyond what is required for the
          job.
        </li>
      </ul>

      <h2 className="section-title text-primary-500 mt-6">Payments</h2>
      <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
        <li>Use milestone-based payments for large projects.</li>
        <li>
          When supported, you may pay via eSewa and record payment details on
          the platform.
        </li>
      </ul>

      <h2 className="section-title text-primary-500 mt-6">Report Issues</h2>
      <p className="body-regular mt-4 text-neutral-700">
        If you face suspicious behavior or safety concerns, contact our support
        team through the Help Center or Contact Us page.
      </p>
    </InfoPage>
  );
}
