"use client";

import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { UserProfile } from "./user-profile";

export function ClerkHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/90 px-4 backdrop-blur">
      <div className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-zinc-950">
            CodeMemory
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
          <SignInButton>
            <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
              Sign up
            </button>
          </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserProfile variant="header" />
          </Show>
        </div>
      </div>
    </header>
  );
}
