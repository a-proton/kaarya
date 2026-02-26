// app/(support)/support/trust-safety/page.tsx
import InfoPage from "@/components/InfoPage";

export const metadata = { title: "Trust & Safety" };

export default function TrustSafetyPage() {
  return (
    <InfoPage title="Trust & Safety">
      <p className="body-regular text-neutral-600">
        Karya is designed to help clients discover reliable service providers
        while supporting providers with fair visibility and verified
        credibility. We combine verification, transparency, and project tracking
        features to improve trust throughout the full service lifecycle.
      </p>

      <hr className="my-6 border-neutral-200" />

      <h2 className="section-title text-primary-500">
        Verification & Identity Checks
      </h2>
      <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
        <li>
          Providers upload documents (ID, certifications, licenses) for review.
        </li>
        <li>
          Verified status is displayed to clients and prioritized in
          recommendations.
        </li>
        <li>
          Documents are not publicly shown and are used only for verification.
        </li>
      </ul>

      <h2 className="section-title text-primary-500 mt-6">
        Transparent Profiles
      </h2>
      <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
        <li>
          Provider profiles include services, service area, ratings, and
          reviews.
        </li>
        <li>Clients can compare multiple providers in the same category.</li>
      </ul>

      <h2 className="section-title text-primary-500 mt-6">
        Project Tracking & Accountability
      </h2>
      <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
        <li>Providers post daily site updates and milestone progress.</li>
        <li>
          Clients can review updates and submit feedback for clarity and
          quality.
        </li>
        <li>
          Records of updates, attendance, and inventory improve accountability.
        </li>
      </ul>

      <h2 className="section-title text-primary-500 mt-6">Safe Payments</h2>
      <p className="body-regular mt-4 text-neutral-700">
        Payments can be recorded on the platform and may be made via eSewa where
        supported. For long projects, milestone-based payments are recommended.
      </p>

      <h2 className="section-title text-primary-500 mt-6">
        Support & Reporting
      </h2>
      <p className="body-regular mt-4 text-neutral-700">
        If you notice suspicious behavior or need assistance, contact our
        support team through the Help Center or Contact Us page.
      </p>
    </InfoPage>
  );
}
