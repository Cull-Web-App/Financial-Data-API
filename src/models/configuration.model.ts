export interface Configuration {
    [environmentName: string]: {
        DATA_SOURCE_URL: string,
        API_KEY: string,
        USE_MOCK_SERVICE: boolean
    }
}
