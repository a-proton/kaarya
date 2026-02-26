// app/(clients)/clients/find-services/page.tsx
import InfoPage from "@/components/InfoPage";

export const metadata = { title: "Find Services" };

export default function FindServicesPage() {
  return (
    <InfoPage title="Find Services">
      <p className="body-regular text-neutral-600">
        Find nearby service providers without mandatory login. Use radius
        filtering and AI-based recommendations to quickly shortlist reliable
        professionals.
      </p>

      <hr className="my-6 border-neutral-200" />

      <h2 className="section-title text-primary-500">Search by Radius</h2>
      <ul className="body-regular mt-4 list-disc pl-5 space-y-2 text-neutral-700">
        <li>Default radius: 5 km (can be changed to any defined distance).</li>
        <li>Results prioritize closer providers based on your location.</li>
        <li>
          You can browse categories like contractor, electrician, plumber, and
          house help.
        </li>
      </ul>

      <h2 className="section-title text-primary-500 mt-6">
        Recommendation Engine
      </h2>
      <p className="body-regular mt-4 text-neutral-700">
        The platform recommends providers using similarity-based ranking that
        considers:
      </p>
      <ul className="body-regular mt-3 list-disc pl-5 space-y-2 text-neutral-700">
        <li>Verification status</li>
        <li>Ratings and review volume</li>
        <li>Distance from your location</li>
        <li>Service category match and provider skills</li>
      </ul>

      <h2 className="section-title text-primary-500 mt-6">
        Chatbot-Assisted Matching
      </h2>
      <p className="body-regular mt-4 text-neutral-700">
        For better suggestions, a chatbot may ask quick questions such as
        service type, urgency, budget range, or project duration. Your answers
        improve recommendation accuracy.
      </p>
    </InfoPage>
  );
}
