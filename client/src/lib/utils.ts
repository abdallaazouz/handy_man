import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function playNotification(type: 'success' | 'error' | 'info' = 'info') {
  try {
    let frequency = 800;
    if (type === 'success') frequency = 1000;
    if (type === 'error') frequency = 400;
    
    const audio = new Audio(`data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBzuLrOcA`);
    audio.volume = type === 'error' ? 0.2 : 0.1;
    audio.play().catch(() => {});
  } catch (e) {
    // Silent fail if audio doesn't work
  }
}
