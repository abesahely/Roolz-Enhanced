import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient"; // Assuming this exists
import { Toaster } from "@/components/ui/toaster"; // Assuming this exists
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

const Router: React.FC = () => {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;
