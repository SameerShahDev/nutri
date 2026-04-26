'use client';

import { motion } from 'framer-motion';
import { FileText, Shield, CreditCard, AlertCircle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Terms and Conditions</h1>
          </div>

          <div className="text-gray-300 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-400 leading-relaxed">
                By accessing and using Igone, you agree to be bound by these Terms and Conditions. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                2. Subscription Plans
              </h2>
              <div className="space-y-3 text-gray-400">
                <p>Igone offers the following subscription plans:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Free Plan:</strong> 3 photo analyses and 10 AI chats per day</li>
                  <li><strong className="text-white">Starter (₹99/month):</strong> 20 photo analyses and 100 AI chats per day</li>
                  <li><strong className="text-white">Pro (₹299/month):</strong> 50 photo analyses and 500 AI chats per day</li>
                  <li><strong className="text-white">Elite Unlimited (₹999/month):</strong> Unlimited photo analyses and AI chats (recurring)</li>
                </ul>
                <p className="text-sm text-gray-500 mt-2">All plans include access to Coach Arnie AI, meal tracking, water tracking, and workout plans.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                3. Payment Terms
              </h2>
              <div className="space-y-3 text-gray-400">
                <p>Payments are processed securely through Cashfree Payments.</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>One-time payments for Starter and Pro plans (valid for 30 days)</li>
                  <li>Monthly recurring payments for Elite Unlimited plan</li>
                  <li>You can cancel your Elite Unlimited subscription at any time from your profile</li>
                  <li>Refunds are processed within 7-10 business days for valid requests</li>
                  <li>All prices are in Indian Rupees (INR) and inclusive of applicable taxes</li>
                  <li>Failed payments may result in temporary service suspension</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-400" />
                4. Usage Limits
              </h2>
              <div className="space-y-3 text-gray-400">
                <p>Daily usage limits are reset at 12:00 AM IST every day.</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Photo analysis and chat counts are tracked separately</li>
                  <li>Exceeding limits will block further AI features until the next day</li>
                  <li>Upgrade your plan to increase your daily limits</li>
                  <li>Elite Unlimited plan has no daily restrictions on photo analyses and AI chats</li>
                  <li>Usage limits are calculated per user account and cannot be shared</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                5. Privacy and Data
              </h2>
              <div className="space-y-3 text-gray-400">
                <p>We respect your privacy and handle your data responsibly:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your food photos are used only for AI analysis and are stored securely</li>
                  <li>Chat conversations with Coach Arnie are stored securely in our database</li>
                  <li>We do not sell your personal data to third parties</li>
                  <li>You can request data deletion at any time through your profile settings</li>
                  <li>We use industry-standard encryption to protect your data</li>
                  <li>See our Privacy Policy for more details on data handling</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-400" />
                6. AI Disclaimer
              </h2>
              <div className="space-y-3 text-gray-400">
                <p>Our AI-powered features provide estimates and suggestions:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Food analysis results are estimates and may not be 100% accurate</li>
                  <li>Fitness coaching suggestions are for informational purposes only</li>
                  <li>Consult a healthcare professional for medical advice</li>
                  <li>We are not liable for decisions based on AI recommendations</li>
                  <li>AI responses may vary and should be used as guidance, not definitive advice</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                7. Account Termination
              </h2>
              <div className="space-y-3 text-gray-400">
                <p>We reserve the right to terminate accounts that:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violate these Terms and Conditions</li>
                  <li>Engage in fraudulent activities or payment abuse</li>
                  <li>Abuse our AI features or systems</li>
                  <li>Attempt to bypass usage limits or security measures</li>
                  <li>Share account credentials with others</li>
                  <li>Use the service for illegal or harmful purposes</li>
                </ul>
                <p className="text-sm text-gray-500 mt-2">Account termination may result in loss of access without refund.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                8. Refund Policy
              </h2>
              <div className="space-y-3 text-gray-400">
                <p>Our refund policy is as follows:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Refunds are available within 7 days of purchase for Starter and Pro plans</li>
                  <li>Elite Unlimited subscriptions can be cancelled anytime, but no partial refunds</li>
                  <li>Refund requests must be made through support@igone.com</li>
                  <li>Refunds are processed to the original payment method</li>
                  <li>Processing time: 7-10 business days</li>
                  <li>Service usage may affect refund eligibility</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                9. Changes to Terms
              </h2>
              <p className="text-gray-400 leading-relaxed">
                We may update these Terms and Conditions from time to time. 
                Continued use of the service after changes constitutes acceptance of the new terms.
                We will notify users of significant changes via email or in-app notifications at least 7 days before they take effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                10. Governing Law
              </h2>
              <p className="text-gray-400 leading-relaxed">
                These Terms and Conditions are governed by and construed in accordance with the laws of India.
                Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in [Your City], India.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                11. Contact Information
              </h2>
              <div className="space-y-3 text-gray-400">
                <p>For questions about these Terms and Conditions, contact us at:</p>
                <ul className="list-none space-y-2 ml-4">
                  <li><strong className="text-white">Email:</strong> support@igone.com</li>
                  <li><strong className="text-white">Address:</strong> [Your Business Address]</li>
                </ul>
              </div>
            </section>

            <div className="border-t border-gray-700 pt-6 mt-8">
              <p className="text-gray-500 text-sm">
                Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
