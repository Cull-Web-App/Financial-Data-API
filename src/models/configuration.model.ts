export interface Configuration
{
    FINANCIAL_DATA_API: string;
    DATA_SOURCE_URL: string;
    API_KEY: string;
    API_KEY_REQUIRED: boolean;
    AUTH_API: {
        REGION: string,
        USER_POOL_ID: string,
        APP_CLIENT_ID: string
    };
}
