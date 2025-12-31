import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { FileQuestion } from "lucide-react";

export default function NotFoundUI() {
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="bg-card text-card-foreground flex flex-col items-center space-y-4 text-center max-w-md p-8 rounded-xl border shadow-lg">
        <FileQuestion className="text-destructive size-12" />
        <h1 className="text-2xl font-semibold">404 - Page Not Found</h1>
        <p className="text-muted-foreground text-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={goHome} className="mt-4 w-full">
          Return to Home
        </Button>
      </div>
    </div>
  );
}
