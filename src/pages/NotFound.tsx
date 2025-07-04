import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log the 404 error to the console for debugging purposes
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">
      <div className="bg-white p-10 rounded-lg shadow-xl text-center max-w-md w-full">
        <div className="mb-6">
          <h1 className="text-6xl font-extrabold text-red-600 mb-2 animate-bounce">404</h1>
          <p className="text-3xl font-semibold text-gray-700">Page Not Found</p>
        </div>
        <p className="text-lg text-gray-600 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Button
          asChild
          className="px-6 py-3 text-lg"
          variant="default"
        >
          <a href="/" className="flex items-center justify-center gap-2">
            <Home className="h-5 w-5" />
            Return to Home
          </a>
        </Button>
      </div>
      <p className="mt-8 text-sm text-gray-500">Studio Stats Analytics Dashboard</p>
    </div>
  );
};

export default NotFound;
