// app/(legal)/terms/page.tsx
export const metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <main className="portal-layout min-h-screen">
      <section className="mx-auto w-full max-w-[900px] px-4 py-8">
        <div className="card">
          <div className="card-body">
            <h1 className="page-title">Terms & Conditions</h1>
            <p className="body-regular text-neutral-600 mt-3">
              Effective Date: <strong>YYYY-MM-DD</strong>
            </p>

            <hr className="my-6 border-neutral-200" />

            <p className="body-regular">
              These Terms & Conditions (&quot;Terms&quot;) govern your access to
              and use of our website, web application, and related services
              (collectively, the &quot;Service&quot;). By using the Service, you
              agree to these Terms. If you do not agree, do not use the Service.
            </p>

            <h2 className="section-title mt-6">1. Definitions</h2>
            <ul className="body-regular mt-3 list-disc pl-5">
              <li>
                <strong>&quot;We&quot;, &quot;Us&quot;, &quot;Our&quot;</strong>{" "}
                refers to the Service owner/operator.
              </li>
              <li>
                <strong>&quot;You&quot;, &quot;User&quot;</strong> refers to
                anyone who accesses or uses the Service.
              </li>
              <li>
                <strong>&quot;Content&quot;</strong> refers to text, images,
                data, files, and other materials.
              </li>
            </ul>

            <h2 className="section-title mt-6">2. Eligibility</h2>
            <p className="body-regular mt-3">
              You must be legally capable of entering a binding contract in your
              jurisdiction. If you use the Service on behalf of an organization,
              you represent that you have authority to bind that organization to
              these Terms.
            </p>

            <h2 className="section-title mt-6">3. Account Registration</h2>
            <ul className="body-regular mt-3 list-disc pl-5">
              <li>You may need an account to access certain features.</li>
              <li>
                You are responsible for maintaining the confidentiality of your
                login credentials.
              </li>
              <li>
                You agree to provide accurate, current, and complete
                information.
              </li>
              <li>
                You must notify us promptly of any unauthorized access or
                suspected security breach.
              </li>
            </ul>

            <h2 className="section-title mt-6">4. Acceptable Use</h2>
            <p className="body-regular mt-3">
              You agree not to misuse the Service. Prohibited activities
              include:
            </p>
            <ul className="body-regular mt-3 list-disc pl-5">
              <li>Violating applicable laws or regulations.</li>
              <li>
                Attempting to gain unauthorized access to accounts or systems.
              </li>
              <li>Uploading malware or harmful code.</li>
              <li>Harassing, abusing, or harming other users.</li>
              <li>
                Scraping, reverse engineering, or interfering with the Service.
              </li>
            </ul>

            <h2 className="section-title mt-6">5. User Content</h2>
            <p className="body-regular mt-3">
              You may submit content through the Service. You retain ownership
              of your content, but you grant us a non-exclusive, worldwide,
              royalty-free license to host, store, process, and display your
              content solely for operating and improving the Service.
            </p>

            <h2 className="section-title mt-6">6. Payments (if applicable)</h2>
            <p className="body-regular mt-3">
              If the Service includes paid features, fees, billing cycles, and
              refund policies will be displayed at checkout or in your account
              settings. You agree to pay all applicable fees and taxes.
            </p>

            <h2 className="section-title mt-6">7. Third-Party Services</h2>
            <p className="body-regular mt-3">
              The Service may contain links or integrations with third-party
              services. We are not responsible for third-party content,
              policies, or practices. Your use of third-party services is at
              your own risk.
            </p>

            <h2 className="section-title mt-6">8. Disclaimer</h2>
            <p className="body-regular mt-3">
              The Service is provided on an &quot;as is&quot; and &quot;as
              available&quot; basis. We disclaim all warranties to the fullest
              extent permitted by law, including merchantability, fitness for a
              particular purpose, and non-infringement.
            </p>

            <h2 className="section-title mt-6">9. Limitation of Liability</h2>
            <p className="body-regular mt-3">
              To the maximum extent permitted by law, we will not be liable for
              any indirect, incidental, special, consequential, or punitive
              damages, or any loss of profits, data, or goodwill arising from
              your use of the Service.
            </p>

            <h2 className="section-title mt-6">10. Termination</h2>
            <p className="body-regular mt-3">
              We may suspend or terminate your access to the Service if you
              violate these Terms or if we reasonably believe it is necessary to
              protect the Service, users, or our rights.
            </p>

            <h2 className="section-title mt-6">11. Changes to Terms</h2>
            <p className="body-regular mt-3">
              We may update these Terms from time to time. We will update the
              effective date and, if changes are material, provide reasonable
              notice as required by law.
            </p>

            <h2 className="section-title mt-6">12. Contact</h2>
            <p className="body-regular mt-3">
              If you have questions about these Terms, contact us at:
            </p>

            <div className="card card-sm mt-4">
              <div className="card-body-sm">
                <p className="body-regular">
                  Email:{" "}
                  <span className="text-neutral-600">support@example.com</span>
                </p>
                <p className="body-regular">
                  Address:{" "}
                  <span className="text-neutral-600">Your Company Address</span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a className="btn btn-secondary btn-md" href="/privacy">
                View Privacy Policy
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
