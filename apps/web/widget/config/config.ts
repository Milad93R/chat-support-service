import { WidgetConfig } from '../types';

// Default configuration - can be overridden when initializing the widget
const DEFAULT_CONFIG: WidgetConfig = {
  apiBaseUrl: 'http://localhost:3003',
  socketUrl: 'http://localhost:3003'
};

// Global config that can be set when initializing the widget
let widgetConfig: WidgetConfig = DEFAULT_CONFIG;

// Function to update widget configuration
export function setWidgetConfig(config: Partial<WidgetConfig>) {
  widgetConfig = { ...widgetConfig, ...config };
}

// Function to get current widget configuration
export function getWidgetConfig(): WidgetConfig {
  return widgetConfig;
} 