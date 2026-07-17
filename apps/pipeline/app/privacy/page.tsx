export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto font-mono text-sm text-zinc-400">
        <h1 className="text-4xl font-pixel text-white mb-8">Privacy Notice</h1>
        <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Data Collection</h2>
        <p className="mb-4">We collect basic account information (email, name) for billing and authentication purposes. We process documents uploaded by you solely to provide the extraction service.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Data Retention & Volatility</h2>
        <p className="mb-4">Our infrastructure is designed for zero data retention. Documents and their extracted data are processed in ephemeral containers in-memory and are permanently deleted immediately after the API response is sent to your servers.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Third-Party Processors</h2>
        <p className="mb-4">We use Paddle as our Merchant of Record for all billing and payments. Your payment details are securely handled by Paddle and are never stored on our servers.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Security</h2>
        <p className="mb-4">We implement industry-standard security measures, including encryption in transit and at rest, to protect your account data and API keys.</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Contact Us</h2>
        <p className="mb-4">If you have any questions about this Privacy Notice, please contact our support team through the dashboard.</p>
      </div>
    </div>
  );
}
