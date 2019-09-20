import { Handler, APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';

export const getTickers: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log('The current ticker is: '+ event.queryStringParameters);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Worked'
        })
    };
}