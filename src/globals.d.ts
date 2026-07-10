declare module '*.css' {
    const content: {
        [className: string]: string;
    };
    export default content;
}

interface FacebookLoginResponse {
    authResponse?: {
        code?: string;
        accessToken?: string;
        userID?: string;
    } | null;
    status?: string;
}

interface FacebookSdk {
    init(options: { appId: string; autoLogAppEvents?: boolean; xfbml?: boolean; version: string }): void;
    login(
        callback: (response: FacebookLoginResponse) => void,
        options?: {
            config_id?: string;
            response_type?: string;
            override_default_response_type?: boolean;
            extras?: Record<string, unknown>;
        },
    ): void;
}

interface Window {
    dataLayer?: Record<string, unknown>[];
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
}
