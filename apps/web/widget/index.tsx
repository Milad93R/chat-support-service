import React from 'react';
import { createRoot } from 'react-dom/client';
import StandaloneChatWidget, { setWidgetConfig } from './StandaloneChatWidget';
import './styles.css';

// Configuration interface
interface ChatWidgetConfig {
  apiBaseUrl?: string;
  socketUrl?: string;
  containerId?: string;
}

// Initialize the chat widget
function initChatWidget(config: ChatWidgetConfig = {}) {
  // Set widget configuration
  if (config.apiBaseUrl || config.socketUrl) {
    setWidgetConfig({
      apiBaseUrl: config.apiBaseUrl || 'http://localhost:3003',
      socketUrl: config.socketUrl || 'http://localhost:3003'
    });
  }

  // Find or create container
  const containerId = config.containerId || 'chat-widget-container';
  let container = document.getElementById(containerId);
  
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  // Create React root and render widget
  const root = createRoot(container);
  root.render(<StandaloneChatWidget />);
  
  return root;
}

// Auto-initialize if container exists
if (typeof window !== 'undefined') {
  // Make initChatWidget available globally
  (window as any).initChatWidget = initChatWidget;
  
  // Auto-initialize when DOM is ready
  function autoInit() {
    const container = document.getElementById('chat-widget-container');
    if (container) {
      // Check if the container has data attributes for configuration
      const apiBaseUrl = container.getAttribute('data-api-base-url');
      const socketUrl = container.getAttribute('data-socket-url');
      
      initChatWidget({
        apiBaseUrl: apiBaseUrl || undefined,
        socketUrl: socketUrl || undefined,
        containerId: 'chat-widget-container'
      });
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

export { initChatWidget };
export default StandaloneChatWidget; 