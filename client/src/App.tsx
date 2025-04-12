import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import View from "@/pages/View";
import TestPDFViewer from "@/pages/TestPDFViewer";
import TestIframePDFViewer from "@/pages/TestIframePDFViewer";
import TestDirectPDFViewer from "@/pages/TestDirectPDFViewer";

const Router: React.FC = () => (
  <Switch>
    <Route path="/" component={Home} />
    <Route path="/view" component={View} />
    <Route path="/test-pdf" component={TestPDFViewer} />
    <Route path="/test-iframe-pdf" component={TestIframePDFViewer} />
    <Route path="/test-direct-pdf" component={TestDirectPDFViewer} />
    <Route component={NotFound} />
  </Switch>
);

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <Router />
    <Toaster />
  </QueryClientProvider>
);

export default App;
