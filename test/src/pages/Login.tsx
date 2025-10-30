import { type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import UserInfoForm from "@/components/UserInfoForm";

import { Shield, Lock, Users, Globe } from "lucide-react";

const Login = () => {
  return (
    <>
      <div className="mx-auto mb-12 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-4">
        <FeatureCard
          icon={<Shield className="size-6" />}
          title="100% Anonymous"
          description="No email or phone required"
        />
        <FeatureCard
          icon={<Lock className="size-6" />}
          title="E2E Encrypted"
          description="Messages encrypted locally"
        />
        <FeatureCard
          icon={<Users className="size-6" />}
          title="P2P Direct"
          description="No server middleman"
        />
        <FeatureCard
          icon={<Globe className="size-6" />}
          title="Global Connect"
          description="Chat with anyone, anywhere"
        />
      </div>

      <Card className="mx-auto max-w-md p-6 md:p-8">
        <h2 className="mb-6 text-center text-2xl font-semibold">
          Start Chatting Anonymously
        </h2>
        <UserInfoForm />
      </Card>
    </>
  );
};

function FeatureCard({
  icon,
  title,
  description,
}: Readonly<{
  icon: ReactNode;
  title: string;
  description: string;
}>) {
  return (
    <Card className="p-4 text-center transition-shadow hover:shadow-lg">
      <div className="text-primary mb-2 flex justify-center">{icon}</div>
      <h3 className="mb-1 font-semibold select-none">{title}</h3>
      <p className="text-muted-foreground text-sm select-none">{description}</p>
    </Card>
  );
}

export default Login;
