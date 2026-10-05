"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="bg-deep px-6 py-3 text-sm text-stone hover:bg-sea">
      Print cards
    </button>
  );
}
