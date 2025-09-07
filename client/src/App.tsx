import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "src/components/ui/toaster";
import { TooltipProvider } from "src/components/ui/tooltip";
import { NotFound } from "src/pages/not-found";
import { DecompositionPage } from "src/pages/decomposition";

function Router() {
    return (
        <Switch>
            <Route path="/" component={DecompositionPage} />
            <Route component={NotFound} />
        </Switch>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Toaster />
                <Router />
            </TooltipProvider>
        </QueryClientProvider>
    );
}

export { App };
