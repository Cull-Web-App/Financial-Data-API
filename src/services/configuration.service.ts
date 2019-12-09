import { Lambda } from 'aws-sdk';
import { injectable } from 'inversify';
import { Configuration } from '../models';
import { IConfigurationService } from '../interfaces';

const lambda: Lambda = new Lambda();

@injectable()
export class ConfigurationService implements IConfigurationService
{
    public async getConfiguration(): Promise<Configuration>
    {
        const response: Lambda.InvocationResponse = await lambda.invoke({
            FunctionName: 'configuration-api-' + process.env.NODE_ENV + '-getConfigForEnv',
            Payload: JSON.stringify({
                queryStringParameters: {
                    env: process.env.NODE_ENV
                }
            })
        }).promise();
    
        // Map the configuration to the type -- not sure about this
        return JSON.parse(response.Payload as string) as Configuration;
    }
}
