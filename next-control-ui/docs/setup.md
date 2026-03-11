# Setup Guide

This guide will help you set up the Next Control UI project in your development environment.

## Prerequisites

- Node.js 18 or higher
- npm, yarn, pnpm, or bun
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd next-control-ui
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install

# Or using bun
bun install
```

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

## Environment Setup

### Local Development

The project is designed to run locally without any additional configuration. However, you can create a `.env.local` file for environment variables:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8789
```

### VS Code Setup

If you're using VS Code, consider installing these extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

## Project Configuration

### Ant Design Theme Customization

To customize Ant Design theme, create a `app/theme.tsx` file:

```tsx
import { theme } from "antd";

export const antTheme = {
  token: {
    colorPrimary: "#1677ff",
    borderRadius: 6,
    // Add more theme tokens here
  },
  components: {
    Button: {
      borderRadius: 4,
      // Customize button styles
    },
  },
};
```

Then update `app/layout.tsx`:

```tsx
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { antTheme } from "./theme";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConfigProvider theme={antTheme}>
          <AntdRegistry>{children}</AntdRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
```

### Tailwind CSS Configuration

Tailwind CSS is configured in `postcss.config.mjs` and `app/globals.css`. You can extend the theme by modifying these files.

## Testing

The project uses Vitest for testing. To run tests:

```bash
npm test
```

For coverage:

```bash
npm run test:coverage
```

## Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy automatically on every push

### Docker

You can also run the application with Docker:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Node.js Version Issues

If you encounter Node.js version issues, consider using nvm:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use Node.js 18
nvm install 18
nvm use 18
```

### Port Already in Use

If port 3000 is already in use, you can specify a different port:

```bash
npm run dev -- -p 3001
```

### Build Errors

If you encounter build errors, try:

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Build again
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Test your changes
5. Submit a pull request

## Getting Help

If you encounter any issues:

1. Check the [Ant Design Documentation](https://ant.design)
2. Check the [Next.js Documentation](https://nextjs.org/docs)
3. Check the [Tailwind CSS Documentation](https://tailwindcss.com/docs)
4. Open an issue in the repository
