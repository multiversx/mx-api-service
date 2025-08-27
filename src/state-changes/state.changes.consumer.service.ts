import { CompetingRabbitConsumer } from "src/common/rabbitmq/rabbitmq.consumers";
import { StateChanges } from "./entities";
// import { ApiConfigService } from "src/common/api-config/api.config.service";

export class StateChangesConsumerService {
    constructor(
        // private readonly apiConfigService: ApiConfigService,
    ) {
        console.log('StateChangesConsumerService initialized');
    }
    @CompetingRabbitConsumer({
        exchange: 'state_accesses',
        queueName: 'state-changes-test',
        deadLetterExchange: 'state-changes-test_dlx',
    })
    async consumeEvents(stateChanges: StateChanges) {

        console.log(stateChanges);
    }
}