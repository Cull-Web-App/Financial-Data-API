import { Handler, APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { configureConnections } from './config';
import { HTTP_STATUS_CODES, WS_CONNECTION_TYPES } from './constants';
import { Quote } from './models';
import Services from './services';

// Configure the connections for the app to the AWS items during init
configureConnections();

// Extract the services -- need this because of the mock service thing
const { QuoteService, SubscriptionService } = Services;

export const getStockQuotesAtInterval: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    // If nothing is passed -- client error
    if (!event.queryStringParameters) {
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
        // Convert tthe start and end dates into date objects -- requires that they are passed correctly in string format
        const sDate = new Date(startDate);
        const eDate = new Date(endDate);
        const diffDays: number = eDate.diff(sDate, 'days') + 1;   

        const perDay: number = setInterval(interval);

        const returnArr: Array<Quote> = [generateInitialData(sDate)];

        for (const i = 1; i < diffDays * (28800 / perDay); i++)
        {
            if (moment(returnArr[returnArr.length - 1].dateTime).hour() == 17)
            {
                returnArr.push(generateNextQuote(returnArr[returnArr.length - 1], 57600));
            }
            else
            {
                returnArr.push(generateNextQuote(returnArr[returnArr.length - 1], perDay));
            }
        }

        return {
            statusCode: HTTP_STATUS_CODES.SUCCESS,
            body: JSON.stringify({
                quotes: returnArr
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

/*
    This endpoint handles connect/disconnect requests from the user to a collection of symbols
    Each user can subscribe to many symbols at once
*/
export const quoteSubscriptionConnectionHandler: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    // Use the subscription service to add or remove this connection Id to the table of connection IDs for this symbol and interval
    // Not sure if this response works with WS
    if (!event.body) {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'No query parameters were passed'
            })
        };
    }

    const { connectionId, routeKey } = event.requestContext;
    const { symbols, interval } = JSON.parse(event.body);

    if (!symbols || !interval || !connectionId || !routeKey) {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'Required request query params are missing'
            })
        };
    }

    // Create or delete the subscription according to the route key
    if (routeKey === WS_CONNECTION_TYPES.CONNECT) {
        // Use the subscription service to add this user to this channel
        await SubscriptionService.createSubscriptions(connectionId, symbols, interval);
    } else if (routeKey === WS_CONNECTION_TYPES.DISCONNECT) {
        await SubscriptionService.deleteSubscriptions(connectionId, symbols, interval);
    }

    // Status code 200 tells API Gateway that this connection was successful
    return {
        statusCode: HTTP_STATUS_CODES.SUCCESS,
        body: JSON.stringify({
            message: 'Successful subscriptions update'
        })
    };
};

/*
    Update the quote for every asset in the dynamodb table and publish the update message to all the ws subscribers
*/
export const updateQuotesForAllAssetsAndPublishMessages: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {

};

/*
    Update all the quotes for all the assets
*/
export const updateQuotesForAllAssets: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'No query parameters were passed'
            })
        };
    }

    const { symbols } = JSON.parse(event.body);
    if (!symbols) {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'Required request query params are missing'
            })
        };
    }

    return {
        statusCode: HTTP_STATUS_CODES.SUCCESS,
        body: JSON.stringify({
            quotes: await QuoteService.batchUpdateQuotesForAssets(symbols)
        })
    };
};

/*
    Update the quote for a single asset
*/
export const updateQuoteForAsset: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'No query parameters were passed'
            })
        };
    }

    const { symbol } = JSON.parse(event.body);
    if (!symbol) {
        return {
            statusCode: HTTP_STATUS_CODES.CLIENT_ERROR,
            body: JSON.stringify({
                message: 'Required request query params are missing'
            })
        };
    }

    // Create the latest quote for this symbol -- use the quote service
    return {
        statusCode: HTTP_STATUS_CODES.SUCCESS,
        body: JSON.stringify({
            quote: await QuoteService.updateQuoteForAsset(symbol)
        })
    };
};
