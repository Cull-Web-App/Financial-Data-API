import { Lambda, DynamoDB, ApiGatewayManagementApi } from "aws-sdk";

export interface IAWSConfigurationService
{
    lambda: Lambda;
    documentClient: DynamoDB.DocumentClient;
    apigwManagementApi: ApiGatewayManagementApi;
}
