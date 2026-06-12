export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getMessagePreview(type: string, content: string): string {
  switch (type) {
    case 'image':
      return '🖼️ Image';
    case 'video':
      return '🎥 Video';
    case 'voice':
      return '🎤 Voice message';
    case 'file':
      return '📎 File';
    default:
      return content.substring(0, 100);
  }
}

export function isAudioMimeType(mime: string): boolean {
  return ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/x-m4a'].includes(mime);
}

export function isImageMimeType(mime: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime);
}

export function isVideoMimeType(mime: string): boolean {
  return ['video/mp4', 'video/webm'].includes(mime);
}
