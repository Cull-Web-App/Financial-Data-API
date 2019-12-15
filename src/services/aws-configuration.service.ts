import { Lambda, DynamoDB, ApiGatewayManagementApi, config } from 'aws-sdk';
import { injectable } from 'inversify';
import getDecorators from 'inversify-inject-decorators';
import { SERVICE_IDENTIFIERS } from '../constants';
import { IAWSConfigurationService, IAppConfigurationService } from '../interfaces';
import { container } from '../config';

// Use lazy injection to avoid the circular dependency
const { lazyInject } = getDecorators(container, true);

config.update({
    region: 'us-east-2'
});

@injectable()
export class AWSConfigurationService implements IAWSConfigurationService
{
    // Use the bang to allow null initialization -- use lazy loading for the circular dependency
    @lazyInject(SERVICE_IDENTIFIERS.IAPP_CONFIGURATION_SERVICE) public appConfigurationService!: IAppConfigurationService;

    public constructor()
    {
        // Have to init this async
        this.appConfigurationService.getConfiguration().then(config => {
            this.apigwManagementApi = new ApiGatewayManagementApi({
                endpoint: config.FINANCIAL_DATA_API
            });
        });
    }

    // Public aws services -- used as singleton for lambda context
    public lambda: Lambda = new Lambda();
    public documentClient: DynamoDB.DocumentClient = new DynamoDB.DocumentClient();
    public apigwManagementApi!: ApiGatewayManagementApi;
}
