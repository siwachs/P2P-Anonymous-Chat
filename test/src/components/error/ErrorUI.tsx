import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { AlertTriangle } from "lucide-react";

interface ErrorUIProps {
  error?: Error | null;
  errorMessage?: string;
}

export default function ErrorUI({
  error,
  errorMessage,
}: Readonly<ErrorUIProps>) {
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/");
  };

  const displayMessage =
    errorMessage ||
    error?.message ||
    "An unexpected error occurred. Please try refreshing the page.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="bg-card text-card-foreground flex flex-col items-center space-y-4 text-center max-w-md p-8 rounded-xl border shadow-lg">
        <AlertTriangle className="text-destructive size-12" />
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">{displayMessage}</p>

        {import.meta.env.DEV && error && (
          <details className="mt-4 text-left text-xs bg-muted/50 p-4 rounded-lg w-full max-h-64 overflow-auto">
            <summary className="cursor-pointer font-semibold mb-2">
              Error Details
            </summary>
            <pre className="overflow-auto whitespace-pre-wrap text-xs mt-2 text-muted-foreground">
              {error.toString()}
              {"\n\n"}
              {error.stack}
            </pre>
          </details>
        )}

        <Button onClick={goHome} className="mt-4 w-full">
          Return to Home
        </Button>
      </div>
    </div>
  );
}
