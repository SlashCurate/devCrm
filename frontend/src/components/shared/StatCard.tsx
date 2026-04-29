import React from "react";
import clsx from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "blue" | "green" | "yellow" | "red" | "purple" | "indigo";
  subtitle?: string;
}

const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   text: "text-blue-600"   },
  green:  { bg: "bg-green-50",  icon: "bg-green-100 text-green-600", text: "text-green-600"  },
  yellow: { bg: "bg-yellow-50", icon: "bg-yellow-100 text-yellow-600",text: "text-yellow-600" },
  red:    { bg: "bg-red-50",    icon: "bg-red-100 text-red-600",     text: "text-red-600"    },
  purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600",text: "text-purple-600" },
  indigo: { bg: "bg-indigo-50", icon: "bg-indigo-100 text-indigo-600",text: "text-indigo-600" },
};

export default function StatCard({
  title, value, icon: Icon, color, subtitle,
}: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={clsx("card flex items-center gap-4", c.bg)}>
      <div className={clsx("p-3 rounded-xl", c.icon)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className={clsx("text-2xl font-bold", c.text)}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}