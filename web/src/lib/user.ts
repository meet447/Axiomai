export const getUserId = (): string => {
    if (typeof window === 'undefined') return 'server-side';
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            userId = crypto.randomUUID();
        } else {
            // Fallback for older browsers or non-secure contexts
            userId = 'user-' + Math.random().toString(36).substring(2, 15);
        }
        localStorage.setItem('user_id', userId);
    }
    return userId;
};
