import { ReactNode } from "react";

import { Card } from "@/components/ui/card";

const FeatureCard: React.FC<{
  icon: ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  return (
    <Card className="p-4 text-center transition-shadow hover:shadow-lg">
      <div className="text-primary mb-2 flex justify-center">{icon}</div>
      <h3 className="mb-1 font-semibold select-none">{title}</h3>
      <p className="text-muted-foreground text-sm select-none">{description}</p>
    </Card>
  );
};

export default FeatureCard;
