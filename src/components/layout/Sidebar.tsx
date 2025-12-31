import { NavLink } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Home, LogIn, UserPlus, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useState } from "react";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen border-r bg-background transition-all duration-300",
        open ? "w-64" : "w-15"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="h-16 flex items-center px-3 gap-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {open && (
            <span
              className={cn(
                "font-semibold text-sm",
                "whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                open
                  ? "opacity-100 translate-x-0 w-auto"
                  : "opacity-0 -translate-x-2 w-0"
              )}
            >
              MyApp
            </span>
          )}
        </div>

        <Separator />

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          <NavItem
            to="/"
            icon={<Home className="h-5 w-5" />}
            label="Home"
            open={open}
          />
        </nav>

        <Separator />

        {/* Bottom Auth */}
        <div className="px-2 py-4 space-y-2">
          <Button
            asChild
            className={cn(
              "h-10 px-3 transition-all duration-300 w-full justify-start gap-3"
            )}
          >
            <NavLink to="/login">
              <LogIn className="h-5 w-5 shrink-0" />

              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300",
                  open ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}
              >
                Login
              </span>
            </NavLink>
          </Button>

          <Button
            variant="ghost"
            asChild
            className={cn(
              "h-10 px-3 transition-all duration-300 w-full justify-start gap-3"
            )}
          >
            <NavLink to="/register">
              <UserPlus className="h-5 w-5 shrink-0" />

              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300",
                  open ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}
              >
                Register
              </span>
            </NavLink>
          </Button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  to,
  icon,
  label,
  open,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  open: boolean;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          "group flex items-center h-10 rounded-md text-sm font-medium",
          "transition-colors hover:bg-accent hover:text-accent-foreground justify-start gap-3",
          isActive && "bg-accent text-accent-foreground",
          "px-3"
        )
      }
    >
      {/* Icon */}
      <div className="shrink-0">{icon}</div>

      {/* Label (animated, never removed) */}
      <span
        className={cn(
          "whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
          open
            ? "opacity-100 translate-x-0 w-auto"
            : "opacity-0 -translate-x-2 w-0"
        )}
      >
        {label}
      </span>
    </NavLink>
  );
}
