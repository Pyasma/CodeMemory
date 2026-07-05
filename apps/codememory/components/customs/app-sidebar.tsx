"use client"

import * as React from "react"
import Image from "next/image"
import { Show } from "@clerk/nextjs"
import Link from "next/link"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from "@/components/ui/sidebar"
import { UserProfile } from "./user-profile"
import { CreditCard, Disc } from "lucide-react"
import { AddRepoDialog } from "./CreateRepoDialog"

type Project = {
  id: string
  name: string
  githubUrl: string
}

interface AppSidebarProps {
  projects?: Project[]
}

export function AppSidebar({ projects = [] }: AppSidebarProps) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-855 bg-zinc-950 text-white">
      <SidebarHeader className="border-b border-zinc-900 px-4 py-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between gap-3">
          <Link href="/welcome" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="CodeMemory Logo"
              width={collapsed ? 24 : 100}
              height={collapsed ? 24 : 32}
              className="h-6 w-auto object-contain invert"
              priority
            />
            {!collapsed && (
              <span className="text-sm font-semibold tracking-tight text-white">
                CodeMemory
              </span>
            )}
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-4 p-3 group-data-[collapsible=icon]:p-2 bg-zinc-950">
        <SidebarGroup className="p-1 group-data-[collapsible=icon]:p-0">
          <SidebarGroupLabel className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <AddRepoDialog />
              </SidebarMenuItem>

              {projects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    render={<Link href={`/repo/${project.id}`} />}
                    className="rounded-xl transition-colors hover:bg-zinc-900 hover:text-white"
                  >
                    <span>{project.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-1 group-data-[collapsible=icon]:p-0">
          <SidebarGroupLabel className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/welcome/billing" />}
                  className="w-full justify-start rounded-xl transition-colors hover:bg-zinc-900 hover:text-white"
                >
                  <CreditCard className="h-4 w-4" />
                  {!collapsed && <span>Billing</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/welcome/buy-cd" />}
                  className="w-full justify-start rounded-xl transition-colors hover:bg-zinc-900 hover:text-white"
                >
                  <Disc className="h-4 w-4" style={{ animation: "spin 6s linear infinite" }} />
                  {!collapsed && <span>Buy your CD</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-900 px-4 py-4 group-data-[collapsible=icon]:px-2 bg-zinc-950">
        <SidebarMenu>
          <Show when="signed-in">
            <SidebarMenuItem>
              <UserProfile compact={collapsed} />
            </SidebarMenuItem>
          </Show>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
