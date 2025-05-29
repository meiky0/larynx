'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useEffect, useState } from 'react';
import React from 'react';

const config = (typeof window !== 'undefined' && (window as any).voiceWidgetConfig) || {};

async function requestMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    console.error('Microphone permission denied', error);
    return false;
  }
}

const redirectToAuth = async () => {
  try {
    console.log('Redirecting to authentication page...');
    window.location.href = 'https://rad-marshmallow-402fe2.netlify.app/';
    return { success: true, message: 'Redirecting to authentication page' };
  } catch (error) {
    console.error('Redirect failed:', error);
    return { success: false, message: 'Failed to redirect' };
  }
};



// DOM Control Tools Implementation
const createDOMControlTools = () => {
  // Utility function to find elements by various selectors
  const findElement = (selector: string, context: Document | Element = document): Element | null => {
    try {
      // Try CSS selector first
      let element = context.querySelector(selector);
      if (element) return element;

      // Try by text content (case insensitive)
      const textElements = context.querySelectorAll('*');
      for (const el of textElements) {
        if (el.textContent?.toLowerCase().includes(selector.toLowerCase()) && 
            el.children.length === 0) {
          return el;
        }
      }

      // Try by placeholder
      element = context.querySelector(`[placeholder*="${selector}" i]`);
      if (element) return element;

      // Try by aria-label
      element = context.querySelector(`[aria-label*="${selector}" i]`);
      if (element) return element;

      // Try by title
      element = context.querySelector(`[title*="${selector}" i]`);
      if (element) return element;

      return null;
    } catch (error) {
      console.error('Error finding element:', error);
      return null;
    }
  };

  // Utility to scroll element into view smoothly
  const scrollToElement = (element: Element) => {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center', 
      inline: 'center' 
    });
  };

  // Utility to highlight element temporarily
  const highlightElement = (element: Element, duration: number = 2000) => {
    const originalStyle = (element as HTMLElement).style.cssText;
    (element as HTMLElement).style.cssText += `
      outline: 3px solid #ff4444 !important;
      outline-offset: 2px !important;
      background-color: rgba(255, 68, 68, 0.1) !important;
      transition: all 0.3s ease !important;
    `;
    
    setTimeout(() => {
      (element as HTMLElement).style.cssText = originalStyle;
    }, duration);
  };

  return {
    // Navigate to a URL
    navigate_to_url: async (params: { url: string }) => {
      try {
        if (!params.url.startsWith('http://') && !params.url.startsWith('https://')) {
          params.url = 'https://' + params.url;
        }
        window.location.href = params.url;
        return { success: true, message: `Navigating to ${params.url}` };
      } catch (error) {
        return { success: false, error: `Failed to navigate: ${error}` };
      }
    },

    // Click on an element
    click_element: async (params: { selector: string, description?: string }) => {
      try {
        const element = findElement(params.selector);
        if (!element) {
          return { 
            success: false, 
            error: `Element not found: ${params.selector}. Try being more specific or use a different selector.` 
          };
        }

        // Scroll to element and highlight it
        scrollToElement(element);
        highlightElement(element);

        // Wait a moment for scroll and highlight
        await new Promise(resolve => setTimeout(resolve, 500));

        // Trigger click
        if (element instanceof HTMLElement) {
          element.click();
        } else {
          const event = new MouseEvent('click', { bubbles: true, cancelable: true });
          element.dispatchEvent(event);
        }

        return { 
          success: true, 
          message: `Clicked on element: ${params.description || params.selector}`,
          element_info: {
            tagName: element.tagName,
            text: element.textContent?.slice(0, 50),
            className: (element as HTMLElement).className
          }
        };
      } catch (error) {
        return { success: false, error: `Click failed: ${error}` };
      }
    },

    // Type text into an input field
    type_text: async (params: { selector: string, text: string, clear_first?: boolean }) => {
      try {
        const element = findElement(params.selector) as HTMLInputElement | HTMLTextAreaElement;
        if (!element) {
          return { success: false, error: `Input element not found: ${params.selector}` };
        }

        if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
          return { success: false, error: `Element is not an input field` };
        }

        // Scroll to element and highlight it
        scrollToElement(element);
        highlightElement(element);

        // Focus the element
        element.focus();

        // Clear existing text if requested
        if (params.clear_first) {
          element.value = '';
        }

        // Simulate typing
        element.value += params.text;
        
        // Trigger input events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        return { 
          success: true, 
          message: `Typed "${params.text}" into ${element.tagName.toLowerCase()}`,
          current_value: element.value
        };
      } catch (error) {
        return { success: false, error: `Type failed: ${error}` };
      }
    },

    // Fill out a form with multiple fields
    fill_form: async (params: { fields: Array<{ selector: string, value: string, type?: string }> }) => {
      try {
        const results = [];
        
        for (const field of params.fields) {
          const element = findElement(field.selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          if (!element) {
            results.push({ 
              selector: field.selector, 
              success: false, 
              error: 'Element not found' 
            });
            continue;
          }

          // Handle different input types
          if (element instanceof HTMLSelectElement) {
            // Handle select dropdown
            const option = Array.from(element.options).find(opt => 
              opt.text.toLowerCase().includes(field.value.toLowerCase()) ||
              opt.value.toLowerCase().includes(field.value.toLowerCase())
            );
            if (option) {
              element.value = option.value;
              element.dispatchEvent(new Event('change', { bubbles: true }));
              results.push({ selector: field.selector, success: true, value: option.text });
            } else {
              results.push({ selector: field.selector, success: false, error: 'Option not found' });
            }
          } else if (element instanceof HTMLInputElement) {
            if (element.type === 'checkbox' || element.type === 'radio') {
              // Handle checkbox/radio
              const shouldCheck = ['true', 'yes', '1', 'on', 'checked'].includes(field.value.toLowerCase());
              element.checked = shouldCheck;
              element.dispatchEvent(new Event('change', { bubbles: true }));
              results.push({ selector: field.selector, success: true, checked: shouldCheck });
            } else {
              // Handle text inputs
              element.value = field.value;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              results.push({ selector: field.selector, success: true, value: field.value });
            }
          } else if (element instanceof HTMLTextAreaElement) {
            element.value = field.value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            results.push({ selector: field.selector, success: true, value: field.value });
          }

          // Brief pause between fields
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        return { 
          success: true, 
          message: `Filled ${results.filter(r => r.success).length} out of ${results.length} fields`,
          results 
        };
      } catch (error) {
        return { success: false, error: `Form fill failed: ${error}` };
      }
    },

    // Get page information
    get_page_info: async () => {
      try {
        return {
          success: true,
          page_info: {
            title: document.title,
            url: window.location.href,
            domain: window.location.hostname,
            forms: document.forms.length,
            links: document.links.length,
            inputs: document.querySelectorAll('input, textarea, select').length,
            buttons: document.querySelectorAll('button, input[type="submit"], input[type="button"]').length
          }
        };
      } catch (error) {
        return { success: false, error: `Failed to get page info: ${error}` };
      }
    },

    // Find and describe elements on the page
    find_elements: async (params: { query: string, type?: string }) => {
      try {
        let elements: NodeListOf<Element>;
        
        if (params.type) {
          // Search by element type
          switch (params.type.toLowerCase()) {
            case 'button':
              elements = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
              break;
            case 'input':
              elements = document.querySelectorAll('input, textarea');
              break;
            case 'link':
              elements = document.querySelectorAll('a[href]');
              break;
            case 'form':
              elements = document.querySelectorAll('form');
              break;
            default:
              elements = document.querySelectorAll(params.type);
          }
        } else {
          // Search by text content
          elements = document.querySelectorAll('*');
        }

        const matches = Array.from(elements)
          .filter(el => {
            if (!params.query) return true;
            const text = el.textContent?.toLowerCase() || '';
            const placeholder = (el as HTMLInputElement).placeholder?.toLowerCase() || '';
            const title = el.getAttribute('title')?.toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            
            return text.includes(params.query.toLowerCase()) ||
                   placeholder.includes(params.query.toLowerCase()) ||
                   title.includes(params.query.toLowerCase()) ||
                   ariaLabel.includes(params.query.toLowerCase());
          })
          .slice(0, 10) // Limit results
          .map(el => ({
            tagName: el.tagName.toLowerCase(),
            text: el.textContent?.slice(0, 100) || '',
            className: (el as HTMLElement).className || '',
            id: (el as HTMLElement).id || '',
            type: (el as HTMLInputElement).type || '',
            placeholder: (el as HTMLInputElement).placeholder || '',
            href: (el as HTMLAnchorElement).href || ''
          }));

        return {
          success: true,
          message: `Found ${matches.length} matching elements`,
          elements: matches
        };
      } catch (error) {
        return { success: false, error: `Search failed: ${error}` };
      }
    },

    // Scroll the page
    scroll_page: async (params: { direction: 'up' | 'down' | 'top' | 'bottom', amount?: number }) => {
      try {
        const scrollAmount = params.amount || 500;
        
        switch (params.direction) {
          case 'up':
            window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
            break;
          case 'down':
            window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            break;
          case 'top':
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
          case 'bottom':
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            break;
        }

        return { 
          success: true, 
          message: `Scrolled ${params.direction}`,
          current_position: window.pageYOffset
        };
      } catch (error) {
        return { success: false, error: `Scroll failed: ${error}` };
      }
    },

    // Wait for an element to appear
    wait_for_element: async (params: { selector: string, timeout?: number }) => {
      try {
        const timeout = params.timeout || 5000;
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
          const element = findElement(params.selector);
          if (element) {
            highlightElement(element);
            return { 
              success: true, 
              message: `Element found: ${params.selector}`,
              waited_ms: Date.now() - startTime
            };
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return { 
          success: false, 
          error: `Element not found within ${timeout}ms: ${params.selector}` 
        };
      } catch (error) {
        return { success: false, error: `Wait failed: ${error}` };
      }
    },

    // Take a screenshot (simulate - browser limitation)
    take_screenshot: async () => {
      return {
        success: false,
        error: "Screenshot functionality requires screen sharing API which isn't available in this context. Consider using browser extensions or native apps for this feature."
      };
    },

    // Go back in browser history
    go_back: async () => {
      try {
        window.history.back();
        return { success: true, message: "Navigated back in browser history" };
      } catch (error) {
        return { success: false, error: `Navigation failed: ${error}` };
      }
    },

    // Go forward in browser history
    go_forward: async () => {
      try {
        window.history.forward();
        return { success: true, message: "Navigated forward in browser history" };
      } catch (error) {
        return { success: false, error: `Navigation failed: ${error}` };
      }
    },

    // Refresh the page
    refresh_page: async () => {
      try {
        window.location.reload();
        return { success: true, message: "Page refreshed" };
      } catch (error) {
        return { success: false, error: `Refresh failed: ${error}` };
      }
    }
  };
};

const WaveIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className="transition-all">
    <path
      d="M2 8C2 8 4 4 6 8C8 12 10 4 12 8C14 12 16 4 18 8C20 12 22 8 22 8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={isActive ? 'wave-active' : 'wave-inactive'}
    />
    <path
      d="M1 8C1 8 3 6 5 8C7 10 9 6 11 8C13 10 15 6 17 8C19 10 21 8 23 8"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.6"
      className={isActive ? 'wave-active-2' : 'wave-inactive-2'}
    />
  </svg>
);

export default function VoiceWidget() {
  const platform = config.platform || 'web';
  const get_battery_level = config.get_battery_level || (async () => 100);
  const change_brightness = config.change_brightness || (async () => {});
  const flash_screen = config.flash_screen || (async () => {});

  const [isConnecting, setIsConnecting] = useState(false);
  const [domControlEnabled, setDomControlEnabled] = useState(true);

  // Create DOM control tools
  const domTools = createDOMControlTools();

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected');
      setIsConnecting(false);
    },
    onDisconnect: () => {
      console.log('Disconnected');
      setIsConnecting(false);
    },
    onMessage: (message) => console.log('Message:', message),
    onError: (err) => {
      console.error('Error:', err);
      setIsConnecting(false);
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert('Microphone permission is required');
      setIsConnecting(false);
      return;
    }

    const clientTools = {
      get_battery_level,
      change_brightness,
      flash_screen,
      redirect_to_auth: redirectToAuth,
      ...(domControlEnabled ? domTools : {})
    };

    await conversation.startSession({
      agentId: 'agent_01jvg9443reddrc38gye4jhfvr',
      dynamicVariables: { 
        platform,
        dom_control_enabled: domControlEnabled
      },
      clientTools,
    });
  }, [conversation, platform, get_battery_level, change_brightness, flash_screen, domControlEnabled, domTools]);

  const stopConversation = useCallback(() => {
    conversation.endSession();
  }, [conversation]);

  const isActive = conversation.status === 'connected';

  const handleClick = () => {
    if (conversation.status === 'disconnected') {
      startConversation();
    } else {
      stopConversation();
    }
  };

  const statusText =
    isConnecting || conversation.status === 'connecting'
      ? 'CONNECTING...'
      : 'VOICE CHAT';

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse-button {
        0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
        70% { box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
      }
      .wave-active {
        animation: wave-animation 1.5s ease-in-out infinite;
        stroke: #1a1a1a !important;
      }
      .wave-active-2 {
        animation: wave-animation-2 1.8s ease-in-out infinite;
        stroke: #1a1a1a !important;
        opacity: 0.6 !important;
      }
      .wave-inactive {
        stroke: white;
      }
      .wave-inactive-2 {
        stroke: white;
        opacity: 0.6;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {/* DOM Control Toggle */}
      <div className="fixed top-4 right-4 z-[9999] bg-black/80 rounded-lg p-2">
        <label className="flex items-center gap-2 text-white text-sm">
          <input
            type="checkbox"
            checked={domControlEnabled}
            onChange={(e) => setDomControlEnabled(e.target.checked)}
            className="rounded"
          />
          DOM Control
        </label>
      </div>

      {/* Voice Widget Button */}
      <button
        onClick={handleClick}
        id="voice-widget"
        className={`fixed bottom-6 right-6 z-[10000] min-w-[280px] p-3 pr-6 rounded-full flex items-center gap-4 shadow-md border transition-all cursor-pointer
          ${isActive ? 'bg-red-500 border-red-300 shadow-red-300 text-white' : 'bg-white border-gray-200'}
        `}
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all
            ${isActive ? 'bg-white animate-pulse' : 'bg-black'}
          `}
        >
          <WaveIcon isActive={isActive} />
        </div>
        <span className={`text-sm font-bold uppercase ${isActive ? 'text-white' : 'text-black'}`}>
          {statusText}
        </span>
        <div className="flex items-center gap-2 bg-black/5 px-2 py-1 rounded-md">
          <span role="img" aria-label="flag">🇺🇸</span>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1L6 6L11 1" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
    </>
  );
}