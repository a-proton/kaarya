// app/(clients)/clients/how-to-hire/page.tsx
import InfoPage from "@/components/InfoPage";

export const metadata = { title: "How to Hire" };

export default function HowToHirePage() {
  return (
    <InfoPage title="How to Hire">
      <p className="body-regular text-neutral-600">
        Hiring the right provider is easier when the scope is clear and
        expectations are aligned. Follow these steps to choose and work with a
        service provider effectively.
      </p>

      <hr className="my-6 border-neutral-200" />

      <h2 className="section-title text-primary-500">Step-by-Step Hiring</h2>
      <ol className="body-regular mt-4 list-decimal pl-5 space-y-3 text-neutral-700">
        <li>Search providers by category and radius.</li>
        <li>Shortlist verified providers with strong ratings and reviews.</li>
        <li>
          Use chatbot prompts to clarify your needs and improve recommendations.
        </li>
        <li>
          Confirm scope, schedule, materials, and estimated cost with the
          provider.
        </li>
        <li>
          If the work is long-term, request milestone planning before starting.
        </li>
      </ol>

      <h2 className="section-title text-primary-500 mt-6">
        During the Project
      </h2>
      <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
        <li>
          Track daily updates and milestone progress posted by the provider.
        </li>
        <li>Provide feedback on updates for better coordination.</li>
        <li>
          Use milestone-based payments where applicable (including eSewa
          support).
        </li>
      </ul>

      <h2 className="section-title text-primary-500 mt-6">After Completion</h2>
      <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
        <li>Confirm final deliverables and settle remaining payments.</li>
        <li>Leave an honest rating and review to help future clients.</li>
      </ul>
    </InfoPage>
  );
}
