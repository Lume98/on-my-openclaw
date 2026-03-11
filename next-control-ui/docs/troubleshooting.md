# Troubleshooting Guide

This guide helps you resolve common issues when working with the Next Control UI project.

## Common Issues and Solutions

### 1. Node.js Version Issues

**Error**: `node: command not found` or version mismatch

**Solution**:

```bash
# Check Node.js version
node -v
npm -v

# If not using Node.js 18+, install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18
nvm install 18
nvm use 18
```

### 2. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

### 3. Build Errors

**Error**: Failed to compile

**Solutions**:

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Build with verbose output
npm run build -- --verbose
```

### 4. TypeScript Errors

**Error**: Type checking fails

**Solutions**:

```bash
# Check TypeScript configuration
npx tsc --noEmit --skipLibCheck

# Clear TypeScript cache
rm -rf node_modules/.cache/typescript

# Update TypeScript types
npm install @types/node@latest @types/react@latest
```

### 5. Ant Design Style Not Loading

**Error**: Ant Design components don't have styles

**Solution**: Ensure `AntdRegistry` is properly set up in `app/layout.tsx`:

```tsx
import { AntdRegistry } from "@ant-design/nextjs-registry";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
```

### 6. Icons Not Showing

**Error**: Icons don't render

**Solution**:

- Check import path: `@/components/icons`
- Ensure the icon name is correct (case-sensitive)
- Verify the icon exists in the icon list

```tsx
// Correct import
import { MessageSquare } from "@/components/icons";

// Correct usage
<MessageSquare size={24} className="text-blue-500" />;
```

### 7. Tailwind CSS Not Working

**Error**: Tailwind classes don't apply

**Solution**:

```bash
# Check if Tailwind is installed
npm list tailwindcss

# Reinstall Tailwind
npm install tailwindcss@^4

# Purge and rebuild
rm -rf .next
npm run build
```

### 8. Package Manager Issues

**Error**: npm/yarn/pnpm conflicts

**Solution**: Use the package manager specified in `package.json`:

```bash
# If using pnpm
pnpm install

# If using bun
bun install
```

## Performance Issues

### 1. Slow Development Build

**Solutions**:

```bash
# Clear cache
rm -rf .next

# Use turbo mode (if available)
npm run build -- --turbo

# Disable type checking temporarily
npm run build -- --no-check
```

### 2. Large Bundle Size

**Solutions**:

```bash
# Analyze bundle
npm run build -- --analyze

# Use dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spin />
});
```

### 3. Memory Issues

**Solution**: Increase Node.js memory limit:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

## Environment Setup Issues

### 1. Git Configuration

**Error**: Git hooks not working

**Solution**:

```bash
# Install pre-commit hooks
npm run precommit

# Or manually
prek install
```

### 2. ESLint Configuration

**Error**: Linting fails

**Solution**:

```bash
# Check ESLint configuration
npm run lint -- --fix

# Update ESLint
npm install eslint@latest eslint-config-next@latest
```

### 3. TypeScript Path Aliases

**Error**: `@/*` imports not working

**Solution**: Verify `tsconfig.json` paths:

```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

## Debugging Techniques

### 1. Browser DevTools

1. Open Chrome DevTools (F12 or Ctrl+Shift+I)
2. Use the Elements tab to inspect components
3. Use the Console tab for errors
4. Use the Network tab to check API calls

### 2. React Developer Tools

Install React Developer Tools extension for:

- Component tree visualization
- Props and state inspection
- Performance profiling

### 3. Logging

```tsx
import { useEffect } from "react";

export function DebugComponent() {
  useEffect(() => {
    console.log("Component mounted");
    console.log("Props:", { prop1, prop2 });
  }, [prop1, prop2]);

  return <div>Debugging...</div>;
}
```

### 4. Breakpoint Debugging

```tsx
import { useDebugValue } from "react";

export function CustomHook() {
  const value = expensiveComputation();
  useDebugValue(`Value: ${value}`);
  return value;
}
```

## Advanced Troubleshooting

### 1. Circular Dependencies

**Error**: Circular dependency detected

**Solution**: Refactor to extract shared functionality:

```typescript
// utils/shared.ts
export function sharedFunction() {
  /* ... */
}

// ComponentA.ts
import { sharedFunction } from "@/utils/shared";

// ComponentB.ts
import { sharedFunction } from "@/utils/shared";
```

### 2. Memory Leaks

**Detection**:

- Chrome DevTools Memory tab
- React Profiler

**Solutions**:

- Clean up event listeners
- Cancel async operations
- Avoid unnecessary state updates

```tsx
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

### 3. SSR vs CSR Issues

**Error**: Hydration mismatch

**Solution**: Ensure server and client render the same content:

```tsx
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
```

## Getting Help

### 1. Stack Overflow

Search for issues with these tags:

- `next.js`
- `react`
- `ant-design`
- `tailwindcss`

### 2. Official Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Ant Design Documentation](https://ant.design)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Documentation](https://react.dev)

### 3. GitHub Issues

When creating an issue:

1. Use the bug report template
2. Include reproduction steps
3. Provide error messages
4. Include environment info (Node.js, OS, etc.)

### 4. Community Resources

- [Next.js Discord](https://nextjs.org/discord)
- [Ant Design Discord](https://ant.design/discord)
- [Reactiflux Discord](https://reactiflux.com)

## Performance Checklist

Before deploying:

- [ ] Run `npm run build` successfully
- [ ] Check bundle size
- [ ] Verify all components render correctly
- [ ] Test responsive design
- [ ] Check console for errors
- [ ] Verify accessibility
- [ ] Test with different screen sizes
