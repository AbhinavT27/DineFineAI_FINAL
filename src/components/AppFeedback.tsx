
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureGates } from '@/hooks/useFeatureGates';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/sonner';
import { MessageSquare, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AppFeedback = () => {
  const { user } = useAuth();
  const { canSendFeedback, incrementFeedbackRequest } = useFeatureGates();
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    feedback_type: '',
    subject: '',
    message: '',
    rating: '',
    user_email: user?.email || ''
  });

  const feedbackTypes = [
    { value: 'bug', label: t('feedback.bugReport') },
    { value: 'feature_request', label: t('feedback.featureRequest') },
    { value: 'ai_quality', label: t('feedback.aiQuality') },
    { value: 'general', label: t('feedback.generalFeedback') }
  ];

  const resetForm = () => {
    setFeedbackData({
      feedback_type: '',
      subject: '',
      message: '',
      rating: '',
      user_email: user?.email || ''
    });
  };

  const submitFeedback = async () => {
    if (!feedbackData.feedback_type || !feedbackData.subject || !feedbackData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!canSendFeedback()) {
      toast.error('Daily feedback limit reached (3 per day). Try again tomorrow!');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('app_feedback')
        .insert({
          user_id: user?.id || null,
          feedback_type: feedbackData.feedback_type,
          subject: feedbackData.subject,
          message: feedbackData.message,
          rating: feedbackData.rating ? parseInt(feedbackData.rating) : null,
          user_email: feedbackData.user_email || null
        });

      if (error) throw error;

      // Increment feedback counter
      await incrementFeedbackRequest();

      toast.success('Thank you! Your feedback has been submitted.');
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFeedbackData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {t('feedback.sendFeedback')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('feedback.sendAppFeedback')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="feedback_type">{t('feedback.feedbackType')} *</Label>
            <Select 
              value={feedbackData.feedback_type} 
              onValueChange={(value) => handleInputChange('feedback_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('feedback.selectFeedbackType')} />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">{t('feedback.subject')} *</Label>
            <Input
              id="subject"
              value={feedbackData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder={t('feedback.subjectPlaceholder')}
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="message">{t('feedback.message')} *</Label>
            <Textarea
              id="message"
              value={feedbackData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder={t('feedback.messagePlaceholder')}
              rows={4}
              maxLength={1000}
            />
          </div>

          {(feedbackData.feedback_type === 'ai_quality' || feedbackData.feedback_type === 'general') && (
            <div>
              <Label>{t('feedback.overallRating')}</Label>
              <RadioGroup 
                value={feedbackData.rating} 
                onValueChange={(value) => handleInputChange('rating', value)}
                className="flex gap-4 mt-2"
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                    <Label htmlFor={`rating-${rating}`} className="flex items-center gap-1">
                      {rating} <Star className="h-3 w-3" />
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {!user && (
            <div>
              <Label htmlFor="user_email">Email (Optional)</Label>
              <Input
                id="user_email"
                type="email"
                value={feedbackData.user_email}
                onChange={(e) => handleInputChange('user_email', e.target.value)}
                placeholder="your.email@example.com"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Provide your email if you'd like us to follow up on your feedback.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={submitFeedback} disabled={isLoading} className="flex-1">
              {isLoading ? t('feedback.submitting') : t('feedback.submitFeedback')}
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppFeedback;
