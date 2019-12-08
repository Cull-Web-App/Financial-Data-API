import { DynamoDB } from 'aws-sdk';
import { injectable } from 'inversify';
import { TABLES } from '../constants';
import { documentClient } from '../config';
import { ISubscriptionService } from '../interfaces';

@injectable()
export class SubscriptionService implements ISubscriptionService {

    public async getSubscribedSymbols(connectionId: string): Promise<Array<string>> {
        const response: DynamoDB.GetItemOutput = await documentClient.get({
            TableName: TABLES.CONNECTIONS,
            Key: {
                connectionId
            }
        }).promise();
    
        // Map the dynamo output to the array type
        return (response.Item as DynamoDB.AttributeMap)['symbols'].L as Array<string>;
    }

    public async createSubscriptions(connectionId: string, symbolsToSub: Array<string>, interval: string): Promise<Array<string>> {
        const createdSubscriptions: DynamoDB.UpdateItemOutput = await documentClient.update({
            TableName: TABLES.CONNECTIONS,
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
    
        return (createdSubscriptions.Attributes as DynamoDB.AttributeMap)['symbols'].L as Array<string>;
    }

    public async deleteSubscriptions(connectionId: string, symbolsToUnsub: Array<string>): Promise<Array<string>> {
        // First get the subscriptions, then remove the list from the symbols
        const subscribedSymbols: Array<string> = await this.getSubscribedSymbols(connectionId);

        // Filter out all the symbols from the symbols list
        const newSymbols: Array<string> = subscribedSymbols.filter((symbol: string) => {
            return !symbolsToUnsub.includes(symbol);
        });

        if (newSymbols.length === 0)
        {
            return await documentClient.update({
                TableName: TABLES.CONNECTIONS,
                Key: {
                    connectionId
                }
            }).promise();
        }
        else
        {
            return await documentClient.update({
                TableName: TABLES.CONNECTIONS,
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
        }
    }
}
