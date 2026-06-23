"use client";

import { Button } from "@heroui/react";
import React from "react";

type AdvisorQuickPromptsProps = {
  prompts: readonly string[];
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
};

export function AdvisorQuickPrompts({
  prompts,
  onSelectPrompt,
  disabled = false,
}: AdvisorQuickPromptsProps) {
  return (
    <section
      className="story-advisor-quick-prompts"
      aria-labelledby="story-advisor-quick-prompts-label"
    >
      <span
        id="story-advisor-quick-prompts-label"
        className="story-advisor-quick-prompts-label"
      >
        Gợi ý nhanh:
      </span>
      <div className="story-advisor-quick-prompts-list">
        {prompts.map((prompt) => (
          <Button
            key={prompt}
            type="button"
            variant="flat"
            className="story-advisor-quick-prompt"
            onPress={() => onSelectPrompt(prompt)}
            isDisabled={disabled}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </section>
  );
}
