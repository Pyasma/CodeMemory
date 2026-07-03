"use client";

import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";

export function ClerkHeader() {
  return (
    <header className="border-zinc-200 bg-white/90 backdrop-blur">
      <div className="flex h-10 items-center justify-between">

        <div className=" flex gap-3">
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
        </div>
      </div>
    </header>
  );
}
