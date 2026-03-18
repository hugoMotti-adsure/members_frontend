"use client";

import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useSidebarStore } from "@/features/auth/stores/sidebar.store";
import { useViewModeStore } from "@/features/auth/stores/view-mode.store";
import { useTenant } from "@/lib/tenant-context";
import { cn } from "@/lib/utils";
import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  FolderOpen,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Mail,
  Megaphone,
  Package,
  PanelLeftClose,
  Settings,
  Users,
  Webhook,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Cursos",
    href: "/courses",
    icon: BookOpen,
    roles: ["owner", "admin", "instructor", "super_admin"],
  },
  {
    name: "Materiais",
    href: "/materials",
    icon: FolderOpen,
    roles: ["owner", "admin", "instructor", "super_admin"],
  },
  {
    name: "Anúncios",
    href: "/admin/announcements",
    icon: Megaphone,
    roles: ["owner", "admin", "super_admin"],
  },
  {
    name: "Meus Cursos",
    href: "/my-courses",
    icon: GraduationCap,
    roles: ["student"],
  },
  {
    name: "Meus Materiais",
    href: "/my-materials",
    icon: FolderOpen,
    roles: ["student"],
  },
  {
    name: "Certificados",
    href: "/my-certificates",
    icon: Award,
    roles: ["student"],
  },
];

const adminNavigation = [
  { name: "Alunos", href: "/admin/students", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Certificados", href: "/admin/certificates", icon: Award },
  { name: "Entregas", href: "/admin/offers", icon: Package },
  { name: "Integrações", href: "/admin/integrations", icon: Webhook },
];

const settingsNavigation = [
  { name: "Configurações", href: "/settings", icon: Settings },
];

const platformNavigation = [
  { name: "Painel da Plataforma", href: "/platform", icon: Building2 },
  { name: "Comunicações", href: "/platform/communications", icon: Mail },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { isCollapsed, toggle } = useSidebarStore();
  const { isStudentView } = useViewModeStore();
  const { tenant } = useTenant();
  
  // Se está no modo visualização de aluno, simula role de student
  const effectiveRole = isStudentView ? "student" : user?.role;
  const isAdmin = !isStudentView && (
    user?.role === "owner" ||
    user?.role === "admin" ||
    user?.role === "super_admin"
  );

  // Logos do tenant
  const logoHorizontal = tenant?.logo_horizontal_url;
  const logoIcon = tenant?.logo_icon_url || tenant?.logo_url;
  const tenantName = tenant?.name || "Members";

  return (
    <aside
      className={cn(
        "border-r border-border bg-card flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-border",
          isCollapsed ? "justify-center px-2" : "justify-between px-3",
        )}
      >
        {isCollapsed ? (
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-colors overflow-hidden"
            title="Expandir sidebar"
          >
            {logoIcon ? (
              <img
                src={logoIcon}
                alt={tenantName}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center rounded-lg">
                <Layers className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
          </button>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 min-w-0 flex-1"
            >
              {logoHorizontal ? (
                <img
                  src={logoHorizontal}
                  alt={tenantName}
                  className="h-8 max-w-[140px] object-contain"
                />
              ) : logoIcon ? (
                <>
                  <img
                    src={logoIcon}
                    alt={tenantName}
                    className="w-8 h-8 object-contain flex-shrink-0"
                  />
                  <span className="font-bold text-lg truncate">
                    {tenantName}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg truncate">
                    {tenantName}
                  </span>
                </>
              )}
            </Link>
            <button
              onClick={toggle}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              title="Recolher sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1", isCollapsed ? "p-2" : "p-4")}>
        {navigation
          .filter(
            (item) => !item.roles || item.roles.includes(effectiveRole || ""),
          )
          .map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && item.name}
              </Link>
            );
          })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            {!isCollapsed && (
              <div className="pt-4 pb-2">
                <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administração
                </span>
              </div>
            )}
            {adminNavigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isCollapsed && "justify-center px-2",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </>
        )}

        {/* Super Admin - Painel da Plataforma */}
        {!isStudentView && user?.role === "super_admin" && (
          <>
            {!isCollapsed && (
              <div className="pt-4 pb-2">
                <span className="px-3 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                  Plataforma
                </span>
              </div>
            )}
            {platformNavigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isCollapsed && "justify-center px-2",
                    isActive
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </>
        )}

        {/* Settings - esconde no modo preview de aluno */}
        {!isStudentView && (
          <>
            {!isCollapsed && (
              <div className="pt-4 pb-2">
                <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Conta
                </span>
              </div>
            )}
            {settingsNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isCollapsed && "justify-center px-2",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
