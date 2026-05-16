"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import PoppyDrawer from "./PoppyDrawer";
import { getDisplayName, getGreetingName, firstNameOf } from "@/lib/profile-names";

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
  resetJourney: () => Promise<void>;
  credits: number | null;
  setCredits: (v: number) => void;
  // Role & name fields
  isCustodian: boolean;
  patientName: string | null;     // raw patient_name from DB (custodian only)
  userName: string | null;        // raw name from DB (the logged-in user's own name)
  /** The patient's name — used everywhere except greetings. For carers this is the patient they care for. */
  displayName: string | null;
  /** The logged-in user's own first name — used only in "Good morning" greetings. */
  greetingName: string | null;
  setIsCustodian: (v: boolean) => void;
  setPatientName: (v: string | null) => void;
  setUserName: (v: string | null) => void;
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
  resetJourney: async () => {},
  credits: null,
  setCredits: () => {},
  isCustodian: false,
  patientName: null,
  userName: null,
  displayName: null,
  greetingName: null,
  setIsCustodian: () => {},
  setPatientName: () => {},
  setUserName: () => {},
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
  const [credits, setCredits] = useState<number | null>(null);
  const [isCustodian, setIsCustodian] = useState(false);
  const [patientName, setPatientName] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile) setLoggedIn(true);
        setConditions(profile?.conditions ?? []);
        setOnboardingCompleted(profile?.onboarding_completed ?? false);
        if (profile?.credits !== undefined) setCredits(profile.credits);

        const custodian = profile?.is_custodian ?? false;
        const pName     = profile?.patient_name ?? null;
        const uName     = profile?.name?.trim() ?? null;

        setIsCustodian(custodian);
        setPatientName(pName);
        setUserName(uName);

        // Dev diagnostic — remove once confirmed working
        if (process.env.NODE_ENV === "development") {
          const role     = custodian ? "carer" : "patient";
          const displayN = firstNameOf(getDisplayName({ name: uName, patient_name: pName, is_custodian: custodian }));
          const greetingN = firstNameOf(getGreetingName({ name: uName, patient_name: pName, is_custodian: custodian }));
          console.log(`[Poppy] Role: ${role} | Greeting name: ${greetingN ?? "(none)"} | Display name (patient): ${displayN ?? "(none)"}`);
        }
      })
      .catch(() => {})
      .finally(() => setConditionsLoaded(true));

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

  async function resetJourney() {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions: [], onboarding_completed: false }),
    });
    setConditions([]);
    setOnboardingCompleted(false);
    setMessages([]);
  }

  // Computed names — derived from raw state, always in sync
  const profileFields  = { name: userName, patient_name: patientName, is_custodian: isCustodian };
  const displayName    = firstNameOf(getDisplayName(profileFields));   // patient name everywhere
  const greetingName   = firstNameOf(getGreetingName(profileFields));  // user's own name for greeting

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
      resetJourney,
      credits,
      setCredits,
      isCustodian,
      patientName,
      userName,
      displayName,
      greetingName,
      setIsCustodian,
      setPatientName,
      setUserName,
    }}>
      {children}
      {loggedIn && <PoppyDrawer />}
    </PoppyContext.Provider>
  );
}
