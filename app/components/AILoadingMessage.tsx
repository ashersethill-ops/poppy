"use client";

import { useEffect, useState } from "react";

interface Props {
  messages: string[];
  interval?: number;
}

export default function AILoadingMessage({ messages, interval = 2600 }: Props) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      const swap = setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 350);
      return () => clearTimeout(swap);
    }, interval);
    return () => clearInterval(timer);
  }, [messages, interval]);

  return (
    <div className="flex items-center gap-3 mb-6 px-1 select-none">
      {/* Pulsing beacon */}
      <div className="relative flex-shrink-0 w-2.5 h-2.5">
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "var(--accent)", opacity: 0.45 }}
        />
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: "var(--accent)" }}
        />
      </div>

      {/* Rotating message */}
      <p
        className="text-sm font-medium transition-opacity duration-300"
        style={{ color: "var(--primary)", opacity: visible ? 1 : 0 }}
      >
        {messages[index]}
      </p>
    </div>
  );
}
