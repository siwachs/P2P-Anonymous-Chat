import type { FC, ReactNode } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";

const PublicLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="from-background via-background to-muted min-h-screen bg-linear-to-r">
      <div className="container mx-auto px-4 py-8">
        <ThemeToggle />

        <header className="mb-12 text-center">
          <h1 className="from-primary to-primary/60 mb-4 bg-linear-to-r bg-clip-text text-4xl font-bold text-transparent select-none md:text-5xl">
            Anonymous P2P Chat
          </h1>

          <p className="text-muted-foreground mx-auto max-w-2xl text-lg select-none">
            Connect directly with others. No registration. No server storage.
            Complete privacy with end-to-end encryption.
          </p>
        </header>

        <main>{children}</main>

        <footer className="text-muted-foreground mt-12 text-center text-sm">
          <p>Your data is stored locally and expires in 24 hours</p>
          <p className="mt-2">No cookies • No tracking • No logs</p>
        </footer>
      </div>
    </div>
  );
};

export default PublicLayout;
