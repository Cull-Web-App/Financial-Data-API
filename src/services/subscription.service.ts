import { DynamoDB } from 'aws-sdk';
import { TABLES } from '../constants';
import { documentClient } from '../config';

export const getSubscriptions = async (connectionId: string): Promise<DynamoDB.GetItemOutput> => {
    return await documentClient.get({
        TableName: TABLES.CONNECTIONS,
        Key: {
            connectionId
        }
    }).promise();
};

export const createSubscriptions = async (connectionId: string, symbols: Array<string>, interval: string): Promise<DynamoDB.UpdateItemOutput> => {
    return await documentClient.update({
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
            ':new_symbols': symbols,
            ':empty_list': [],
            ':interval': interval
        }
    }).promise();
};

export const deleteSubscriptions = async (connectionId: string, symbols: Array<string>, interval: string): Promise<DynamoDB.UpdateItemOutput> => {
    // First get the subscriptions, then remove the list from the symbols
    const subscriptionInfo: DynamoDB.GetItemOutput = await getSubscriptions(connectionId);

    // Filter out all the symbols from the symbols list
    const newSymbols: Array<string> = ((subscriptionInfo.Item as DynamoDB.AttributeMap)['symbols'].L as Array<string>).filter((symbol: string) => {
        return !symbols.includes(symbol);
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
};