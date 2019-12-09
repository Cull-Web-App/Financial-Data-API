import 'reflect-metadata';
import { Container, AsyncContainerModule, interfaces } from 'inversify';
import { DynamoDB } from 'aws-sdk';

import {
    IConfigurationService,
    IQuoteService,
    ISubscriptionService
} from '../interfaces';
import {
    ConfigurationService,
    QuoteService,
    SubscriptionService
} from '../services';
import { SERVICE_IDENTIFIERS } from '../constants';
import { Configuration } from '../models';

// Bind the data to the interfaces for injection -- use singletons for the services since they don't need multiple instances
const asynContainerModule: AsyncContainerModule = new AsyncContainerModule(async (bind: interfaces.Bind) => {
    const configServiceInstance: IConfigurationService = new ConfigurationService();
    bind<IConfigurationService>(SERVICE_IDENTIFIERS.ICONFIGURATION_SERVICE).toConstantValue(configServiceInstance);

    bind<IQuoteService>(SERVICE_IDENTIFIERS.IQUOTE_SERVICE).to(QuoteService).inSingletonScope();
    bind<ISubscriptionService>(SERVICE_IDENTIFIERS.ISUBCRIPTION_SERVICE).to(SubscriptionService).inSingletonScope();

    // Does this work??
    bind<DynamoDB.DocumentClient>(SERVICE_IDENTIFIERS.IDYNAMODB_DOCUMENTCLIENT).to(DynamoDB.DocumentClient).inSingletonScope();

    // Set the configuration constant to the resolution of the promise -- does this work??
    bind<Configuration>(SERVICE_IDENTIFIERS.CONFIGURATION).toConstantValue(await configServiceInstance.getConfiguration());
});

// Create the DI Container and export -- will this work with the async??
export const container: Container = new Container();
(async () => {
    await container.loadAsync(asynContainerModule);
})();
