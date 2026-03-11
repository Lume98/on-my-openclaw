# Component Usage Guide

This guide demonstrates how to use the various components and features available in the Next Control UI project.

## Built-in Components

### Icon Components

The project includes a comprehensive set of Lucide icons as React components.

#### Basic Usage

```tsx
import { MessageSquare, SettingsIcon, SearchIcon } from "@/components/icons";

export function MyComponent() {
  return (
    <div className="space-x-4">
      <MessageSquare size={24} className="text-blue-500" />
      <SettingsIcon size={28} className="text-gray-600" />
      <SearchIcon size={20} className="text-gray-400" />
    </div>
  );
}
```

#### Dynamic Icon Rendering

```tsx
import { Icon, type IconName } from "@/components/icons";

const iconList: IconName[] = ["messageSquare", "settings", "search"];

export function IconGrid() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {iconList.map((iconName) => (
        <div key={iconName} className="flex flex-col items-center">
          <Icon name={iconName} size={32} className="text-indigo-600" />
          <span className="mt-1 text-sm text-gray-600">{iconName}</span>
        </div>
      ))}
    </div>
  );
}
```

### Ant Design Components

The project is configured to work seamlessly with Ant Design components.

#### Button Examples

```tsx
import { Button, Space } from "antd";

export function ButtonExamples() {
  return (
    <Space>
      <Button type="primary">Primary</Button>
      <Button>Default</Button>
      <Button type="dashed">Dashed</Button>
      <Button type="text">Text</Button>
      <Button type="link">Link</Button>
    </Space>
  );
}
```

#### Form with Ant Design

```tsx
import { Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

export function LoginForm() {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    message.success("Login successful!");
    console.log("Success:", values);
  };

  return (
    <Form
      form={form}
      name="login"
      initialValues={{ remember: true }}
      onFinish={onFinish}
      className="max-w-md mx-auto"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: "Please input your Username!" }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Username" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please input your Password!" }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Log in
        </Button>
      </Form.Item>
    </Form>
  );
}
```

#### Data Display Components

```tsx
import { Table, Card, Statistic, Row, Col } from 'antd';
import { BarChartOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';

const dataSource = [
  { key: '1', name: 'John Doe', age: 32, address: 'New York' },
  { key: '2', name: 'Jane Smith', age: 28, address: 'London' },
];

export function DataDisplay() {
  return (
    <div>
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={1128}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Revenue"
              value={¥232323}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Active Sessions"
              value={456}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="User Table">
        <Table
          dataSource={dataSource}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Age', dataIndex: 'age', key: 'age' },
            { title: 'Address', dataIndex: 'address', key: 'address' },
          ]}
        />
      </Card>
    </div>
  );
}
```

## Layout Components

### Grid Layout with Tailwind CSS

```tsx
import { Grid, Row, Col } from "antd";

export function GridLayout() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Page Layout</h1>

      {/* Header */}
      <header className="bg-gray-800 text-white p-4 rounded-lg mb-6">
        <h1 className="text-xl">Header</h1>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Main Content</h2>
            <p>Your main content goes here...</p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md mb-4">
            <h3 className="text-lg font-semibold mb-3">Sidebar</h3>
            <p>Sidebar content...</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">Additional Info</h3>
            <p>Additional content...</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 rounded-lg mt-6">
        <p>Footer content</p>
      </footer>
    </div>
  );
}
```

## Styling Guidelines

### Using Tailwind CSS Classes

```tsx
export function StyledComponent() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Styled Heading</h1>

      <p className="text-gray-600 mb-6 leading-relaxed">
        This paragraph has proper spacing and text color for good readability.
      </p>

      <div className="flex flex-wrap gap-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Primary Button
        </button>

        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
          Secondary Button
        </button>
      </div>
    </div>
  );
}
```

### Dark Mode Support

```tsx
export function DarkModeExample() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Dark Mode Example</h1>

        <p className="mb-4">This content adapts to the system's dark mode preference.</p>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">This card also respects dark mode.</p>
        </div>
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Icon Usage

- Use consistent icon sizes throughout your application
- Leverage `className` for color variations instead of inline styles
- Use the `Icon` component for dynamic icon rendering
- Prefer specific icon imports when using fixed icons

### 2. Ant Design Integration

- Use Ant Design components for forms, tables, and data-heavy interfaces
- Customize Ant Design theme tokens for brand consistency
- Use Ant Design's spacing system for consistent layouts
- Leverage Ant Design's responsive grid system

### 3. Performance Considerations

- Import Ant Design components dynamically for large applications
- Use React.memo for components that don't need re-rendering
- Lazy load routes with Next.js dynamic imports
- Minimize the number of icons imported individually

### 4. Type Safety

```tsx
import { type IconName } from "@/components/icons";

// ✅ Good: Type-safe icon name
const icon: IconName = "settings";

// ❌ Bad: No type safety
const icon = "some-invalid-icon";
```

## Common Patterns

### Loading States

```tsx
import { Spin } from "antd";
import { LoaderIcon } from "@/components/icons";

export function LoadingExample() {
  return (
    <Spin indicator={<LoaderIcon spin />} className="flex justify-center items-center h-64">
      <div>Loading content...</div>
    </Spin>
  );
}
```

### Error Boundaries

```tsx
import { Result } from "antd";

export function ErrorBoundaryFallback() {
  return <Result status="error" title="Something went wrong" subTitle="Please try again later" />;
}
```

### Responsive Design

```tsx
export function ResponsiveComponent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.id} className="bg-white p-4 rounded-lg shadow-md">
          {/* Content */}
        </div>
      ))}
    </div>
  );
}
```
