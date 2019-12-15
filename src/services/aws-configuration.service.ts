import { Lambda, DynamoDB, ApiGatewayManagementApi, config } from 'aws-sdk';
import { injectable } from 'inversify';
import getDecorators from 'inversify-inject-decorators';
import { SERVICE_IDENTIFIERS } from '../constants';
import { IAWSConfigurationService, IAppConfigurationService } from '../interfaces';
import { container } from '../config';
import { Configuration } from '../models';

// Use lazy injection to avoid the circular dependency
const { lazyInject } = getDecorators(container, true);

config.update({
    region: 'us-east-2'
});

@injectable()
export class AWSConfigurationService implements IAWSConfigurationService
{
    private apigwManagementApi!: ApiGatewayManagementApi;

    // Use the bang to allow null initialization -- use lazy loading for the circular dependency
    @lazyInject(SERVICE_IDENTIFIERS.IAPP_CONFIGURATION_SERVICE) public appConfigurationService!: IAppConfigurationService;

    // Public aws services -- used as singleton for lambda context
    public lambda: Lambda = new Lambda();
    public documentClient: DynamoDB.DocumentClient = new DynamoDB.DocumentClient();

    public async getAPIGatewayManagementAPI(): Promise<ApiGatewayManagementApi>
    {
        if (!this.apigwManagementApi)
        {
            const configuration: Configuration = await this.appConfigurationService.getConfiguration();
            this.apigwManagementApi = new ApiGatewayManagementApi({
                endpoint: configuration.FINANCIAL_DATA_API
            });
        }
        return this.apigwManagementApi;
    }
}
