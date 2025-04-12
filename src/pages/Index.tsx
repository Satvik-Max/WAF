
import React from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WafDashboard from '@/components/WafDashboard';

const Index = () => {
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-waf-bg text-waf-text">
        <Navbar />
        <div className="container mx-auto py-6 px-4 flex-grow">
          <h1 className="text-2xl font-bold mb-6">Web Application Firewall Dashboard</h1>
          <WafDashboard />
        </div>
        <Footer />
      </div>
    </TooltipProvider>
  );
};

export default Index;
