export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Legal</p>
        <h1
          className="text-3xl font-semibold tracking-tight mb-3"
          style={{ color: "var(--primary)" }}
        >
          Terms of Service
        </h1>
        <p className="text-sm text-stone-400">Effective date: 1 May 2026 · Last updated: 1 May 2026</p>
      </div>

      <div className="flex flex-col gap-10 text-sm leading-relaxed" style={{ color: "var(--primary)" }}>

        {/* 1 */}
        <section>
          <h2 className="text-base font-semibold mb-3">1. Introduction and Acceptance</h2>
          <p className="text-stone-500">
            Welcome to Poppy (&ldquo;Poppy&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
            &ldquo;our&rdquo;). Poppy is a personal health navigation platform that helps individuals
            understand, organise, and act on their medical information. These Terms of Service
            (&ldquo;Terms&rdquo;) govern your access to and use of the Poppy application, website, and
            all related services (collectively, the &ldquo;Service&rdquo;).
          </p>
          <p className="text-stone-500 mt-3">
            By creating an account or continuing to use the Service, you confirm that you are at least
            18 years of age (or the age of majority in your jurisdiction), that you have read and
            understood these Terms, and that you agree to be bound by them. If you do not agree, you
            must not use the Service.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-base font-semibold mb-3">2. Description of the Service</h2>
          <p className="text-stone-500">
            Poppy provides tools to help you store, review, and make sense of your personal health
            documents and medical history. The Service includes AI-assisted summarisation of uploaded
            documents, condition-matched educational content, specialist directories, clinical trial
            matching, and a care-team communication layer.
          </p>
          <p className="text-stone-500 mt-3">
            The Service is intended to complement — not replace — the advice, diagnosis, or treatment
            provided by qualified healthcare professionals. All features are for informational and
            organisational purposes only.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-base font-semibold mb-3">3. Medical Disclaimer</h2>
          <div
            className="rounded-2xl px-5 py-4 mb-4"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#92400e" }}>
              Important
            </p>
            <p className="text-stone-600">
              Poppy is not a medical device, clinical decision support tool, or healthcare provider.
              Nothing within the Service constitutes medical advice, diagnosis, or treatment. Always
              seek the guidance of your doctor or qualified health professional with any questions you
              have regarding a medical condition.
            </p>
          </div>
          <p className="text-stone-500">
            In a medical emergency, contact your local emergency services immediately. Do not use the
            Service to delay seeking emergency care.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-base font-semibold mb-3">4. Your Account</h2>
          <p className="text-stone-500">
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activity that occurs under your account. You agree to notify us immediately at{" "}
            <a
              href="mailto:support@poppy.health"
              className="underline underline-offset-2"
              style={{ color: "var(--accent)" }}
            >
              support@poppy.health
            </a>{" "}
            of any unauthorised access or suspected breach. Poppy cannot be held liable for loss or
            damage arising from your failure to protect your account credentials.
          </p>
          <p className="text-stone-500 mt-3">
            You must provide accurate and complete information when creating your account and keep that
            information current. Accounts created on behalf of another person are only permitted with
            that person&apos;s explicit consent (for example, a carer managing a patient&apos;s
            profile).
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-base font-semibold mb-3">5. Health Data and Privacy</h2>
          <p className="text-stone-500">
            When you upload medical documents or enter health information, that data is stored
            securely and processed solely to provide the features of the Service to you. We do not
            sell, licence, or otherwise share your health data with third parties without your
            explicit consent, except as required by law.
          </p>
          <p className="text-stone-500 mt-3">
            Document text is extracted and stored in encrypted form. Original file binaries are
            discarded after processing. Your data is hosted on infrastructure that meets or exceeds
            ISO 27001 standards and is compliant with applicable health data regulations including
            GDPR (where applicable).
          </p>
          <p className="text-stone-500 mt-3">
            You retain full ownership of all health data you upload. You may delete your data at any
            time from your profile settings. Upon account deletion, all personal data is permanently
            removed within 30 days.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-base font-semibold mb-3">6. AI-Generated Content</h2>
          <p className="text-stone-500">
            The Service uses artificial intelligence to summarise documents, match conditions to
            educational content, and surface relevant specialists and clinical trials. While we strive
            for accuracy, AI-generated content may contain errors or omissions. You should not act
            solely on AI-generated content without consulting a qualified healthcare professional.
          </p>
          <p className="text-stone-500 mt-3">
            AI outputs are always clearly labelled within the Service. When you do not have documents
            uploaded, content is based on general condition information and is marked as such.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-base font-semibold mb-3">7. Acceptable Use</h2>
          <p className="text-stone-500 mb-2">You agree not to:</p>
          <ul className="list-disc list-outside ml-5 flex flex-col gap-1.5 text-stone-500">
            <li>Use the Service for any unlawful purpose or in violation of any applicable regulation</li>
            <li>Upload content that you do not have the right to share (e.g. another person&apos;s records without their consent)</li>
            <li>Attempt to reverse-engineer, scrape, or extract data from the Service by automated means</li>
            <li>Use the Service to provide medical advice or clinical services to third parties</li>
            <li>Introduce malware, viruses, or any code designed to disrupt or harm the Service</li>
            <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
          </ul>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-base font-semibold mb-3">8. Intellectual Property</h2>
          <p className="text-stone-500">
            All software, design, text, graphics, and other materials forming part of the Service
            (excluding your personal data) are the intellectual property of Poppy Health Ltd or its
            licensors. You are granted a limited, non-exclusive, non-transferable licence to use the
            Service for personal, non-commercial purposes in accordance with these Terms.
          </p>
          <p className="text-stone-500 mt-3">
            You retain all rights to the content you upload. By uploading content, you grant Poppy a
            limited licence to process that content solely for the purpose of providing the Service
            to you.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-base font-semibold mb-3">9. Limitation of Liability</h2>
          <p className="text-stone-500">
            To the maximum extent permitted by applicable law, Poppy Health Ltd and its officers,
            directors, employees, and agents shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages — including loss of data, personal injury, or
            harm arising from reliance on AI-generated content — even if Poppy has been advised of
            the possibility of such damages.
          </p>
          <p className="text-stone-500 mt-3">
            Our total liability to you for any claim arising under these Terms shall not exceed the
            greater of (a) the amount you paid to Poppy in the 12 months preceding the claim, or
            (b) £100.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-base font-semibold mb-3">10. Indemnification</h2>
          <p className="text-stone-500">
            You agree to indemnify and hold harmless Poppy Health Ltd and its affiliates from any
            claims, damages, losses, or expenses (including reasonable legal fees) arising out of
            your use of the Service, your violation of these Terms, or your violation of any third
            party&apos;s rights.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-base font-semibold mb-3">11. Service Availability and Changes</h2>
          <p className="text-stone-500">
            We aim to keep the Service available at all times but do not guarantee uninterrupted
            access. We may modify, suspend, or discontinue any part of the Service at any time with
            reasonable notice where possible.
          </p>
          <p className="text-stone-500 mt-3">
            We reserve the right to update these Terms at any time. Where changes are material, we
            will notify you by email or an in-app notice at least 14 days before they take effect.
            Your continued use of the Service after that date constitutes acceptance of the revised
            Terms.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-base font-semibold mb-3">12. Termination</h2>
          <p className="text-stone-500">
            You may close your account at any time from your profile settings. We may suspend or
            terminate your account if we reasonably believe you have violated these Terms, with notice
            where practicable.
          </p>
          <p className="text-stone-500 mt-3">
            On termination, your right to use the Service ceases immediately. Provisions that by
            their nature should survive termination (including sections on liability, indemnification,
            and governing law) will continue to apply.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="text-base font-semibold mb-3">13. Governing Law</h2>
          <p className="text-stone-500">
            These Terms are governed by the laws of England and Wales. Any disputes arising under or
            in connection with these Terms shall be subject to the exclusive jurisdiction of the
            courts of England and Wales, unless mandatory consumer protection laws in your country
            of residence provide otherwise.
          </p>
        </section>

        {/* 14 */}
        <section>
          <h2 className="text-base font-semibold mb-3">14. Contact Us</h2>
          <p className="text-stone-500">
            If you have any questions about these Terms or the Service, please contact us at:
          </p>
          <div
            className="mt-3 rounded-2xl px-5 py-4 text-stone-500"
            style={{ background: "var(--soft)" }}
          >
            <p className="font-medium mb-1" style={{ color: "var(--primary)" }}>Poppy Health Ltd</p>
            <p>Email:{" "}
              <a
                href="mailto:legal@poppy.health"
                className="underline underline-offset-2"
                style={{ color: "var(--accent)" }}
              >
                legal@poppy.health
              </a>
            </p>
            <p className="mt-1">Registered in England and Wales</p>
          </div>
        </section>

      </div>
    </div>
  );
}
