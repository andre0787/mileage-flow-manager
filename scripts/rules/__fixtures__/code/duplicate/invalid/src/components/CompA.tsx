import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  title: string;
  value: number;
  subtitle: string;
}

export function CompA({ title, value, subtitle }: Props) {
  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-2xl">{value}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
