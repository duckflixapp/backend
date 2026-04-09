export const limiterConfigs = {
    defaultConfig: {
        duration: 60000,
        max: 50,
        responseMessage: 'Rate limit exceeded',
    },

    // authenticatedKey: (ctx: any) => {
    //     if (ctx.user?.id) return ctx.user.id;
    //     return ctx.ip || (ctx.headers['x-forwarded-for'] as string) || 'unknown';
    // },
};
