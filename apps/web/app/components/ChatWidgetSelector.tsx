'use client';

import { useMemo } from 'react';
import ChatWidget from './ChatWidget';
import StandaloneChatWidget from '../../widget/StandaloneChatWidget';

export default function ChatWidgetSelector() {
  const widgetType = process.env.NEXT_PUBLIC_CHAT_WIDGET_TYPE || 'standalone';
  
  const SelectedWidget = useMemo(() => {
    switch (widgetType) {
      case 'integrated':
        return ChatWidget;
      case 'standalone':
      default:
        return StandaloneChatWidget;
    }
  }, [widgetType]);

  // Log which widget is being used (for debugging)
  console.log(`Using ${widgetType} chat widget`);

  return <SelectedWidget />;
} 