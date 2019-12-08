import { Lambda } from 'aws-sdk';
import { Configuration } from '../models';

const lambda: Lambda = new Lambda();

export const getConfiguration = async (): Promise<Configuration> => {
    const response: Lambda.InvocationResponse = await lambda.invoke({
        FunctionName: 'CullConfiguration',
        InvocationType: 'Event'
    }).promise();

    // Map the configuration to the type -- not sure about this
    return JSON.parse(response.Payload as string) as Configuration;
};
