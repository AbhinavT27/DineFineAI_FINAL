
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';

const TermsOfService = () => {
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
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-6">
            <p>
              By accessing and using DineFineAI ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree to these Terms, please do not use the Service.
            </p>

            <div>
              <h3 className="text-lg font-semibold mb-3">1. Description of Service</h3>
              <p>
                DineFineAI is a restaurant recommendation platform that uses artificial intelligence to help users 
                discover dining experiences based on their preferences, dietary restrictions, and location.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">2. User Accounts</h3>
              <p>
                To use certain features of the Service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and up-to-date information</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">3. Acceptable Use</h3>
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Post false, misleading, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use the Service for commercial purposes without our express permission</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">4. Privacy and Data</h3>
              <p>
                Your privacy is important to us. We collect and use your information in accordance with our Privacy Policy. 
                By using the Service, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">5. Restaurant Information</h3>
              <p>
                The restaurant information, reviews, and recommendations provided through the Service are for informational 
                purposes only. We do not guarantee the accuracy, completeness, or timeliness of this information. 
                Restaurant details, menus, prices, and availability may change without notice.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">6. AI Recommendations</h3>
              <p>
                Our AI-powered recommendations are based on algorithms and user data. While we strive to provide relevant 
                and helpful suggestions, we do not guarantee that recommendations will meet your expectations or dietary needs. 
                Always verify restaurant information and menu details directly with the establishment.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">7. Limitation of Liability</h3>
              <p>
                To the fullest extent permitted by law, DineFineAI shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, 
                arising out of or in connection with your use of the Service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">8. Termination</h3>
              <p>
                We may terminate or suspend your account and access to the Service at any time, with or without cause, 
                and with or without notice. You may also terminate your account at any time by contacting us.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">9. Changes to Terms</h3>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting 
                the new Terms on this page. Your continued use of the Service after any such changes constitutes your 
                acceptance of the new Terms.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">10. Contact Information</h3>
              <p>
                If you have any questions about these Terms of Service, please contact us through the feedback form 
                available in the application.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
