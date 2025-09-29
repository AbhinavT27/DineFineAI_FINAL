import { supabase } from '@/integrations/supabase/client';

interface ReviewAnalysisResult {
  whatPeopleLove: string[];
  areasForImprovement: string[];
}

interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

export const analyzeReviewsWithAI = async (
  reviews: Review[],
  restaurantName: string
): Promise<ReviewAnalysisResult> => {
  try {
    console.log(`Analyzing ${reviews.length} reviews for ${restaurantName}`);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be logged in');
    }

    // Create a prompt for the AI analysis
    const reviewTexts = reviews.map(review => review.text).join('\n\n');
    
    const prompt = `You are given a list of user reviews for a restaurant called "${restaurantName}". Analyze the reviews and summarize them into a maximum of three bullet points each for the following:

What People Love – highlight specific aspects that are consistently praised
Areas for Improvement – highlight common complaints or suggestions

Make each bullet concise and based only on trends or repeated sentiments in the reviews. Do not include generic or vague statements.

Reviews:
${reviewTexts}

Please respond with JSON in this exact format:
{
  "whatPeopleLove": ["point 1", "point 2", "point 3"],
  "areasForImprovement": ["point 1", "point 2", "point 3"]
}`;

    const { data, error } = await supabase.functions.invoke('analyze-restaurant-reviews', {
      body: {
        prompt,
        restaurantName,
        reviews: reviews
      }
    });

    if (error) {
      console.error('Failed to analyze reviews:', error);
      return generateFallbackAnalysis(reviews);
    }

    // Parse the AI response
    if (data && data.whatPeopleLove && data.areasForImprovement) {
      return {
        whatPeopleLove: data.whatPeopleLove.slice(0, 3),
        areasForImprovement: data.areasForImprovement.slice(0, 3)
      };
    }

    return generateFallbackAnalysis(reviews);

  } catch (error) {
    console.error('Error analyzing reviews:', error);
    return generateFallbackAnalysis(reviews);
  }
};

const generateFallbackAnalysis = (reviews: Review[]): ReviewAnalysisResult => {
  // Simple fallback analysis based on review patterns
  const positiveKeywords = ['great', 'excellent', 'amazing', 'delicious', 'fresh', 'good', 'love', 'best', 'perfect', 'wonderful'];
  const negativeKeywords = ['bad', 'terrible', 'awful', 'slow', 'cold', 'expensive', 'rude', 'dirty', 'wait', 'loud'];
  
  const allReviewText = reviews.map(r => r.text.toLowerCase()).join(' ');
  
  const whatPeopleLove: string[] = [];
  const areasForImprovement: string[] = [];
  
  // Check for food quality mentions
  if (allReviewText.includes('fresh') || allReviewText.includes('delicious') || allReviewText.includes('quality')) {
    whatPeopleLove.push('Fresh, high-quality food');
  }
  
  // Check for service mentions
  if (allReviewText.includes('service') && (allReviewText.includes('good') || allReviewText.includes('great'))) {
    whatPeopleLove.push('Friendly and attentive service');
  }
  
  // Check for atmosphere mentions
  if (allReviewText.includes('atmosphere') || allReviewText.includes('ambiance') || allReviewText.includes('nice place')) {
    whatPeopleLove.push('Pleasant dining atmosphere');
  }
  
  // Check for common complaints
  if (allReviewText.includes('wait') || allReviewText.includes('slow')) {
    areasForImprovement.push('Service speed and wait times');
  }
  
  if (allReviewText.includes('expensive') || allReviewText.includes('pricey')) {
    areasForImprovement.push('Pricing and value for money');
  }
  
  if (allReviewText.includes('loud') || allReviewText.includes('noisy')) {
    areasForImprovement.push('Noise level during busy periods');
  }
  
  // Ensure we have at least some content
  if (whatPeopleLove.length === 0) {
    whatPeopleLove.push('Popular dining destination');
  }
  
  if (areasForImprovement.length === 0) {
    areasForImprovement.push('Can be busy during peak hours');
  }
  
  return {
    whatPeopleLove: whatPeopleLove.slice(0, 3),
    areasForImprovement: areasForImprovement.slice(0, 3)
  };
};