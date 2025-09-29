
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { UserPreferences } from '@/lib/types';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

interface AIChatProps {
  onPreferencesUpdate: (preferences: Partial<UserPreferences>) => void;
  onSearchTrigger: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ onPreferencesUpdate, onSearchTrigger }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi there! I'm your DineFineAI assistant. What kind of restaurant are you looking for today?",
      isUser: false,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (content: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);
    
    // Simulating AI analyzing the message
    setTimeout(() => {
      let response = '';
      let preferences: Partial<UserPreferences> = {};
      
      // Simple keyword matching for this demo
      const lowerMsg = userMessage.toLowerCase();
      
      if (lowerMsg.includes('italian') || lowerMsg.includes('pasta') || lowerMsg.includes('pizza')) {
        response = "Great choice! I'll look for Italian restaurants near you. Any dietary restrictions I should know about?";
        preferences.cuisineType = 'Italian';
      } else if (lowerMsg.includes('chinese') || lowerMsg.includes('asian')) {
        response = "I'll find Chinese restaurants in your area. Are you allergic to anything I should filter out?";
        preferences.cuisineType = 'Chinese';
      } else if (lowerMsg.includes('mexican') || lowerMsg.includes('tacos')) {
        response = "Mexican cuisine it is! Do you prefer casual or more upscale dining?";
        preferences.cuisineType = 'Mexican';
      } else if (lowerMsg.includes('vegetarian') || lowerMsg.includes('vegan')) {
        response = "I'll make sure to only show restaurants with vegetarian or vegan options. Any specific cuisine type you're interested in?";
        preferences.dietaryRestrictions = lowerMsg.includes('vegetarian') 
          ? ['Vegetarian'] 
          : ['Vegan'];
      } else if (lowerMsg.includes('gluten')) {
        response = "I'll find restaurants with gluten-free options. Any particular cuisine you're in the mood for today?";
        preferences.dietaryRestrictions = ['Gluten-Free'];
      } else if (lowerMsg.includes('budget') || lowerMsg.includes('cheap') || lowerMsg.includes('inexpensive')) {
        response = "Looking for budget-friendly options. Got it! Any food preferences?";
        preferences.priceRange = '$';  // Fixed: using $ instead of £
      } else if (lowerMsg.includes('fancy') || lowerMsg.includes('expensive') || lowerMsg.includes('fine dining')) {
        response = "I'll search for upscale dining options in your area. Any cuisine preferences?";
        preferences.priceRange = '$$$';  // Fixed: using $$$ instead of £££
      } else if (lowerMsg.includes('search') || lowerMsg.includes('find')) {
        response = "I'll start searching for restaurants based on your preferences now!";
        addMessage(response, false);
        setIsTyping(false);
        onSearchTrigger();
        return;
      } else {
        response = "Could you tell me more about what type of food or restaurant you're looking for? Or if you have any dietary restrictions?";
      }
      
      // Update preferences if we detected any
      if (Object.keys(preferences).length > 0) {
        onPreferencesUpdate(preferences);
      }
      
      addMessage(response, false);
      setIsTyping(false);
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    addMessage(inputMessage, true);
    setInputMessage('');
    simulateResponse(inputMessage);
  };

  return (
    <Card className="flex flex-col h-[400px] border shadow-sm">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.isUser
                    ? 'bg-foodRed text-white'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-foodGray animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-foodGray animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-foodGray animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Ask about restaurants..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" className="bg-foodRed hover:bg-foodRed/90">
            <Send size={18} />
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default AIChat;
