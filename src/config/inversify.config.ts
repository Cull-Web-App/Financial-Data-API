import 'reflect-metadata';
import { Container } from 'inversify';

import {
    IConfigurationService,
    IQuoteService,
    ISubscriptionService
} from '../interfaces';
import {
    ConfigurationService,
    QuoteService,
    SubscriptionService,
    MockQuoteService
} from '../services';
import { SERVICE_IDENTIFIERS } from '../constants';

// Create the DI Container
const container: Container = new Container();

// Bind the data to the interfaces for injection -- use singletons for the services since they don't need multiple instances
container.bind<IConfigurationService>(SERVICE_IDENTIFIERS.ICONFIGURATION_SERVICE).to(ConfigurationService).inSingletonScope()
container.bind<IQuoteService>(SERVICE_IDENTIFIERS.IQUOTE_SERVICE).to(QuoteService).inSingletonScope();
container.bind<ISubscriptionService>(SERVICE_IDENTIFIERS.ISUBCRIPTION_SERVICE).to(SubscriptionService).inSingletonScope();

// Export the DI Container
export default container;