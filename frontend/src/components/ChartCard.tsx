import React from "react";
import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <Card className={`p-0 ${className}`}>
      <CardHeader className="mb-0 flex-row items-start justify-between gap-3 p-5 pb-4 sm:p-6 sm:pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && <CardDescription className="mt-0.5">{subtitle}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="h-64 w-full p-5 pt-0 sm:p-6 sm:pt-0">{children}</CardContent>
    </Card>
  );
}
