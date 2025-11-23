import { useParams } from 'react-router-dom';
import GuestHeader from '@/components/GuestHeader';
import LockedPageState from '@/components/LockedPageState';

const GuestLockedPage = () => {
  const { page } = useParams<{ page: string }>();

  const getPageContent = () => {
    switch (page) {
      case 'profile':
        return {
          title: 'Guest Profile',
          message: 'Your profile is not available in guest mode. Sign up to create and customize your profile!',
        };
      case 'saved':
        return {
          title: 'Guest Saved List',
          message: 'Saved restaurants are not available in guest mode. Sign up to save your favorite spots and access them anytime!',
        };
      case 'plan':
        return {
          title: 'Guest Current Plan',
          message: 'Subscription plans are not available in guest mode. Sign up to unlock unlimited searches and premium features!',
        };
      default:
        return {
          title: 'Guest Mode',
          message: 'This feature is not available in guest mode. Sign up to unlock full access!',
        };
    }
  };

  const content = getPageContent();

  return (
    <div className="min-h-screen">
      <GuestHeader />
      <LockedPageState title={content.title} message={content.message} />
    </div>
  );
};

export default GuestLockedPage;
