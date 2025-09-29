
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ArrowUpDown } from 'lucide-react';

export type SortOption = 'name-asc' | 'price-asc' | 'distance-asc' | 'menu-scraped';

interface SortDropdownProps {
  onSortChange: (sortOption: SortOption) => void;
  currentSort?: SortOption;
}

const SortDropdown = ({ onSortChange, currentSort }: SortDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { value: 'name-asc' as SortOption, label: 'Sort A-Z' },
    { value: 'price-asc' as SortOption, label: 'Sort by Price' },
    { value: 'distance-asc' as SortOption, label: 'Sort by Distance' },
    { value: 'menu-scraped' as SortOption, label: "Sort by Menu's Scraped" },
  ];

  const handleSortSelect = (sortOption: SortOption) => {
    onSortChange(sortOption);
    setIsOpen(false);
  };

  const getCurrentSortLabel = () => {
    const current = sortOptions.find(option => option.value === currentSort);
    return current ? current.label : 'Sort';
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <ArrowUpDown size={16} />
          {getCurrentSortLabel()}
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSortSelect(option.value)}
            className={`cursor-pointer ${currentSort === option.value ? 'bg-accent' : ''}`}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortDropdown;
