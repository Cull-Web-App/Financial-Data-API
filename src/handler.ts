import { Handler, APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import moment from 'moment';
import { rawData } from './models';
import { setStartVals, setInterval, generateNext } from './utils';

const apiKey = process.env.API_KEY;

export const candlestickData: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => 
{
    if (event.queryStringParameters) 
    {        
        const {symbol, startDate, stopDate, interval} = event.queryStringParameters;
        const sDate = moment(startDate).set({hour:9,minute:0,second:0});
        const eDate = moment(stopDate).set({hour:17,minute:0,second:0});
        const diffDays: number = eDate.diff(sDate,'days') + 1;        

        const perDay: number = setInterval(interval);

        var returnArr: rawData[] = [setStartVals(sDate)];

        for (var i = 1; i < diffDays * (28800/perDay); i++)
        {
            if (moment(returnArr[returnArr.length-1].dateTime).hour() == 17)
            {
                returnArr.push(generateNext(returnArr[returnArr.length-1], 57600));
            }
            else
            {
                returnArr.push(generateNext(returnArr[returnArr.length-1],perDay));
            }
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers": '*',
                "Access-Control-Allow-Origin": '*'
            },
            body: JSON.stringify(returnArr)
        };

    }
    else
    {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers": '*',
                "Access-Control-Allow-Origin": '*'
            },
            body: 'Unable to Complete Request'
        }
    }    
}