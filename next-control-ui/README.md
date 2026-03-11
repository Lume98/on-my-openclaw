# Next Control UI

A modern control interface built with Next.js 16, React 19, and Ant Design 6. This project provides a clean, responsive UI component library for the OpenClaw platform.

## 🎨 Features

- **Next.js 16** - The latest React framework with App Router
- **React 19** - Latest React with concurrent features
- **Ant Design 6** - Enterprise-class UI component library
- **Tailwind CSS 4** - Utility-first CSS framework
- **TypeScript** - Full type safety
- **Geist Font** - Modern font family from Vercel
- **Lucide Icons** - Beautiful, consistent icon library
- **Dark Mode** - Built-in dark theme support

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd next-control-ui

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Development

```bash
# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
next-control-ui/
├── app/                    # Next.js App Router
│   ├── globals.css       # Global styles with Tailwind CSS
│   ├── layout.tsx         # Root layout with Ant Design registry
│   └── page.tsx          # Home page with icon demo
├── components/            # Custom components
│   └── icons/            # Lucide icon components
│       ├── icons.tsx     # Icon implementations
│       ├── index.ts      # Export definitions
│       └── README.md     # Icon documentation
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
└── public/               # Static assets
```

## 🎯 Core Components

### Icons

The project includes a complete set of Lucide icons as React components:

```tsx
import { MessageSquare, BarChart, SettingsIcon } from '@/components/icons';

// Individual icon usage
<MessageSquare size={24} className="text-blue-500" />
<BarChart size={32} className="text-green-500" />
<SettingsIcon size={28} className="text-purple-500" />

// Dynamic icon rendering
import { Icon, type IconName } from '@/components/icons';
<Icon name="settings" size={32} className="text-zinc-700" />
```

### Available Icons

- **Navigation**: MessageSquare, BarChart, Link, Radio, FileText, Zap, Monitor
- **UI**: Menu, X, Check, ArrowDown, Copy, Search
- **Tools**: Wrench, FileCode, Edit, PenLine, Paperclip, Globe, Image, Smartphone, Plug
- **Others**: Circle, Puzzle, Brain, Book, Loader, Bug, ScrollText, Folder

## 🎨 Styling

### Ant Design Integration

The project uses Ant Design with Next.js registry for optimal performance:

```tsx
import { Button, Card, Space } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";

// In layout
<AntdRegistry>
  <App />
</AntdRegistry>;
```

### Tailwind CSS

Custom styles with Tailwind CSS 4:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}
```

### Dark Mode

Built-in dark mode support:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

## 🛠️ Scripts

```bash
# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type check
tsc --noEmit
```

## 🔧 Configuration

### TypeScript

Path aliases configured for easy imports:

```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

### Next.js

Custom Next.js configuration for optimal performance.

## 📖 Documentation

### Ant Design Components

For comprehensive documentation on all available Ant Design components:

- [English Documentation](https://ant.design/docs/react/introduce)
- [Chinese Documentation](https://ant.design/docs/react/introduce-cn)
- [Component Documentation](https://ant.design/docs/react/overview)

### Icon Usage

See `components/icons/README.md` for detailed icon usage examples.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy automatically on every push

### Other Platforms

The project can be deployed to any platform that supports Node.js:

- Netlify
- AWS Amplify
- Digital Ocean App Platform
- Railway

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is part of the OpenClaw platform. See the main repository for license details.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Ant Design Documentation](https://ant.design)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
