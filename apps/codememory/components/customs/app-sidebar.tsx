"use client"

import * as React from "react"
import Image from "next/image"
import { Show } from "@clerk/nextjs"
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
import { NewProjectDialog } from "@/components/customs/CreateRepoDialog"
import { UserProfile } from "./user-profile"
import { CreditCard } from "lucide-react"

const defaultProjects = [
  { name: "CodeMemory", url: "#" },
  { name: "My App", url: "#" },
]

export function AppSidebar() {
  const [projects, setProjects] = React.useState(defaultProjects)
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  function addProject(name: string) {
    setProjects((prev) => [...prev, { name, url: "#" }])
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between gap-3">
          <div
            className={
              collapsed
                ? "relative h-9 w-9 shrink-0"
                : "relative h-15 w-[230px] shrink-0"
            }
          >
            <Image
              src="/logo.svg"
              alt="CodeMemory Logo"
              fill
              priority
              sizes={collapsed ? "36px" : "230px"}
              className="object-contain"
            />
          </div>

          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-4 p-3 group-data-[collapsible=icon]:p-2">
        <SidebarGroup className="p-1 group-data-[collapsible=icon]:p-0">
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NewProjectDialog onAdd={addProject} />
              </SidebarMenuItem>
              {!collapsed && projects.map((project) => (
                <SidebarMenuItem key={project.name}>
                  <SidebarMenuButton render={<a href={project.url} />}>
                    <span>{project.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="p-1 group-data-[collapsible=icon]:p-0">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  className="w-full justify-start rounded-xl"
                >
                  <CreditCard/>

                  {!collapsed && <span>Billing</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:px-2">
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
