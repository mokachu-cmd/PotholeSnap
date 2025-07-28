import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IconCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

export function IconCard({ icon, title, children }: IconCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold truncate">{children}</div>
      </CardContent>
    </Card>
  );
}
