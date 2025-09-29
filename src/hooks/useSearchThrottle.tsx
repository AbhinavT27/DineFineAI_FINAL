import { useState, useRef } from 'react';
import { toast } from '@/components/ui/sonner';

interface SearchThrottleConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

const DEFAULT_CONFIG: SearchThrottleConfig = {
  maxRequests: 10, // 10 requests
  windowMs: 24 * 60 * 60 * 1000, // per day (24 hours)
  blockDurationMs: 60 * 60 * 1000, // 1 hour cooldown
};

export const useSearchThrottle = (config: SearchThrottleConfig = DEFAULT_CONFIG) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const requestTimestamps = useRef<number[]>([]);
  const blockEndTime = useRef<number | null>(null);

  const checkThrottle = (): boolean => {
    const now = Date.now();
    
    // Check if we're currently in a blocked state
    if (blockEndTime.current && now < blockEndTime.current) {
      const remainingTime = Math.ceil((blockEndTime.current - now) / 1000);
      toast.error(`Too many search requests. Please wait ${remainingTime} seconds before searching again.`);
      return false;
    }
    
    // Clear the block if time has passed
    if (blockEndTime.current && now >= blockEndTime.current) {
      blockEndTime.current = null;
      setIsBlocked(false);
    }
    
    // Remove timestamps outside the current window
    requestTimestamps.current = requestTimestamps.current.filter(
      timestamp => now - timestamp < config.windowMs
    );
    
    // Check if we've exceeded the limit
    if (requestTimestamps.current.length >= config.maxRequests) {
      blockEndTime.current = now + config.blockDurationMs;
      setIsBlocked(true);
      const blockMinutes = Math.ceil(config.blockDurationMs / (60 * 1000));
      toast.error(`Search limit exceeded. You can search again in ${blockMinutes} minutes.`);
      return false;
    }
    
    // Add current request timestamp
    requestTimestamps.current.push(now);
    
    // Warning when approaching limit
    if (requestTimestamps.current.length >= config.maxRequests - 2) {
      const remaining = config.maxRequests - requestTimestamps.current.length;
      toast.warning(`${remaining} searches remaining today.`);
    }
    
    return true;
  };

  const getRemainingRequests = (): number => {
    const now = Date.now();
    const recentRequests = requestTimestamps.current.filter(
      timestamp => now - timestamp < config.windowMs
    );
    return Math.max(0, config.maxRequests - recentRequests.length);
  };

  const getTimeUntilReset = (): number => {
    if (blockEndTime.current) {
      return Math.max(0, blockEndTime.current - Date.now());
    }
    
    const now = Date.now();
    const oldestRequest = requestTimestamps.current[0];
    if (oldestRequest) {
      return Math.max(0, config.windowMs - (now - oldestRequest));
    }
    return 0;
  };

  return {
    checkThrottle,
    isBlocked,
    getRemainingRequests,
    getTimeUntilReset,
  };
};