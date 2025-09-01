// Example of the new flyer structure
// This file demonstrates how the flyer structure has changed from separate arrays to objects

// OLD STRUCTURE (before changes):
/*
{
  "flyers": [
    "uploads/exhibitor/flyers/fbc3c31e-df3f-48cf-91aa-ea1c4d72dae9.jpg",
    "uploads/exhibitor/flyers/220a3c97-27c5-4521-824e-ecac0ce58b5e.jpg"
  ],
  "flyerNames": [
    "Flayer 1 ",
    " Flayer 2"
  ]
}
*/

// NEW STRUCTURE (after changes):
/*
{
  "flyers": [
    {
      "name": "Flayer 1",
      "flyer": "uploads/exhibitor/flyers/fbc3c31e-df3f-48cf-91aa-ea1c4d72dae9.jpg"
    },
    {
      "name": "Flayer 2", 
      "flyer": "uploads/exhibitor/flyers/220a3c97-27c5-4521-824e-ecac0ce58b5e.jpg"
    }
  ]
}
*/

// TypeScript interface for the new flyer structure
export interface Flyer {
  name: string;
  flyer: string;
}

// Example usage in DTO
export interface ExhibitorWithFlyers {
  id: string;
  companyName: string;
  flyers?: Flyer[];
  // ... other fields
}

// Example of how to work with the new structure
export const exampleExhibitor: ExhibitorWithFlyers = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  companyName: "Example Company",
  flyers: [
    {
      name: "Product Catalog 2024",
      flyer: "uploads/exhibitor/flyers/catalog-2024.jpg"
    },
    {
      name: "Company Brochure",
      flyer: "uploads/exhibitor/flyers/brochure.pdf"
    }
  ]
};

// Helper function to get flyer names
export const getFlyerNames = (flyers: Flyer[]): string[] => {
  return flyers.map(flyer => flyer.name);
};

// Helper function to get flyer paths
export const getFlyerPaths = (flyers: Flyer[]): string[] => {
  return flyers.map(flyer => flyer.flyer);
};

// Helper function to find flyer by name
export const findFlyerByName = (flyers: Flyer[], name: string): Flyer | undefined => {
  return flyers.find(flyer => flyer.name === name);
};

// Helper function to find flyer by path
export const findFlyerByPath = (flyers: Flyer[], path: string): Flyer | undefined => {
  return flyers.find(flyer => flyer.flyer === path);
};
