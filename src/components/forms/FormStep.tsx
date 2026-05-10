'use client';

/**
 * Step indicator + jump-back nav for multi-step forms.
 *
 * - Linear progress: each step is a numbered chip with a label
 * - User can jump back to any visited step (click)
 * - Forward jumps are blocked until the current step validates
 *
 * Usage:
 *   <FormStep
 *     steps={[{ key: 'identity', label: 'Identity' }, ...]}
 *     currentIndex={stepIdx}
 *     onJump={(i) => i <= stepIdx && setStepIdx(i)}
 *   />
 */

export interface FormStepDefinition {
  key: string;
  label: string;
}

interface FormStepProps {
  steps: FormStepDefinition[];
  currentIndex: number;
  onJump?: (index: number) => void;
}

export function FormStep({ steps, currentIndex, onJump }: FormStepProps) {
  return (
    <ol
      className="flex flex-wrap gap-2 mb-8"
      aria-label="Form steps"
    >
      {steps.map((step, i) => {
        const visited = i <= currentIndex;
        const active = i === currentIndex;
        const clickable = visited && onJump != null;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump?.(i)}
              aria-current={active ? 'step' : undefined}
              className={`flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold transition-colors ${
                active
                  ? 'bg-black text-white border border-black'
                  : visited
                  ? 'border border-black/20 text-black hover:border-black'
                  : 'border border-black/10 text-black/30 cursor-not-allowed'
              }`}
            >
              <span className="text-[9px] opacity-60">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <span className="text-black/15 text-xs select-none" aria-hidden>
                ›
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
