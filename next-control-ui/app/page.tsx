import {
  MessageSquare,
  BarChart,
  SettingsIcon,
  MenuIcon,
  SearchIcon,
  Icon,
  type IconName,
} from "../components/icons";

export default function Home() {
  const icons: IconName[] = [
    "messageSquare",
    "barChart",
    "link",
    "radio",
    "fileText",
    "zap",
    "monitor",
    "settings",
    "bug",
    "scrollText",
    "folder",
    "menu",
    "x",
    "check",
    "arrowDown",
    "copy",
    "search",
    "brain",
    "book",
    "loader",
    "wrench",
    "fileCode",
    "edit",
    "penLine",
    "paperclip",
    "globe",
    "image",
    "smartphone",
    "plug",
    "circle",
    "puzzle",
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-zinc-50">
      <main className="max-w-7xl mx-auto px-4 py-16">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Icon Components</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Lucide-style SVG icons migrated from ui/src/ui/icons.ts to React components
          </p>
        </header>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Direct Component Usage</h2>
          <div className="flex flex-wrap gap-6 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <MessageSquare size={32} className="text-blue-500" />
              <span className="text-sm">MessageSquare</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <BarChart size={32} className="text-green-500" />
              <span className="text-sm">BarChart</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <SettingsIcon size={32} className="text-purple-500" />
              <span className="text-sm">SettingsIcon</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MenuIcon size={32} className="text-orange-500" />
              <span className="text-sm">MenuIcon</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <SearchIcon size={32} className="text-red-500" />
              <span className="text-sm">SearchIcon</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">All Icons Grid</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            {icons.map((iconName) => (
              <div
                key={iconName}
                className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <Icon name={iconName} size={32} className="text-zinc-700 dark:text-zinc-300" />
                <span className="text-xs text-center">{iconName}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Usage Examples</h2>
          <pre className="overflow-x-auto p-4 bg-zinc-800 text-zinc-100 rounded-md text-sm">
            {`// Import individual icon
import { MessageSquare, SearchIcon } from '@/components/icons';

// Use with props
<MessageSquare size={24} className="text-blue-500" />

// Import all icons
import * as Icons from '@/components/icons';

// Dynamic rendering
import { Icon, type IconName } from '@/components/icons';
<Icon name="settings" size={32} />`}
          </pre>
        </section>
      </main>
    </div>
  );
}
