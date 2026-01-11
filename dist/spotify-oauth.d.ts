export type SpotifyOAuthCredentials = {
    access: string;
    refresh: string;
    expires: number;
    email?: string;
    displayName?: string;
};
export declare function isRemoteEnvironment(): boolean;
export declare function shouldUseManualOAuthFlow(): boolean;
export declare function loginSpotifyVpsAware(clientId: string, clientSecret: string, onUrl: (url: string) => void | Promise<void>, onProgress?: (message: string) => void): Promise<SpotifyOAuthCredentials | null>;
export declare function loginSpotifyLocal(clientId: string, clientSecret: string, onUrl: (url: string) => void | Promise<void>, onProgress?: (message: string) => void): Promise<SpotifyOAuthCredentials | null>;
export declare function loginSpotifyManual(clientId: string, clientSecret: string, onUrl: (url: string) => void | Promise<void>, onProgress?: (message: string) => void): Promise<SpotifyOAuthCredentials | null>;
//# sourceMappingURL=spotify-oauth.d.ts.map