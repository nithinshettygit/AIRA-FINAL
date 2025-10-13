// Average human reading speed is ~200 WPM. An average word is ~5 chars.
// 200 words/min * 5 chars/word = 1000 chars/min
// 1000 chars/min / 60 sec/min = ~16.7 chars/sec
// 1000ms / 16.7 chars/sec = ~60ms per character. Let's use 50ms for a slightly faster, more engaging pace.
export const READING_SPEED_MS_PER_CHAR: number = 50;

// Duration to show the media overlay in milliseconds
export const MEDIA_OVERLAY_DURATION_MS: number = 10000; // 10 seconds for images

// Media sequence timing
export const IMAGE_DISPLAY_DURATION_MS: number = 10000; // 10 seconds per image
export const VIDEO_DISPLAY_DURATION_MS: number = 30000; // 30 seconds for video