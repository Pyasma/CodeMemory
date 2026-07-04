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
              className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-300 bg-white shadow-sm transition-colors hover:bg-zinc-50"
            >
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-zinc-200 text-sm font-medium text-zinc-700">
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
                  ? "h-10 w-10 justify-center rounded-full border border-sidebar-border bg-gray-50 p-0 hover:bg-gray-200"
                  : "w-full justify-start gap-3 rounded-xl border border-sidebar-border bg-gray-50 px-5 py-6 text-left hover:bg-gray-200"
              }
            >
              {compact ? (
                <>
                  <Settings2 className="size-4" />
                  <span className="sr-only">Billing</span>
                </>
              ) : (
                <>
                  <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-zinc-200 text-sm font-medium text-zinc-700">
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
                    <span className="truncate font-medium">
                      {isSignedIn && isLoaded ? name : "Guest"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Account menu
                    </span>
                  </div>
                </>
              )}
            </SidebarMenuButton>
          }
        />
      )}

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              openUserProfile()
            }}
          >
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem>Billing</DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              void signOut()
            }}
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
