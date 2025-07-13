"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserPersistence } from "@/lib/hooks/useUserPersistence";

import FeatureCard from "@/components/featureCard";
import { Card } from "@/components/ui/card";

import { Shield, Lock, Users, Globe } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const currentUser = useUserPersistence();

  useEffect(() => {
    if (currentUser) router.replace("chat");
  }, [currentUser, router]);

  return (
    <main className="from-background via-background to-muted min-h-screen bg-gradient-to-br">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="from-primary to-primary/60 mb-4 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent select-none md:text-5xl">
            Anonymous P2P Chat
          </h1>

          <p className="text-muted-foreground mx-auto max-w-2xl text-lg select-none">
            Connect directly with others. No registration. No server storage.
            Complete privacy with end-to-end encryption.
          </p>
        </header>

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
        </Card>
      </div>
    </main>
  );
}
