import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, Handler } from 'aws-lambda';
import { container } from './config';
import { HTTP_STATUS_CODES, SERVICE_IDENTIFIERS, WS_CONNECTION_TYPES } from './constants';
import { IQuoteService, ISubscriptionService, ISymbolsService } from './interfaces';
import { Quote, Subscription } from './models';

/**
 * Get the stock quote for a specific time interval. For now, just the default interval is allowed
 */
export const getStockQuotesAtInterval: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    // If nothing is passed -- client error
    if (!event.queryStringParameters)
    {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'No query parameters were passed'
            })
        };
    }

    // Extract the query params and verify they were all passed correctly
    const { symbol, startDate, endDate, interval } = event.queryStringParameters;
    if (symbol && startDate && endDate && interval) 
    {
        // Convert the start and end dates into date objects -- requires that they are passed correctly in string format
        const sDate = new Date(startDate);
        const eDate = new Date(endDate);
        const quoteService: IQuoteService = container.get(SERVICE_IDENTIFIERS.IQUOTE_SERVICE);

        return {
            statusCode: HTTP_STATUS_CODES.SUCCESS,
            body: JSON.stringify({
                quotes: await quoteService.getQuotesAtInterval(symbol, sDate, eDate, interval)
            })
        };
    }
    else
    {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'Required request query params are missing'
            })
        };
    }
};

/**
    This endpoint handles connect/disconnect requests from the user to a collection of symbols
    Each user can subscribe to many symbols at once
*/
export const quoteSubscriptionConnectionHandler: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    // Use the subscription service to add or remove this connection Id to the table of connection IDs for this symbol and interval
    // Not sure if this response works with WS
    if (!event.body)
    {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'No query parameters were passed'
            })
        };
    }

    const { connectionId, routeKey } = event.requestContext;
    const { symbols, interval } = JSON.parse(event.body);

    if (!symbols || !interval || !connectionId || !routeKey)
    {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'Required request query params are missing'
            })
        };
    }

    const subscriptionService: ISubscriptionService = container.get(SERVICE_IDENTIFIERS.ISUBCRIPTION_SERVICE);

    // Create or delete the subscription according to the route key
    if (routeKey === WS_CONNECTION_TYPES.CONNECT)
    {
        // Use the subscription service to add this user to this channel
        await subscriptionService.createSubscriptions(connectionId, symbols, interval);
    }
    else if (routeKey === WS_CONNECTION_TYPES.DISCONNECT)
    {
        await subscriptionService.deleteSubscriptions(connectionId, symbols);
    }

    // Status code 200 tells API Gateway that this connection was successful
    return {
        statusCode: HTTP_STATUS_CODES.SUCCESS,
        body: JSON.stringify({
            message: 'Successful subscriptions update'
        })
    };
};

/**
    Update the quote for every asset in the DynamoDB table and publish the update message to all the ws subscribers
    This will be triggered by a timer in CloudWatch on a 1s basis. Will need to be updated later to handle different intervals
*/
export const updateQuotesForAllAssetsAndPublishMessages: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const subscriptionService: ISubscriptionService = container.get(SERVICE_IDENTIFIERS.ISUBCRIPTION_SERVICE);
    const quoteService: IQuoteService = container.get(SERVICE_IDENTIFIERS.IQUOTE_SERVICE);

    // Now call the service to get the updated quotes for every asset
    const updatedQuotes: Map<string, Quote> = await quoteService.batchUpdateQuotesForAssets();

    // Now get all the clients that are subscribed to updates
    const allConnectionInfo: Map<string, Subscription> = await subscriptionService.getAllClientConnectionInfo();

    // Go through all the subscribed clients and send them their information on the WS
    for (const connectionId of allConnectionInfo.keys())
    {
        await subscriptionService.sendMessageToClient(connectionId, JSON.stringify({
            quotes: new Map<string, Quote>((allConnectionInfo.get(connectionId) as Subscription).symbols.map(symbol => {
                return [symbol, updatedQuotes.get(symbol) as Quote];
            }))
        }));
    }

    // Send return status to API Gateway?
    return {
        statusCode: HTTP_STATUS_CODES.SUCCESS,
        body: JSON.stringify('Successfully updated all clients')
    };
};

/**
    Update all the quotes for all the assets
*/
export const updateQuotesForAllAssets: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const quoteService: IQuoteService = container.get(SERVICE_IDENTIFIERS.IQUOTE_SERVICE);
    return {
        statusCode: HTTP_STATUS_CODES.SUCCESS,
        body: JSON.stringify({
            quotes: Array.from((await quoteService.batchUpdateQuotesForAssets()).values())
        })
    };
};

/**
    Update the quote for a single asset
*/
export const updateQuoteForAsset: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    if (!event.body) 
    {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'No query parameters were passed'
            })
        };
    }

    const { symbol } = JSON.parse(event.body);
    if (!symbol)
    {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'Required request query params are missing'
            })
        };
    }

    const quoteService: IQuoteService = container.get(SERVICE_IDENTIFIERS.IQUOTE_SERVICE);
    // Create the latest quote for this symbol -- use the quote service
    return {
        statusCode: HTTP_STATUS_CODES.SUCCESS,
        body: JSON.stringify({
            quote: await quoteService.updateQuoteForAsset(symbol)
        })
    };
};

/**
 * Update the symbols table with the latest symbols data from the data source
 * Should only be used for internal jobs, not consumed by other services
 */
export const updateSymbolsWithLatest: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {

    const symbolsService: ISymbolsService = container.get(SERVICE_IDENTIFIERS.ISYMBOLS_SERVICE);

    try
    {
        await symbolsService.updateSymbolsToLatest();
        // Create the latest quote for this symbol -- use the quote service
        return {
            statusCode: HTTP_STATUS_CODES.SUCCESS,
            body: JSON.stringify({})
        };
    }
    catch (err)
    {
        // Create the latest quote for this symbol -- use the quote service
        return {
            statusCode: HTTP_STATUS_CODES.SERVER_ERROR,
            body: JSON.stringify({})
        };
    }
};
