import { Handler, APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import * as req from 'request-promise';
import { reject } from 'bluebird';
import { candleStickData } from './models';

let apiKey = process.env.API_KEY;

export const candlestickData: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
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

        try{
            let resp = await req.get(options);
            var returnData;
            console.log(interval);
            if (interval == "1mm" || interval == "5dm"){
                returnData = resp.map(data => <candleStickData>({date: data.date,time:data.minute, openPrice: data.open, closePrice: data.close}));
            }
            else{
                returnData = resp.map(data => <candleStickData>({date: data.date, openPrice: data.open, closePrice: data.close}));
            }
                    

            return {
                statusCode: 200,
                body: JSON.stringify(returnData)
            };
        }
        catch(e){
            return {
                statusCode: 400,
                body:e
            };
        }
        
    }
    return {
        statusCode: 400,
        body: JSON.stringify({
            message: 'Ticker was not provided or was invalid'
        })
    };    
    
}