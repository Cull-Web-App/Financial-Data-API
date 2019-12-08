import * as quoteService from './quote.service';
import * as mockQuoteService from './mock-quote.service';
import * as subscriptionService from './subscription.service';
import * as configurationService from './configuration.service';
import CONFIG from '../config';

const services: any = {
    QuoteService: quoteService,
    SubscriptionService: subscriptionService,
    ConfigurationService: configurationService
};

const mockServices: any = {
    ...services,
    QuoteService: mockQuoteService
};

// Export the selected service
export default CONFIG.USE_MOCK_SERVICE ? mockServices : services;