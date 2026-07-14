#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '../.env.local');
const WIDGET_TYPES = {
  'integrated': 'integrated',
  'standalone': 'standalone'
};

function updateEnvFile(widgetType) {
  try {
    let envContent = '';
    
    // Read the current file if it exists. Avoid a separate existence check so
    // another process cannot swap the file between check and read.
    try {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    
    // Update or add the NEXT_PUBLIC_CHAT_WIDGET_TYPE variable
    const lines = envContent.split('\n');
    let found = false;
    
    const updatedLines = lines.map(line => {
      if (line.startsWith('NEXT_PUBLIC_CHAT_WIDGET_TYPE=')) {
        found = true;
        return `NEXT_PUBLIC_CHAT_WIDGET_TYPE=${widgetType}`;
      }
      return line;
    });
    
    // If not found, add it
    if (!found) {
      updatedLines.push('');
      updatedLines.push('# Chat Widget Configuration');
      updatedLines.push('# Options: "integrated" (uses ChatWidget.tsx) or "standalone" (uses StandaloneChatWidget.tsx)');
      updatedLines.push(`NEXT_PUBLIC_CHAT_WIDGET_TYPE=${widgetType}`);
    }
    
    // Write atomically so readers never observe a partially-written env file.
    const temporaryFile = `${ENV_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryFile, updatedLines.join('\n'), { mode: 0o600 });
    fs.renameSync(temporaryFile, ENV_FILE);
    
    console.log(`✅ Chat widget type set to: ${widgetType}`);
    console.log(`📝 Updated ${ENV_FILE}`);
    console.log(`🔄 Please restart your development server for changes to take effect`);
    
  } catch (error) {
    console.error('❌ Error updating .env.local file:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
📱 Chat Widget Type Switcher

Usage: node scripts/set-chat-widget.js [widget-type]

Widget Types:
  integrated   - Uses ChatWidget.tsx (integrated with app theme/context)
  standalone   - Uses StandaloneChatWidget.tsx (self-contained widget)

Examples:
  node scripts/set-chat-widget.js integrated
  node scripts/set-chat-widget.js standalone

Current widget type: ${getCurrentWidgetType()}
`);
}

function getCurrentWidgetType() {
  try {
    try {
      const envContent = fs.readFileSync(ENV_FILE, 'utf8');
      const match = envContent.match(/NEXT_PUBLIC_CHAT_WIDGET_TYPE=(.+)/);
      return match ? match[1].trim() : 'standalone (default)';
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    return 'standalone (default)';
  } catch (error) {
    return 'unknown';
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showHelp();
  process.exit(0);
}

const widgetType = args[0].toLowerCase();

if (!WIDGET_TYPES[widgetType]) {
  console.error(`❌ Invalid widget type: ${widgetType}`);
  console.error(`✅ Valid options: ${Object.keys(WIDGET_TYPES).join(', ')}`);
  process.exit(1);
}

updateEnvFile(WIDGET_TYPES[widgetType]);
