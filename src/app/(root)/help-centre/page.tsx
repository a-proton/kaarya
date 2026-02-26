// app/(support)/support/help-center/page.tsx
import InfoPage from "@/components/InfoPage";

export const metadata = { title: "Help Center" };

export default function HelpCenterPage() {
  return (
    <InfoPage title="Help Center">
      <p className="body-regular text-neutral-600">
        Find quick answers about using Karya as a client or as a service
        provider. For account issues, verification support, or payment
        questions, contact support.
      </p>

      <hr className="my-6 border-neutral-200" />

      <h2 className="section-title text-primary-500">Clients</h2>
      <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
        <li>How do I find providers near me?</li>
        <li>How does radius filtering work?</li>
        <li>How are providers recommended without login?</li>
        <li>How can I give feedback on daily updates?</li>
        <li>How do I record milestone payments (including eSewa)?</li>
      </ul>

      <h2 className="section-title text-primary-500 mt-6">Providers</h2>
      <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
        <li>How do I register and complete verification?</li>
        <li>How do I create a project and add a client/site?</li>
        <li>How do daily updates and milestones work?</li>
        <li>How do I manage inventory and attendance?</li>
      </ul>

      <h2 className="section-title text-primary-500 mt-6">Support</h2>
      <p className="body-regular mt-4 text-neutral-700">
        If you need help, please use the Contact Us page to reach our support
        team.
      </p>
    </InfoPage>
  );
}
