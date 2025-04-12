
import React from 'react';
import { Shield, Settings, Bell } from 'lucide-react';

const Navbar = () => {
  return (
    <div className="w-full bg-waf-bg border-b border-zinc-800 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-waf-accent" />
          <span className="font-bold text-xl">WAF Shield</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded-full bg-waf-card flex items-center justify-center cursor-pointer">
            <Bell className="h-4 w-4 text-waf-muted" />
          </div>
          <div className="w-8 h-8 rounded-full bg-waf-card flex items-center justify-center cursor-pointer">
            <Settings className="h-4 w-4 text-waf-muted" />
          </div>
          <div className="w-8 h-8 rounded-full bg-waf-accent flex items-center justify-center cursor-pointer">
            <span className="text-sm font-medium text-white">SY</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
