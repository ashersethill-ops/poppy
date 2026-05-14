"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import PoppyDrawer from "./PoppyDrawer";

type Message = { role: "user" | "assistant"; content: string };
type StoredDoc = { id: string; name: string };

type PatientOverride = {
  patientId: string;
  patientName: string;
  conditions: string[];
  documentIds: string[];
};

type PoppyContextType = {
  conditions: string[];
  conditionsLoaded: boolean;
  setConditions: (c: string[]) => void;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (v: boolean) => void;
  forceOnboarding: boolean;
  setForceOnboarding: (v: boolean) => void;
  documents: StoredDoc[];
  documentsLoaded: boolean;
  setDocuments: React.Dispatch<React.SetStateAction<StoredDoc[]>>;
  pageContext: string;
  setPageContext: (ctx: string) => void;
  patientOverride: PatientOverride | null;
  setPatientOverride: (override: PatientOverride | null) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PoppyContext = createContext<PoppyContextType>({
  conditions: [],
  conditionsLoaded: false,
  setConditions: () => {},
  onboardingCompleted: false,
  setOnboardingCompleted: () => {},
  forceOnboarding: false,
  setForceOnboarding: () => {},
  documents: [],
  documentsLoaded: false,
  setDocuments: () => {},
  pageContext: "",
  setPageContext: () => {},
  patientOverride: null,
  setPatientOverride: () => {},
  messages: [],
  setMessages: () => {},
  isOpen: false,
  setIsOpen: () => {},
});

export function usePoppyContext() {
  return useContext(PoppyContext);
}

export default function PoppyProvider({ children }: { children: React.ReactNode }) {
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionsLoaded, setConditionsLoaded] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);
  const [documents, setDocuments] = useState<StoredDoc[]>([]);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [pageContext, setPageContext] = useState("");
  const [patientOverride, setPatientOverride] = useState<PatientOverride | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load profile conditions
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile }) => {
        setConditions(profile?.conditions ?? []);
        setOnboardingCompleted(profile?.onboarding_completed ?? false);
      })
      .catch(() => {})
      .finally(() => setConditionsLoaded(true));

    // Load document metadata (ids + names only — text stays server-side)
    fetch("/api/documents")
      .then((r) => r.json())
      .then(({ documents: docs }) => {
        if (Array.isArray(docs)) {
          setDocuments(docs.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name })));
        }
      })
      .catch(() => {})
      .finally(() => setDocumentsLoaded(true));
  }, []);

  return (
    <PoppyContext.Provider value={{
      conditions,
      conditionsLoaded,
      setConditions,
      onboardingCompleted,
      setOnboardingCompleted,
      forceOnboarding,
      setForceOnboarding,
      documents,
      documentsLoaded,
      setDocuments,
      pageContext,
      setPageContext,
      patientOverride,
      setPatientOverride,
      messages,
      setMessages,
      isOpen,
      setIsOpen,
    }}>
      {children}
      <PoppyDrawer />
    </PoppyContext.Provider>
  );
}
