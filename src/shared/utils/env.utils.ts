export const getEnvNumber = (key: string, fallbackValue: number): number => {
    const value = Number(process.env[key]);
    return isNaN(value) || value === 0 ? fallbackValue : value;
};
