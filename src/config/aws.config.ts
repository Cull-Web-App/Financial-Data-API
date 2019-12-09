import { config, DynamoDB } from 'aws-sdk';

config.update({
    region: 'us-east-2'
});

export const documentClient: DynamoDB.DocumentClient = new DynamoDB.DocumentClient();
