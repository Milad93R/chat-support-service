# Chat Widget

A standalone chat widget that can be embedded in any website with real-time messaging capabilities.

## Quick Start

The simplest way to add the chat widget to your website:

```html
<!-- Add this to your HTML -->
<div id="chat-widget-container" 
     data-api-base-url="http://localhost:3003"
     data-socket-url="http://localhost:3003"></div>
<script src="path/to/chat-widget.js"></script>
```

## Configuration

### Important: API and Socket URLs

The widget requires two endpoints to function properly:

- **API Base URL**: The base URL for your chat API endpoints (e.g., `http://localhost:3003`)
- **Socket URL**: The URL for your WebSocket server (e.g., `http://localhost:3003`)

**Note**: If you encounter "error fetching data" or connection issues, make sure these URLs are correctly configured and accessible from the host website.

### Configuration Methods

#### Method 1: Data Attributes (Recommended)

Configure the widget using HTML data attributes:

```html
<div id="chat-widget-container" 
     data-api-base-url="https://your-api-server.com"
     data-socket-url="https://your-socket-server.com"></div>
<script src="path/to/chat-widget.js"></script>
```

#### Method 2: Programmatic Initialization

Configure the widget programmatically:

```html
<div id="my-chat-widget"></div>
<script src="path/to/chat-widget.js"></script>
<script>
  window.initChatWidget({
    apiBaseUrl: 'https://your-api-server.com',
    socketUrl: 'https://your-socket-server.com',
    containerId: 'my-chat-widget'
  });
</script>
```

## Build Instructions

1. Install dependencies:
```bash
npm install
```

2. Build the widget:
```bash
npm run build:widget
```

3. The built files will be in the `dist/` directory:
   - `chat-widget.js` - The main widget bundle
   - `demo.html` - Demo page showing usage examples

## Usage Examples

### React Application

```javascript
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Load the widget script
    const script = document.createElement('script');
    script.src = '/path/to/chat-widget.js';
    script.onload = () => {
      window.initChatWidget({
        apiBaseUrl: 'https://your-api-server.com',
        socketUrl: 'https://your-socket-server.com'
      });
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div>
      <h1>My App</h1>
      <div id="chat-widget-container"></div>
    </div>
  );
}
```

### WordPress/PHP

```php
<?php
// Add to your theme's footer.php or functions.php
function add_chat_widget() {
    echo '<div id="chat-widget-container" 
              data-api-base-url="https://your-api-server.com"
              data-socket-url="https://your-socket-server.com"></div>';
    echo '<script src="' . get_template_directory_uri() . '/js/chat-widget.js"></script>';
}
add_action('wp_footer', 'add_chat_widget');
?>
```

### Static HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to my website</h1>
    
    <!-- Chat widget will appear here -->
    <div id="chat-widget-container"
         data-api-base-url="https://your-api-server.com"
         data-socket-url="https://your-socket-server.com"></div>
    <script src="./chat-widget.js"></script>
</body>
</html>
```

## Features

- **Real-time Messaging**: WebSocket-powered instant messaging with automatic reconnection
- **Persistent Sessions**: Chat history and user data saved in localStorage
- **Unread Notifications**: Badge notifications for new messages when widget is closed
- **Theme Support**: Built-in dark/light theme switching
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Zero Dependencies**: Self-contained bundle with React included
- **Easy Integration**: Simple script tag integration with any website

## API Requirements

The widget expects the following API endpoints to be available:

### Chat Rooms API
- `POST /chat-rooms` - Create a new chat room
- `GET /chat-rooms/{roomId}` - Get room details and messages
- `GET /chat-rooms/client/{clientEmail}?recent=true` - Get recent room for client

### WebSocket Events
The widget connects to `/chat` namespace and handles:
- `join-room` - Join a chat room
- `send-message` - Send a message
- `new-message` - Receive new messages
- `room-status-changed` - Handle room status changes

## Troubleshooting

### "Error fetching data" Issue

This error typically occurs when:

1. **Incorrect API URLs**: The `apiBaseUrl` is not correctly configured
2. **CORS Issues**: The API server doesn't allow requests from the host domain
3. **Network Issues**: The API server is not accessible from the client

**Solutions**:
1. Verify your API and socket URLs are correct
2. Ensure your API server has proper CORS configuration
3. Check that the API server is running and accessible
4. Test the API endpoints directly in your browser

### Connection Issues

If the widget shows "Connecting..." or connection errors:

1. Check that the WebSocket server is running
2. Verify the `socketUrl` configuration
3. Ensure WebSocket connections are not blocked by firewalls
4. Check browser console for detailed error messages

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Development

For development, the default configuration points to:
- API Base URL: `http://localhost:3003`
- Socket URL: `http://localhost:3003`

Make sure your development servers are running on these ports, or update the configuration accordingly.

## License

This project is licensed under the MIT License. 