// React Native polyfills for AWS SDK compatibility
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Crypto polyfill for React Native
if (typeof global.crypto === 'undefined') {
  // Create a minimal crypto implementation
  global.crypto = {
    getRandomValues: (array: any) => {
      const randomValues = new Uint8Array(array.length);
      for (let i = 0; i < array.length; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
      array.set(randomValues);
      return array;
    },
    randomUUID: () => {
      // Simple UUID v4 implementation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    subtle: {
      digest: async (algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer> => {
        // Simple hash implementation for basic needs
        const bytes = new Uint8Array(data);
        let hash = 0;
        for (let i = 0; i < bytes.length; i++) {
          hash = ((hash << 5) - hash + bytes[i]) & 0xffffffff;
        }
        const result = new ArrayBuffer(4);
        const view = new DataView(result);
        view.setUint32(0, hash);
        return result;
      }
    }
  };
}

// TextEncoder/TextDecoder polyfills
if (typeof global.TextEncoder === 'undefined') {
  try {
    const { TextEncoder, TextDecoder } = require('text-encoding');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  } catch (e) {
    // Fallback implementation
    global.TextEncoder = class TextEncoder {
      encode(input: string): Uint8Array {
        const utf8 = unescape(encodeURIComponent(input));
        const result = new Uint8Array(utf8.length);
        for (let i = 0; i < utf8.length; i++) {
          result[i] = utf8.charCodeAt(i);
        }
        return result;
      }
    };
    
    global.TextDecoder = class TextDecoder {
      decode(input: Uint8Array): string {
        let result = '';
        for (let i = 0; i < input.length; i++) {
          result += String.fromCharCode(input[i]);
        }
        return decodeURIComponent(escape(result));
      }
    };
  }
}

// Buffer polyfill
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

export { };

