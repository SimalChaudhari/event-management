// Document Array Transformer - Reusable transformer for document structures
export const documentArrayTransformer = {
  to: (value: any): string => {
    if (!value) return '';
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return JSON.stringify(value);
  },
  from: (value: string): any => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Check if it's the new format (array of objects) or old format (array of strings)
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].name && parsed[0].document) {
          return parsed; // New format: array of objects
        } else {
          // Old format: array of strings, convert to new format
          return parsed.map((item: string, index: number) => ({
            name: `Document ${index + 1}`,
            document: item
          }));
        }
      }
      return parsed;
    } catch (error) {
      // If parsing fails, try to split as comma-separated string (fallback)
      if (typeof value === 'string' && value.includes(',')) {
        return value.split(',').map((item: string, index: number) => ({
          name: `Document ${index + 1}`,
          document: item.trim()
        }));
      }
      return [];
    }
  }
};

// File Array Transformer - For flyers, event images, etc.
export const fileArrayTransformer = {
  to: (value: any): string => {
    if (!value) return '';
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return JSON.stringify(value);
  },
  from: (value: string): any => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Check if it's the new format (array of objects) or old format (array of strings)
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].name && parsed[0].flyer) {
          return parsed; // New format: array of objects
        } else {
          // Old format: array of strings, convert to new format
          return parsed.map((item: string, index: number) => ({
            name: `Item ${index + 1}`,
            flyer: item
          }));
        }
      }
      return parsed;
    } catch (error) {
      // If parsing fails, try to split as comma-separated string (fallback)
      if (typeof value === 'string' && value.includes(',')) {
        return value.split(',').map((item: string, index: number) => ({
          name: `Item ${index + 1}`,
          flyer: item.trim()
        }));
      }
      return [];
    }
  }
};

// Event Image Array Transformer
export const eventImageArrayTransformer = {
  to: (value: any): string => {
    if (!value) return '';
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return JSON.stringify(value);
  },
  from: (value: string): any => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Check if it's the new format (array of objects) or old format (array of strings)
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].name && parsed[0].eventImage) {
          return parsed; // New format: array of objects
        } else {
          // Old format: array of strings, convert to new format
          return parsed.map((item: string, index: number) => ({
            name: `Event Image ${index + 1}`,
            eventImage: item
          }));
        }
      }
      return parsed;
    } catch (error) {
      // If parsing fails, try to split as comma-separated string (fallback)
      if (typeof value === 'string' && value.includes(',')) {
        return value.split(',').map((item: string, index: number) => ({
          name: `Event Image ${index + 1}`,
          eventImage: item.trim()
        }));
      }
      return [];
    }
  }
};

// Booth Banner Transformer - for booth banner array with IDs (images, videos, links)
export const boothBannerTransformer = {
  to: (value: any): string => {
    if (!value) return '';
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return JSON.stringify(value);
  },
  from: (value: string): any => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Check if it's new format (array of objects with id) or old format (array of strings)
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].id && parsed[0].value) {
          return parsed; // New format: array of objects with id
        } else if (typeof parsed[0] === 'string') {
          // Old format: array of strings, convert to new format with IDs
          const { v4: uuidv4 } = require('uuid');
          return parsed.map((item: string) => ({
            id: uuidv4(),
            value: item
          }));
        }
        return parsed;
      }
      return [];
    } catch (error) {
      // If parsing fails, try to split as comma-separated string (backward compatibility)
      if (typeof value === 'string' && value.includes(',')) {
        const { v4: uuidv4 } = require('uuid');
        return value.split(',').map((item: string) => ({
          id: uuidv4(),
          value: item.trim()
        })).filter(item => item.value);
      }
      return [];
    }
  }
};