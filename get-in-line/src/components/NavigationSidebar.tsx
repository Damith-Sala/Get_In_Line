'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  List, 
  UserCheck, 
  BarChart3, 
  User, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

interface NavigationSidebarProps {
  userRole: string;
  userEmail: string;
  onSignOut: () => void;
}

export function NavigationSidebar({ userRole, userEmail, onSignOut }: NavigationSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["user", "staff", "business_admin", "super_admin"]
    },
    {
      name: "View Queues",
      href: "/queues",
      icon: List,
      roles: ["user", "staff", "business_admin", "super_admin"]
    },
    {
      name: "My Queues",
      href: "/my-queues",
      icon: UserCheck,
      roles: ["user", "staff", "business_admin", "super_admin"]
    },
    {
      name: "Business Admin",
      href: "/business-admin",
      icon: BarChart3,
      roles: ["business_admin", "super_admin"]
    },
    {
      name: "Staff Dashboard",
      href: "/staff-dashboard",
      icon: BarChart3,
      roles: ["staff", "business_admin", "super_admin"]
    }
  ];

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className={cn(
      "flex flex-col h-screen bg-gray-50 border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-white">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <List className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-lg text-gray-800">Get In Line</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-gray-200"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-gray-700 hover:bg-gray-200 hover:text-gray-900",
                  isActive && "bg-blue-100 text-blue-700",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-300 bg-white">
        {!isCollapsed && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 truncate">
              {userEmail}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {userRole.replace('_', ' ')}
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <Link href="/profile">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-gray-700 hover:bg-gray-200 hover:text-gray-900",
                isCollapsed && "justify-center px-2"
              )}
            >
              <User className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Profile"}
            </Button>
          </Link>
          
          <Button
            variant="ghost"
            onClick={onSignOut}
            className={cn(
              "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && "Sign Out"}
          </Button>
        </div>
      </div>
    </div>
  );
}