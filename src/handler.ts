import { Handler, APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import axios, {AxiosResponse, AxiosRequestConfig, AxiosPromise} from 'axios';
import { candleStickData } from './models';

const apiKey = process.env.API_KEY;

export const candlestickData: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => 
{
    if (event.queryStringParameters) 
    {        
        const {ticker, interval} = event.queryStringParameters;
        const config: AxiosRequestConfig = {
            baseURL: 'https://cloud.iexapis.com/v1/stock/',
            url: ticker + '/chart/' + (interval || '1m'),
            method: 'get',
            params: {
                token: apiKey
            },
            responseType: 'json'
        };

        try
        {
            const resp = await axios(config);
            const returnData = resp.data.map(data => <candleStickData>({date: data.date,time:data.minute, openPrice: data.open, closePrice: data.close}));
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Headers": '*',
                    "Access-Control-Allow-Origin": '*'
                },
                body: JSON.stringify(returnData)
            };
        }
        catch(e)
        {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Headers": '*',
                    "Access-Control-Allow-Origin": '*'
                },
                body: e
            };
        }
        
    }
    return {
        statusCode: 400,
        headers: {
            "Access-Control-Allow-Headers": '*',
            "Access-Control-Allow-Origin": '*'
        },
        body: JSON.stringify({
            message: 'Ticker was not provided or was invalid'
        })
    };    
    
}