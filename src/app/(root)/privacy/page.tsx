// app/(legal)/privacy/page.tsx
export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="portal-layout min-h-screen">
      <section className="mx-auto w-full max-w-[900px] px-4 py-8">
        <div className="card">
          <div className="card-body">
            <h1 className="page-title">Privacy Policy</h1>
            <p className="body-regular text-neutral-600 mt-3">
              Effective Date: <strong>YYYY-MM-DD</strong>
            </p>

            <hr className="my-6 border-neutral-200" />

            <p className="body-regular">
              This Privacy Policy explains how we collect, use, disclose, and
              protect your information when you use our Service. By using the
              Service, you agree to the practices described in this Policy.
            </p>

            <h2 className="section-title mt-6">1. Information We Collect</h2>
            <ul className="body-regular mt-3 list-disc pl-5">
              <li>
                <strong>Account Information:</strong> name, email, phone number,
                login identifiers.
              </li>
              <li>
                <strong>Profile & Usage Data:</strong> preferences, activity,
                pages visited, actions taken within the app.
              </li>
              <li>
                <strong>Device & Technical Data:</strong> IP address, browser
                type, device identifiers, and logs.
              </li>
              <li>
                <strong>Location Data (if enabled):</strong> approximate or
                precise location depending on your device permissions and app
                settings.
              </li>
              <li>
                <strong>Payments (if applicable):</strong> billing details are
                processed by payment providers; we may receive limited payment
                metadata (e.g., last 4 digits, transaction status).
              </li>
            </ul>

            <h2 className="section-title mt-6">2. How We Use Information</h2>
            <ul className="body-regular mt-3 list-disc pl-5">
              <li>Provide, maintain, and improve the Service.</li>
              <li>Authenticate users and prevent fraud or abuse.</li>
              <li>
                Personalize user experience and recommendations (if applicable).
              </li>
              <li>
                Send service-related messages (e.g., verification, updates).
              </li>
              <li>Comply with legal obligations and enforce our Terms.</li>
            </ul>

            <h2 className="section-title mt-6">
              3. Legal Bases (where applicable)
            </h2>
            <p className="body-regular mt-3">
              Depending on your jurisdiction, we process personal data based on
              one or more legal grounds such as consent, performance of a
              contract, legitimate interests, and compliance with legal
              obligations.
            </p>

            <h2 className="section-title mt-6">4. Sharing of Information</h2>
            <p className="body-regular mt-3">We may share information with:</p>
            <ul className="body-regular mt-3 list-disc pl-5">
              <li>
                <strong>Service Providers:</strong> hosting, analytics, customer
                support, communication, security.
              </li>
              <li>
                <strong>Business Partners (if applicable):</strong> when needed
                to provide features you request.
              </li>
              <li>
                <strong>Legal & Safety:</strong> if required by law, to protect
                rights, safety, and prevent fraud.
              </li>
              <li>
                <strong>Business Transfers:</strong> during mergers,
                acquisitions, or asset sales.
              </li>
            </ul>

            <h2 className="section-title mt-6">5. Data Retention</h2>
            <p className="body-regular mt-3">
              We retain information for as long as necessary to provide the
              Service, comply with legal obligations, resolve disputes, and
              enforce agreements. Retention periods may vary by data type and
              purpose.
            </p>

            <h2 className="section-title mt-6">6. Security</h2>
            <p className="body-regular mt-3">
              We use reasonable administrative, technical, and physical security
              measures to protect your information. However, no method of
              transmission or storage is 100% secure.
            </p>

            <h2 className="section-title mt-6">7. Your Rights</h2>
            <p className="body-regular mt-3">
              Depending on your location, you may have rights such as access,
              correction, deletion, objection, restriction, and data
              portability. You may also withdraw consent where processing is
              based on consent.
            </p>

            <h2 className="section-title mt-6">8. Children&apos;s Privacy</h2>
            <p className="body-regular mt-3">
              The Service is not intended for children under the age required by
              local law. We do not knowingly collect personal information from
              children. If you believe a child provided us information, contact
              us to remove it.
            </p>

            <h2 className="section-title mt-6">9. International Transfers</h2>
            <p className="body-regular mt-3">
              Your information may be processed in countries other than your
              own. Where required, we use appropriate safeguards for
              cross-border data transfers.
            </p>

            <h2 className="section-title mt-6">10. Changes to This Policy</h2>
            <p className="body-regular mt-3">
              We may update this Policy from time to time. We will update the
              effective date and provide notice if required by law.
            </p>

            <h2 className="section-title mt-6">11. Contact</h2>
            <p className="body-regular mt-3">
              If you have questions about this Privacy Policy, contact us at:
            </p>

            <div className="card card-sm mt-4">
              <div className="card-body-sm">
                <p className="body-regular">
                  Email:{" "}
                  <span className="text-neutral-600">privacy@example.com</span>
                </p>
                <p className="body-regular">
                  Address:{" "}
                  <span className="text-neutral-600">Your Company Address</span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a className="btn btn-secondary btn-md" href="/terms">
                View Terms & Conditions
              </a>
              <a className="btn btn-primary btn-md" href="/">
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
