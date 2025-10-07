import { CountryUserData } from '../types';

// Coordinates are based on a 1008x653 SVG viewBox for an equirectangular projection map.
// This provides a mapping from country names to pixel locations on the map graphic.
export const countryCoordinates: Record<string, { x: number; y: number }> = {
    'USA': { x: 255, y: 195 },
    'Brazil': { x: 355, y: 350 },
    'Germany': { x: 525, y: 165 },
    'India': { x: 705, y: 240 },
    'Japan': { x: 845, y: 198 },
    'Canada': { x: 250, y: 150 },
    'United Kingdom': { x: 495, y: 160 },
    'France': { x: 505, y: 175 },
    'Australia': { x: 840, y: 390 },
    'Mexico': { x: 235, y: 240 },
    'Nigeria': { x: 518, y: 280 },
    'Russia': { x: 750, y: 140 },
    'South Korea': { x: 825, y: 200 },
    'Argentina': { x: 330, y: 420 },
    'Italy': { x: 535, y: 185 },
    'Spain': { x: 490, y: 190 },
    'South Africa': { x: 560, y: 400 },
    'Indonesia': { x: 780, y: 320 },
    'Turkey': { x: 590, y: 190 },
    'Netherlands': { x: 510, y: 160 }
};

export interface TooltipData {
  x: number;
  y: number;
  country: CountryUserData;
}
