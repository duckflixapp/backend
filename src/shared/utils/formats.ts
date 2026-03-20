const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
export const formatBytes = (bytes: number, digits: number = 1) => {
    if (bytes === 0) return { value: 0, unit: 'Bytes', display: '0 Bytes' };

    const k = 1000;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(digits));
    const unit = sizes[i];

    return { value, unit, display: `${value} ${unit}` };
};
