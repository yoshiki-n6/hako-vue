// Color palette for random avatar colors
export const AVATAR_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA502', // Orange
  '#9B59B6', // Purple
  '#1ABC9C', // Turquoise
  '#E74C3C', // Dark Red
  '#3498DB', // Sky Blue
  '#2ECC71', // Green
  '#F39C12', // Amber
  '#E67E22', // Dark Orange
  '#C0392B', // Maroon
  '#16A085', // Dark Teal
  '#2980B9', // Dark Blue
  '#8E44AD', // Dark Purple
  '#D35400', // Pumpkin
];

// Generate random color for a user
export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// Generate deterministic color from userId (same user always gets same color)
export function getAvatarColorFromUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Generate avatar SVG with box character and color
export function generateDefaultAvatarSVG(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <!-- Background circle -->
    <circle cx="100" cy="100" r="100" fill="${color}"/>
    
    <!-- Box body -->
    <rect x="60" y="85" width="80" height="75" rx="8" fill="#D4A574" stroke="#8B6F47" stroke-width="2"/>
    
    <!-- Box flap -->
    <path d="M 60 85 Q 100 65 140 85" fill="#C9945F" stroke="#8B6F47" stroke-width="2"/>
    
    <!-- Box details - horizontal lines -->
    <line x1="65" y1="95" x2="135" y2="95" stroke="#8B6F47" stroke-width="1" opacity="0.5"/>
    <line x1="65" y1="110" x2="135" y2="110" stroke="#8B6F47" stroke-width="1" opacity="0.5"/>
    
    <!-- Left eye white -->
    <circle cx="80" cy="100" r="12" fill="white"/>
    <!-- Right eye white -->
    <circle cx="120" cy="100" r="12" fill="white"/>
    
    <!-- Left eye pupil -->
    <circle cx="83" cy="102" r="6" fill="#000"/>
    <!-- Right eye pupil -->
    <circle cx="123" cy="102" r="6" fill="#000"/>
    
    <!-- Left eye shine -->
    <circle cx="84" cy="100" r="2" fill="white"/>
    <!-- Right eye shine -->
    <circle cx="124" cy="100" r="2" fill="white"/>
    
    <!-- Smile -->
    <path d="M 85 120 Q 100 130 115 120" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// Generate data URL from SVG
export function generateDefaultAvatarDataURL(color: string): string {
  const svg = generateDefaultAvatarSVG(color);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}
