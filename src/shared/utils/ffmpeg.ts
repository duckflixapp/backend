export const getMimeTypeFromFormat = (formatName: string): string => {
    if (formatName.includes('mp4')) return 'video/mp4';
    if (formatName.includes('matroska')) return 'video/x-matroska';
    if (formatName.includes('avi')) return 'video/x-msvideo';
    if (formatName.includes('webm')) return 'video/webm';
    return 'other'; // Fallback
};
