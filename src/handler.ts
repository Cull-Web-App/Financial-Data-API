import { Handler, APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import * as req from 'request-promise';
import { reject } from 'bluebird';

let apiKey = process.env.API_KEY;

export const getTickers: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    if (event.queryStringParameters) {        
        const ticker: string = event.queryStringParameters.ticker;
        var interval: string;
        if (event.queryStringParameters.interval) {
            interval = event.queryStringParameters.interval;
        }
        else{
            interval = "1m";
        }
        let options = {
            uri: 'https://cloud.iexapis.com/v1/stock/' + ticker + '/chart/' + interval,
            qs: {
                token: apiKey
            },
            json: true
        };

        let resp = await req.get(options);
        return {
            statusCode: 200,
            body: JSON.stringify(resp)
        };
    }
    return {
        statusCode: 400,
        body: JSON.stringify({
            message: 'Ticker was not provided or was invalid'
        })
    };    
    
}