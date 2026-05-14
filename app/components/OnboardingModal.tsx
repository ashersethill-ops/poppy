"use client";

import { useState } from "react";
import ConditionSelector from "./ConditionSelector";
import PoppyIcon from "./PoppyIcon";
import { usePoppyContext } from "./PoppyProvider";

type Props = {
  userIsLoggedIn: boolean;
};

export default function OnboardingModal({ userIsLoggedIn }: Props) {
  const {
    conditionsLoaded,
    onboardingCompleted,
    forceOnboarding,
    setConditions: setContextConditions,
    setOnboardingCompleted,
    setForceOnboarding,
  } = usePoppyContext();
  const [localConditions, setLocalConditions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const isForced = forceOnboarding;
  const visible = userIsLoggedIn && conditionsLoaded && (!onboardingCompleted || isForced);

  if (!visible) return null;

  async function handlePersonalize() {
    if (localConditions.length === 0) return;
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions: localConditions, onboarding_completed: true }),
      });
      setContextConditions(localConditions);
      setOnboardingCompleted(true);
      setForceOnboarding(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
        style={{ background: "var(--background)" }}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-4">
            <PoppyIcon size={52} />
          </div>
          <h2
            className="text-2xl font-semibold tracking-tight mb-2"
            style={{ color: "var(--primary)" }}
          >
            {isForced ? "Set up your patient profile" : "Welcome to Poppy!"}
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed">
            {isForced
              ? "Add your own conditions so Poppy can personalise your patient experience."
              : "Tell us what you\u2019re managing so we can personalise your experience."}
          </p>
        </div>

        <div className="mb-6">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--primary)" }}
          >
            Your condition(s)
          </label>
          <ConditionSelector selected={localConditions} onChange={setLocalConditions} />
        </div>

        <button
          onClick={handlePersonalize}
          disabled={localConditions.length === 0 || saving}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {saving ? "Saving…" : "Personalise Poppy"}
        </button>
      </div>
    </div>
  );
}
