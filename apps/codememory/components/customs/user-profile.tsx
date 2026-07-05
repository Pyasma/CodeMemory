"use client"

import Image from "next/image"
import { Settings2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useClerk, useUser } from "@clerk/nextjs"
import { SidebarMenuButton } from "../ui/sidebar"

type UserProfileProps = {
  compact?: boolean
  variant?: "sidebar" | "header"
}

export function UserProfile({ compact = false, variant = "sidebar" }: UserProfileProps) {
  const { signOut, openUserProfile } = useClerk()
  const { user, isLoaded, isSignedIn } = useUser()

  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()

  return (
    <DropdownMenu>
      {variant === "header" ? (
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900/50 shadow-sm transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 text-sm font-medium text-zinc-300">
                {isSignedIn && isLoaded && user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt="Profile"
                    fill
                    sizes="32px"
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[radial-gradient(circle_at_25%_30%,rgba(120,255,255,0.8),transparent_40%),radial-gradient(circle_at_65%_75%,rgba(0,200,0,0.6),transparent_35%),linear-gradient(to_bottom_right,#3ddad7,#2ac7c4)]" />
                )}
              </div>
            </button>
          }
        />
      ) : (
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              type="button"
              className={
                compact
                  ? "h-10 w-10 justify-center rounded-full border border-zinc-800 bg-zinc-900/50 p-0 hover:bg-zinc-800 text-white"
                  : "w-full justify-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-6 text-left hover:bg-zinc-900/80 text-white"
              }
            >
              {compact ? (
                <>
                  <Settings2 className="size-4" />
                  <span className="sr-only">Billing</span>
                </>
              ) : (
                <>
                  <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 text-sm font-medium text-zinc-300">
                    {isSignedIn && isLoaded && user?.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt="Profile"
                        fill
                        sizes="32px"
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[radial-gradient(circle_at_25%_30%,rgba(120,255,255,0.8),transparent_40%),radial-gradient(circle_at_65%_75%,rgba(0,200,0,0.6),transparent_35%),linear-gradient(to_bottom_right,#3ddad7,#2ac7c4)]" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-start">
                    <span className="truncate font-medium text-white">
                      {isSignedIn && isLoaded ? name : "Guest"}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                      Account menu
                    </span>
                  </div>
                </>
              )}
            </SidebarMenuButton>
          }
        />
      )}

      <DropdownMenuContent align="start" className="w-56 border-zinc-800 bg-zinc-950 text-white">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-850" />

          <DropdownMenuItem
            onClick={() => {
              openUserProfile()
            }}
            className="hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer"
          >
            Manage profile
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              signOut()
            }}
            className="text-red-400 hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer"
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
