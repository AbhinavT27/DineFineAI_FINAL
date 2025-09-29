import { Badge } from '@/components/ui/badge';

interface RestaurantCardTagsProps {
  restaurantTags: any[];
}

const RestaurantCardTags: React.FC<RestaurantCardTagsProps> = ({ restaurantTags }) => {
  if (restaurantTags.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {restaurantTags.slice(0, 3).map((tagData) => (
        <Badge 
          key={tagData.id} 
          variant="outline" 
          className="text-xs px-2 py-0.5" 
          style={{ 
            borderColor: tagData.user_tags?.color || '#3B82F6',
            color: tagData.user_tags?.color || '#3B82F6'
          }}
        >
          {tagData.user_tags?.tag_name}
        </Badge>
      ))}
      {restaurantTags.length > 3 && (
        <Badge variant="outline" className="text-xs px-2 py-0.5">
          +{restaurantTags.length - 3}
        </Badge>
      )}
    </div>
  );
};

export default RestaurantCardTags;