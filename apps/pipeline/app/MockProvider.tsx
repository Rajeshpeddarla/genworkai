"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type TicketStatus = "pending" | "working" | "resolved";

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface MockContextType {
  tickets: Ticket[];
  addTicket: (subject: string, description: string) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  currentPlan: string;
  setCurrentPlan: (planId: string) => void;
  availablePlans: Plan[];
}

const MockContext = createContext<MockContextType | undefined>(undefined);

export function MockProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "t_1",
      subject: "API throwing 500 error on 12MB PDF",
      description: "When I upload a specific 12MB file, it fails.",
      status: "pending",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "t_2",
      subject: "Billing cycle question",
      description: "When does the monthly cycle reset?",
      status: "resolved",
      createdAt: new Date(Date.now() - 604800000).toISOString(),
    },
  ]);

  const [currentPlan, setCurrentPlan] = useState<string>("free");

  const availablePlans: Plan[] = [
    {
      id: "free",
      name: "Free Tier",
      price: 0,
      features: ["50 PDF Pages / mo", "Standard Support"],
    },
    {
      id: "pro",
      name: "Pro Builder",
      price: 49,
      features: ["10,000 PDF Pages / mo", "Priority Support", "Unlimited Diagram Extraction"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 299,
      features: ["Custom Rate Limits", "Dedicated Account Manager", "SLA Guarantee"],
    },
  ];

  const addTicket = (subject: string, description: string) => {
    const newTicket: Ticket = {
      id: `t_${Date.now()}`,
      subject,
      description,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  const updateTicketStatus = (id: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  return (
    <MockContext.Provider
      value={{
        tickets,
        addTicket,
        updateTicketStatus,
        currentPlan,
        setCurrentPlan,
        availablePlans,
      }}
    >
      {children}
    </MockContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockContext);
  if (context === undefined) {
    throw new Error("useMockData must be used within a MockProvider");
  }
  return context;
}
