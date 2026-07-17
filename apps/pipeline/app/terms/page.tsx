export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto font-mono text-sm text-zinc-400">
        <h1 className="text-4xl font-pixel text-white mb-8">Terms of Service</h1>
        <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">By accessing or using BaseParse, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the service.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Description of Service</h2>
        <p className="mb-4">BaseParse provides an API and platform for document parsing, extraction, and optical character recognition. We reserve the right to modify or discontinue the service at any time.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">3. User Data & Privacy</h2>
        <p className="mb-4">We process documents solely for the purpose of extraction. We do not retain user documents after processing is complete. For more details, please review our Privacy Notice.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Acceptable Use</h2>
        <p className="mb-4">You agree not to use the service to process illegal, harmful, or unauthorized content. Any abuse of the API or infrastructure may result in immediate account termination.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Limitation of Liability</h2>
        <p className="mb-4">BaseParse is provided "as is" without warranties of any kind. We shall not be liable for any damages resulting from the use or inability to use the service.</p>
      </div>
    </div>
  );
}
