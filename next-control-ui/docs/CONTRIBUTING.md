# Contributing Guide

Thank you for your interest in contributing to the Next Control UI project! This guide will help you get started with contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Component Guidelines](#component-guidelines)
6. [Documentation Guidelines](#documentation-guidelines)
7. [Testing Guidelines](#testing-guidelines)
8. [Pull Request Process](#pull-request-process)
9. [Reporting Issues](#reporting-issues)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). All contributors are expected to maintain a respectful and inclusive environment.

## Getting Started

1. Fork the repository
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/next-control-ui.git
   cd next-control-ui
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch (if applicable)
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Emergency fixes

### 2. Making Changes

1. Create a new branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name main
   ```

2. Make your changes:
   - Write clean, readable code
   - Follow the coding standards
   - Add tests for new features
   - Update documentation if needed

3. Test your changes:

   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### 3. Pull Request

1. Push your branch to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a pull request to the `main` branch

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Prefer type annotations over type inference where clarity is needed
- Use `interface` for object shapes and `type` for unions/intersections
- Avoid `any` type; use proper typing instead

```typescript
// Good
interface UserProps {
  id: string;
  name: string;
  email: string;
}

// Bad
interface UserProps {
  id: any;
  name: any;
  email: any;
}
```

### Naming Conventions

- Components: PascalCase (`MyComponent`)
- Functions: camelCase (`myFunction`)
- Variables: camelCase (`myVariable`)
- Constants: SCREAMING_SNAKE_CASE (`MY_CONSTANT`)
- File names: PascalCase for components, camelCase for utilities

### File Structure

```
components/
├── icons/          # Icon components
├── ui/            # Reusable UI components
└── index.ts       # Component exports
```

## Component Guidelines

### 1. Icon Components

When adding new icons:

1. Add the icon to `components/icons/icons.tsx`
2. Export the icon in `components/icons/index.ts`
3. Add the icon to the `IconName` type
4. Update the documentation

```typescript
// Add to components/icons/icons.tsx
export const NewIcon = createIcon({
  name: 'NewIcon',
  original: <svg>...</svg>,
});

// Update components/icons/index.ts
export { NewIcon } from "./icons";

// Update type definition
export type IconName =
  // ... existing types
  | 'newIcon';
```

### 2. Ant Design Integration

When using Ant Design components:

- Always use TypeScript interfaces for props
- Follow Ant Design's API when extending components
- Add proper error boundaries
- Handle loading states appropriately

```typescript
interface CustomButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  children,
  ...props
}) => {
  return (
    <Button
      loading={isLoading}
      type={variant === 'primary' ? 'primary' : 'default'}
      {...props}
    >
      {children}
    </Button>
  );
};
```

### 3. Component Best Practices

- Use functional components with hooks
- Prefer composition over inheritance
- Keep components pure and predictable
- Avoid inline styles; use CSS classes or Tailwind CSS
- Implement proper prop validation

## Documentation Guidelines

### 1. Code Documentation

- Use JSDoc comments for public APIs
- Document component props and return types
- Provide usage examples

```typescript
/**
 * A custom button component with loading state
 * @param {CustomButtonProps} props - Component props
 * @returns {JSX.Element} Rendered button component
 */
export const CustomButton: React.FC<CustomButtonProps> = (props) => {
  // ... implementation
};
```

### 2. README Files

- Create README.md for new components
- Include installation instructions
- Provide usage examples
- Document available props and methods

### 3. API Documentation

- Document all public APIs
- Include examples for complex configurations
- Note any breaking changes in migration guides

## Testing Guidelines

### 1. Unit Tests

Write tests for:

- Component rendering
- User interactions
- State management
- Helper functions

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomButton } from './CustomButton';

describe('CustomButton', () => {
  it('renders with correct text', () => {
    render(<CustomButton>Click me</CustomButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<CustomButton onClick={onClick}>Click me</CustomButton>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Integration Tests

Test component interactions and API calls.

### 3. Test Commands

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Pull Request Process

### 1. PR Checklist

Before creating a PR:

- [ ] Code follows the project's coding standards
- [ ] All tests pass (`npm test`)
- [ ] Code is linted (`npm run lint`)
- [ ] Documentation is updated if needed
- [ ] Breaking changes are documented
- [ ] Changes are tested on the target environment

### 2. PR Template

Use this template when creating a PR:

```markdown
## Description

Brief description of the changes

## Changes Made

- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## Testing

- [ ] Unit tests updated/added
- [ ] Integration tests
- [ ] Manual testing performed

## Screenshots (if applicable)

<!-- Add screenshots here -->

## Related Issues

Closes #123
```

### 3. Review Process

1. Submit PR to `main` branch
2. Wait for review from maintainers
3. Address review comments
4. Get approval from at least one maintainer
5. PR will be merged automatically or manually

## Reporting Issues

### 1. Bug Reports

When reporting bugs, include:

- Environment details (OS, Node.js version)
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error messages (if any)
- Screenshots (if helpful)

### 2. Feature Requests

When suggesting features:

- Describe the feature clearly
- Explain the use case
- Include mockups if helpful
- Note any potential impacts

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Ant Design Documentation](https://ant.design)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

Thank you for contributing! 🎉
