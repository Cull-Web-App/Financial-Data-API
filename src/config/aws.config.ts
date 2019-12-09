import { config, DynamoDB } from 'aws-sdk';

config.update({
    region: 'Region'
});

export const documentClient: DynamoDB.DocumentClient = new DynamoDB.DocumentClient();
