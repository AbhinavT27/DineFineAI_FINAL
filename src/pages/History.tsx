
import React from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import RestaurantHistoryTab from '@/components/RestaurantHistoryTab';
import SearchHistoryTab from '@/components/SearchHistoryTab';
import ComparisonHistoryTab from '@/components/ComparisonHistoryTab';
import MenuHistoryTab from '@/components/MenuHistoryTab';

const History = () => {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/home">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">History</h1>
          <p className="text-gray-600 mt-2">View your restaurant visits and search history</p>
        </div>

        <Tabs defaultValue="restaurants" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="restaurants">Restaurant History</TabsTrigger>
            <TabsTrigger value="searches">Search History</TabsTrigger>
            <TabsTrigger value="comparisons">Comparison History</TabsTrigger>
            <TabsTrigger value="menus">Menu History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="restaurants" className="mt-6">
            <RestaurantHistoryTab />
          </TabsContent>
          
          <TabsContent value="searches" className="mt-6">
            <SearchHistoryTab />
          </TabsContent>
          
          <TabsContent value="comparisons" className="mt-6">
            <ComparisonHistoryTab />
          </TabsContent>
          
          <TabsContent value="menus" className="mt-6">
            <MenuHistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default History;
