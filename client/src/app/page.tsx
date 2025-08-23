"use client";

import { ReactNode } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import UserInfoForm from "@/components/UserInfoForm";

import { Shield, Lock, Users, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="from-background via-background to-muted min-h-screen bg-gradient-to-br">
      <div className="container mx-auto px-4 py-8">
        <ThemeToggle />

        <header className="mb-12 text-center">
          <h1 className="from-primary to-primary/60 mb-4 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent select-none md:text-5xl">
            Anonymous P2P Chat
          </h1>

          <p className="text-muted-foreground mx-auto max-w-2xl text-lg select-none">
            Connect directly with others. No registration. No server storage.
            Complete privacy with end-to-end encryption.
          </p>
        </header>

        <main>
          <div className="mx-auto mb-12 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-4">
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="100% Anonymous"
              description="No email or phone required"
            />
            <FeatureCard
              icon={<Lock className="h-6 w-6" />}
              title="E2E Encrypted"
              description="Messages encrypted locally"
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="P2P Direct"
              description="No server middleman"
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
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
        </main>

        <footer className="text-muted-foreground mt-12 text-center text-sm">
          <p>Your data is stored locally and expires in 24 hours</p>
          <p className="mt-2">No cookies • No tracking • No logs</p>
        </footer>
      </div>
    </div>
  );
}
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
