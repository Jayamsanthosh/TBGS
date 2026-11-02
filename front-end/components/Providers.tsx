"use client";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import React from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { AuthProvider } from "@/context/AuthContext";
import SubmitConfirmation from "@/components/SubmitConfirmation";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <TooltipProvider>
          {children}
          <SubmitConfirmation />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </Provider>
  );
}
