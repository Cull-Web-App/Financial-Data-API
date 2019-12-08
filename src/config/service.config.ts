// Set the exported config based on the current env here
const configs: any = {
    LOCAL: {
        DATA_SOURCE_URL: 'https://cloud.iexapis.com/v1/stock/',
        API_KEY: process.env.API_KEY,
        USE_MOCK_SERVICE: true
    },
    DEV: {
        DATA_SOURCE_URL: 'https://cloud.iexapis.com/v1/stock/',
        API_KEY: process.env.API_KEY,
        USE_MOCK_SERVICE: true
    },
    TEST: {
        DATA_SOURCE_URL: 'https://cloud.iexapis.com/v1/stock/',
        API_KEY: process.env.API_KEY,
        USE_MOCK_SERVICE: true
    },
    PROD: {
        DATA_SOURCE_URL: 'https://cloud.iexapis.com/v1/stock/',
        API_KEY: process.env.API_KEY,
        USE_MOCK_SERVICE: true
    }
};

export default configs[process.env.NODE_ENV as string];
