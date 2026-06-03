import {
  Clock,
  FolderHeart,
  Home,
  Link as LinkIcon,
  Search,
  Settings,
} from "lucide-react";

export const vinMusicNavItems = [
  { group: "Discover", title: "Home", href: "/app", icon: Home },
  { group: "Discover", title: "Search", href: "/app/search", icon: Search },
  { group: "Discover", title: "Import Link", href: "/app/import", icon: LinkIcon },
  
  { group: "Library", title: "Collections", href: "/app/collections", icon: FolderHeart },
  { group: "Library", title: "Recently Played", href: "/app/history", icon: Clock },
  
  { group: "System", title: "Settings", href: "/app/settings", icon: Settings },
] as const;
