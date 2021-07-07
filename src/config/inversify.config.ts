import 'reflect-metadata';
import { Container, AsyncContainerModule, interfaces } from 'inversify';

import {
    IAppConfigurationService,
    IAWSConfigurationService,
    IQuoteService,
    ISubscriptionService,
    IIEXService,
    ISymbolsService
} from '../interfaces';
import {
    AppConfigurationService,
    AWSConfigurationService,
    QuoteService,
    SubscriptionService,
    IEXService,
    SymbolsService
} from '../services';
import { SERVICE_IDENTIFIERS } from '../constants';

// Bind the data to the interfaces for injection -- use singletons for the services since they don't need multiple instances
const asyncContainerModule: AsyncContainerModule = new AsyncContainerModule(async (bind: interfaces.Bind) => {
    bind<IAppConfigurationService>(SERVICE_IDENTIFIERS.IAPP_CONFIGURATION_SERVICE).to(AppConfigurationService).inSingletonScope();
    bind<IAWSConfigurationService>(SERVICE_IDENTIFIERS.IAWS_CONFIGURATION_SERVICE).to(AWSConfigurationService).inSingletonScope();
    bind<IQuoteService>(SERVICE_IDENTIFIERS.IQUOTE_SERVICE).to(QuoteService).inSingletonScope();
    bind<ISubscriptionService>(SERVICE_IDENTIFIERS.ISUBCRIPTION_SERVICE).to(SubscriptionService).inSingletonScope();
    bind<IIEXService>(SERVICE_IDENTIFIERS.IIEX_SERVICE).to(IEXService).inSingletonScope();
    bind<ISymbolsService>(SERVICE_IDENTIFIERS.ISYMBOLS_SERVICE).to(SymbolsService).inSingletonScope()
});

// Create the DI Container and export -- runs async for perf and possible async injection purposes
export const container: Container = new Container();
(async () => {
    await container.loadAsync(asyncContainerModule);
})();
