import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter, useLocation } from "react-router";
import Navbar from "./constituents/navbar";
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

const container = document.getElementById("root");
const root = createRoot(container!);

const AppLayout = () => {
  const notShowNavbar = ["/login", "/register"];
  const path = useLocation().pathname;
  return (
    <>
      {!notShowNavbar.includes(path) && <Navbar />}
      <App />
      <Toaster />
    </>
  );
};

function renderApp() {
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>
  );
}

renderApp();

if (import.meta.hot) {
  import.meta.hot.accept(renderApp);
}
