# Chat Application

A Next.js chat application with support for multiple chat widget types.

## Chat Widget Configuration

This application supports two different chat widget implementations that can be switched via environment variables:

### Widget Types

1. **Integrated Widget** (`ChatWidget.tsx`)
   - Fully integrated with the app's theme system and context
   - Uses the app's existing ThemeContext and AuthContext
   - Best for applications where the chat widget should match the app's design system
   - Requires the app's dependencies and context providers

2. **Standalone Widget** (`StandaloneChatWidget.tsx`)
   - Self-contained widget with its own theme system
   - Can be embedded in any website without dependencies
   - Includes all necessary React components bundled
   - Best for widget distribution and third-party integrations

### Switching Between Widget Types

#### Method 1: Using NPM Scripts (Recommended)

```bash
# Switch to integrated widget
npm run widget:integrated

# Switch to standalone widget
npm run widget:standalone

# Show help and current widget type
npm run widget:help
```

#### Method 2: Using the Script Directly

```bash
# Switch to integrated widget
node scripts/set-chat-widget.js integrated

# Switch to standalone widget
node scripts/set-chat-widget.js standalone

# Show help
node scripts/set-chat-widget.js --help
```

#### Method 3: Manual Environment Variable

Add or update the following in your `.env.local` file:

```env
# For integrated widget
NEXT_PUBLIC_CHAT_WIDGET_TYPE=integrated

# For standalone widget (default)
NEXT_PUBLIC_CHAT_WIDGET_TYPE=standalone
```

### Development Workflow

1. **Choose your widget type** based on your needs:
   - Use `integrated` for in-app chat functionality
   - Use `standalone` for embeddable widget development

2. **Switch the widget type**:
   ```bash
   npm run widget:integrated  # or widget:standalone
   ```

3. **Restart your development server**:
   ```bash
   npm run dev
   ```

4. **Test the widget** in your application

### Widget Features Comparison

| Feature | Integrated Widget | Standalone Widget |
|---------|------------------|-------------------|
| Theme Integration | ✅ Uses app theme | ✅ Built-in theme system |
| Dependencies | ❌ Requires app context | ✅ Self-contained |
| Embeddability | ❌ App-specific | ✅ Any website |
| Bundle Size | ✅ Smaller (shared deps) | ❌ Larger (bundled deps) |
| Customization | ✅ Full app integration | ⚠️ Limited to widget scope |

### Building the Standalone Widget

The standalone widget can be built as a distributable JavaScript file:

```bash
npm run build:widget
```

This creates a `chat-widget.js` file in the `dist/` directory that can be embedded in any website.

### Environment Variables

```env
# Chat Widget Configuration
NEXT_PUBLIC_CHAT_WIDGET_TYPE=standalone  # or "integrated"

# Other environment variables...
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3003
BACKEND_URL=http://localhost:3003
# ... etc
```

### Troubleshooting

1. **Changes not taking effect**: Make sure to restart your development server after changing the widget type.

2. **Widget not switching**: Check that the environment variable is correctly set in `.env.local`.

3. **Build errors**: Ensure all dependencies are installed and the widget files exist in their expected locations.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables in `.env.local`

3. Choose your widget type:
   ```bash
   npm run widget:standalone  # or widget:integrated
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3078](http://localhost:3078) in your browser

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the application
- `npm run build:widget` - Build the standalone widget
- `npm run widget:integrated` - Switch to integrated widget
- `npm run widget:standalone` - Switch to standalone widget
- `npm run widget:help` - Show widget configuration help 