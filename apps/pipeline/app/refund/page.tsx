export default function RefundPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto font-mono text-sm text-zinc-400">
        <h1 className="text-4xl font-pixel text-white mb-8">Refund Policy</h1>
        <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. General Policy</h2>
        <p className="mb-4">Because BaseParse provides computational resources that are consumed upon use, we generally do not offer refunds for API credits or subscription fees once they have been processed.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Exceptions</h2>
        <p className="mb-4">Refunds may be considered on a case-by-case basis in the event of major, prolonged system outages or if you were incorrectly billed due to an error on our end.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Requesting a Refund</h2>
        <p className="mb-4">If you believe you are entitled to a refund under our exceptions policy, please contact support within 7 days of the billing event. We will review your request and respond within 3 business days.</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Cancellation</h2>
        <p className="mb-4">You may cancel your monthly subscription at any time. Your access will remain active until the end of your current billing cycle, after which you will not be charged again. We do not provide prorated refunds for mid-cycle cancellations.</p>
      </div>
    </div>
  );
}
