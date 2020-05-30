import { DynamoDB, ApiGatewayManagementApi } from 'aws-sdk';
import { injectable, inject } from 'inversify';
import { TABLES, SERVICE_IDENTIFIERS } from '../constants';
import { Subscription } from '../models';
import { ISubscriptionService, IAWSConfigurationService } from '../interfaces';

@injectable()
export class SubscriptionService implements ISubscriptionService
{
    public constructor(
        @inject(SERVICE_IDENTIFIERS.IAWS_CONFIGURATION_SERVICE) private readonly awsConfigurationService: IAWSConfigurationService)
    {
    }

    /**
     * Get all the info for every client (connection id) as a map of connection id to sub info
     */
    public async getAllClientConnectionInfo(): Promise<Map<string, Subscription>>
    {
        const response: DynamoDB.ScanOutput = await this.awsConfigurationService.documentClient.scan({
            TableName: `${TABLES.CONNECTIONS}-${process.env.NODE_ENV}`
        }).promise();

        return new Map<string, Subscription>((response.Items as DynamoDB.ItemList).map((itemMap: DynamoDB.AttributeMap) => {
            return [itemMap.key.S as string, {
                interval: itemMap.interval.S,
                symbols: itemMap.symbols.SS
            } as Subscription];
        }));
    }

    /**
     * Get the symbols the user subscribes to using the connection id
     * @param connectionId user's connection id
     */
    public async getSubscribedSymbols(connectionId: string): Promise<Array<string>>
    {
        const response: DynamoDB.GetItemOutput = await this.awsConfigurationService.documentClient.get({
            TableName: `${TABLES.CONNECTIONS}-${process.env.NODE_ENV}`,
            Key: {
                connectionId
            }
        }).promise();
    
        // Map the dynamo output to the array type
        return (response.Item as DynamoDB.AttributeMap)['symbols'].SS as Array<string>;
    }

    /**
     * Subscribe to a set of symbols to receive WS updates
     * @param connectionId user's connection id
     * @param symbolsToSub list of symbols to subscibe to
     * @param interval interval to subscribe at
     */
    public async createSubscriptions(connectionId: string, symbolsToSub: Array<string>, interval: string): Promise<Array<string>>
    {
        const createdSubscriptions: DynamoDB.UpdateItemOutput = await this.awsConfigurationService.documentClient.update({
            TableName: `${TABLES.CONNECTIONS}-${process.env.NODE_ENV}`,
            Key: {
                connectionId
            },
            UpdateExpression: 'SET #symbols = list_append(if_not_exists(#symbols, :empty_list), :new_symbols), #interval = :interval',
            ExpressionAttributeNames: {
                '#symbols': 'symbols',
                '#interval': 'interval'
            },
            ExpressionAttributeValues: {
                ':new_symbols': symbolsToSub,
                ':empty_list': [],
                ':interval': interval
            }
        }).promise();
    
        return (createdSubscriptions.Attributes as DynamoDB.AttributeMap)['symbols'].SS as Array<string>;
    }

    /**
     * Delete a set of symbols from the clients subsciption list. The client will no longer receive updates for these
     * subscriptions
     * @param connectionId user's connection id
     * @param symbolsToUnsub list of subscriptions to unsub from
     */
    public async deleteSubscriptions(connectionId: string, symbolsToUnsub: Array<string>): Promise<Array<string>>
    {
        // First get the subscriptions, then remove the list from the symbols
        const subscribedSymbols: Array<string> = await this.getSubscribedSymbols(connectionId);

        // Filter out all the symbols from the symbols list that are being unsubbed -- update afterwards
        const newSymbols: Array<string> = subscribedSymbols.filter((symbol: string) => {
            return !symbolsToUnsub.includes(symbol);
        });

        if (newSymbols.length === 0)
        {
            // There are no longer any symbols being subbed by this client -- delete it from the table
            await this.deleteAllSubscriptions(connectionId);
            return [];
        }
        else
        {
            const newSubscriptions: DynamoDB.UpdateItemOutput = await this.awsConfigurationService.documentClient.update({
                TableName: `${TABLES.CONNECTIONS}-${process.env.NODE_ENV}`,
                Key: {
                    connectionId
                },
                UpdateExpression: 'SET #symbols = :newSymbols',
                ExpressionAttributeNames: {
                    '#symbols': 'symbols'
                },
                ExpressionAttributeValues: {
                    ':new_symbols': newSymbols
                }
            }).promise();

            return (newSubscriptions.Attributes as DynamoDB.AttributeMap)['symbols'].SS as Array<string>;
        }
    }

    /**
     * Delete the connection Id from the table -- used on deletion requests and when subscriptions are zeroed out
     * @param connectionId user's connection id
    */
    public async deleteAllSubscriptions(connectionId: string): Promise<boolean>
    {
        try
        {
            await this.awsConfigurationService.documentClient.delete({
                TableName: `${TABLES.CONNECTIONS}-${process.env.NODE_ENV}`,
                Key: {
                    connectionId
                }
            }).promise();
            return true;
        }
        catch (error)
        {
            console.error(error.toString());
            return false;
        }
    }

    /**
     * Send a message to the client using the WS api gateway
     * @param connectionId user's connection id
     * @param message message to send on the socket
     */
    public async sendMessageToClient(connectionId: string, message: string): Promise<void>
    {
        const apiGatewayManagementAPI: ApiGatewayManagementApi = await this.awsConfigurationService.getAPIGatewayManagementAPI();
        await apiGatewayManagementAPI.postToConnection({
            ConnectionId: connectionId,
            Data: message
        }).promise();
    }
}
