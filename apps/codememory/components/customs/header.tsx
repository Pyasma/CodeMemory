"use client";

import * as React from "react";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { UserProfile } from "./user-profile";
import Image from "next/image";
import Link from "next/link";

export function ClerkHeader() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-50 w-full px-4 pt-4 md:px-6">
      <header
        className={`pointer-events-auto mx-auto flex w-full max-w-5xl items-center justify-between rounded-full border px-4 py-2.5 transition-all duration-300 md:px-6 ${
          scrolled
            ? "border-white/10 bg-zinc-950/65 shadow-[0_12px_40px_rgba(0,0,0,0.3)] backdrop-blur-md"
            : "border-transparent bg-transparent shadow-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="CodeMemory Logo"
            width={28}
            height={28}
            className="h-7 w-auto select-none invert"
            priority
          />
          <span className="text-sm font-semibold tracking-tight text-white md:text-base">
            CodeMemory
          </span>
        </div>

        {/* Center Navigation Links */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          <Link href="#features" className="text-xs font-medium text-zinc-300 transition-colors hover:text-white">
            Features
          </Link>
          <Link href="#how-it-works" className="text-xs font-medium text-zinc-300 transition-colors hover:text-white">
            How it works
          </Link>
          <Link href="https://github.com/topoteretes/cognee" target="_blank" className="text-xs font-medium text-zinc-300 transition-colors hover:text-white">
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton>
              <button className="rounded-full border border-zinc-750 bg-zinc-900/50 px-4 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white cursor-pointer">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-zinc-200 cursor-pointer">
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserProfile variant="header" />
          </Show>
        </div>
      </header>
    </div>
  );
}
