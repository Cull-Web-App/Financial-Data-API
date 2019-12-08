import { config, DynamoDB } from 'aws-sdk';

config.update({
    region: 'Region'
});

export let documentClient: DynamoDB.DocumentClient;

export const configureConnections = (): void => {
    documentClient = new DynamoDB.DocumentClient();
};
