import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center mb-8">
            <Logo linkTo={false} size="xl" className="mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Privacy Matters</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-6">
            <p>
              At DineFineAI, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our service.
            </p>

            <div>
              <h3 className="text-lg font-semibold mb-3">1. Information We Collect</h3>
              <p>We collect information you provide directly to us, such as:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Account information (username, email, phone number)</li>
                <li>Profile preferences (dietary restrictions, allergies, location)</li>
                <li>Search history and restaurant interactions</li>
                <li>Feedback and communications with our support team</li>
              </ul>
              <p className="mt-3">
                We also automatically collect certain information when you use our service, including:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Usage patterns and app interactions</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">2. How We Use Your Information</h3>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Provide personalized restaurant recommendations</li>
                <li>Analyze menus for dietary compatibility</li>
                <li>Improve our AI algorithms and service quality</li>
                <li>Send you relevant notifications and updates</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Ensure the security and integrity of our platform</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">3. Information Sharing</h3>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>To protect our rights, property, or safety</li>
                <li>With trusted service providers who assist in our operations (under strict confidentiality agreements)</li>
                <li>In connection with a business transaction (merger, acquisition, etc.)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">4. Data Security</h3>
              <p>
                We implement industry-standard security measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication protocols</li>
                <li>Secure data storage with reputable cloud providers</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">5. Your Rights and Choices</h3>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Access and review your personal information</li>
                <li>Correct or update inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of certain communications</li>
                <li>Request data portability</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">6. Location Information</h3>
              <p>
                We may collect and use your location information to provide location-based restaurant recommendations. 
                You can control location sharing through your device settings or app preferences.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">7. Cookies and Tracking</h3>
              <p>
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and 
                provide personalized content. You can manage cookie preferences through your browser settings.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">8. Children's Privacy</h3>
              <p>
                Our service is not intended for users under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If we become aware of such collection, we will take steps to 
                delete the information promptly.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">9. Data Retention</h3>
              <p>
                We retain your personal information only for as long as necessary to provide our services, 
                comply with legal obligations, and resolve disputes. When data is no longer needed, we securely 
                delete or anonymize it.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">10. Changes to This Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                by posting the updated policy on our website and updating the "Last updated" date.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">11. Contact Us</h3>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us 
                through the feedback form available in the application.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;