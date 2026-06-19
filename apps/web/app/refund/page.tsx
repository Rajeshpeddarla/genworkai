import { getGlobalConfig } from '@/lib/config';

export default async function RefundPage() {
  const config = await getGlobalConfig();

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-300 py-32 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Enterprise Refund & Cancellation Policy</h1>
        <p className="mb-12 text-zinc-500">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-10 text-base leading-relaxed text-zinc-400">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Software Subscription Refunds</h2>
            <p>We provide a 7-day money-back guarantee for initial purchases of monthly and annual GenWorkAI subscription plans. If our intelligence platform fails to meet your technical requirements within the first 7 days, you may request a full refund by contacting our support team.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Usage-based API Credits</h2>
            <p>Purchases of API credits, automation run limits, or custom Model Context Protocol (MCP) server compute hours are non-refundable once the credits have been consumed. Unused credits requested for refund within 7 days of purchase are eligible for return.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Enterprise Agreements</h2>
            <p>For custom Enterprise agreements involving dedicated architecture, on-premise components, or specific Service Level Agreements (SLAs), refund and termination clauses are governed exclusively by the individual contract signed between your organization and GenWorkAI.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Processing Timelines</h2>
            <p>Refunds approved by GenWorkAI are processed by our Merchant of Record (Paddle). Funds typically return to the original payment method within 5-10 business days depending on your banking institution.</p>
          </section>

          <section className="bg-white/5 border border-white/10 p-8 rounded-2xl mt-12">
            <h2 className="text-xl font-semibold text-white mb-4">Initiate a Request</h2>
            <p className="mb-4">To cancel your subscription or request a refund under the 7-day guarantee, please open a ticket or contact our billing team:</p>
            <ul className="space-y-2 text-zinc-300">
              <li><strong>Billing & Support:</strong> <a href={`mailto:${config.support_email}`} className="text-emerald-400 hover:underline">{config.support_email}</a></li>
              <li><strong>Direct Line:</strong> {config.phone_number}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
