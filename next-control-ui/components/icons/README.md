# Icon Components

Lucide-style SVG icon components migrated from `ui/src/ui/icons.ts` to React components.

## Installation

Icons are located in `components/icons/` and can be imported directly.

## Usage

### Import Individual Icons

```tsx
import { MessageSquare, SearchIcon, SettingsIcon } from "@/components/icons";

export default function MyComponent() {
  return (
    <div>
      <MessageSquare size={24} className="text-blue-500" />
      <SearchIcon size={32} />
      <SettingsIcon size={20} className="text-gray-600" />
    </div>
  );
}
```

### Dynamic Icon Rendering

```tsx
import { Icon, type IconName } from "@/components/icons";

const iconName: IconName = "settings";

export default function MyComponent() {
  return <Icon name={iconName} size={24} />;
}
```

### Import All Icons

```tsx
import * as Icons from "@/components/icons";

// Access via namespace
<Icons.MessageSquare size={24} />;
```

## Props

All icon components accept the following props:

| Prop        | Type                      | Default | Description                 |
| ----------- | ------------------------- | ------- | --------------------------- |
| `size`      | `number \| string`        | `24`    | Icon width and height       |
| `className` | `string`                  | `""`    | CSS class names             |
| `...props`  | `SVGProps<SVGSVGElement>` | -       | Any valid SVG element props |

## Available Icons

### Navigation Icons

- `MessageSquare` - Chat/message icon
- `BarChart` - Statistics/analytics icon
- `LinkIcon` - Link/chain icon
- `RadioIcon` - Radio/waves icon
- `FileText` - Document icon
- `Zap` - Lightning bolt icon
- `Monitor` - Desktop monitor icon
- `SettingsIcon` - Settings gear icon
- `BugIcon` - Bug/debug icon
- `ScrollText` - Scroll/document icon
- `FolderIcon` - Folder icon

### UI Icons

- `MenuIcon` - Hamburger menu icon
- `XIcon` - Close X icon
- `CheckIcon` - Checkmark icon
- `ArrowDown` - Down arrow icon
- `CopyIcon` - Copy icon
- `SearchIcon` - Search magnifying glass
- `BrainIcon` - Brain/AI icon
- `BookIcon` - Book icon
- `LoaderIcon` - Loading spinner

### Tool Icons

- `WrenchIcon` - Wrench tool icon
- `FileCodeIcon` - Code file icon
- `EditIcon` - Edit pencil icon
- `PenLineIcon` - Pen icon
- `PaperclipIcon` - Attachment icon
- `GlobeIcon` - Globe icon
- `ImageIcon` - Image icon
- `SmartphoneIcon` - Mobile phone icon
- `PlugIcon` - Plug icon
- `CircleIcon` - Circle icon
- `PuzzleIcon` - Puzzle icon

## Type Safety

The `IconName` type provides autocomplete and type checking for icon names:

```tsx
import { type IconName } from "@/components/icons";

const validName: IconName = "settings"; // ✅
const invalidName: IconName = "invalid"; // ❌ Type error
```

## Styling

Icons use `currentColor` for stroke color, so they inherit the text color:

```tsx
<div className="text-red-500">
  <SettingsIcon size={24} /> {/* Renders in red */}
</div>
```

You can also override colors with `stroke` prop:

```tsx
<SettingsIcon size={24} stroke="#FF0000" />
```

## Migration Notes

These icons were migrated from `ui/src/ui/icons.ts`:

- Converted from Lit `TemplateResult` to React components
- Maintained identical SVG paths for visual consistency
- Added TypeScript types for better developer experience
- Added `Icon` helper component for dynamic rendering
