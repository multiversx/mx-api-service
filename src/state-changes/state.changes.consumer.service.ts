import { CompetingRabbitConsumer } from "src/common/rabbitmq/rabbitmq.consumers";
import { StateChanges } from "./entities";
import { decodeStateChangesRaw, getFinalStates } from "./utils/state-changes.utils";
// import { ApiConfigService } from "src/common/api-config/api.config.service";

export class StateChangesConsumerService {
    constructor(
        // private readonly apiConfigService: ApiConfigService,
    ) { }
    @CompetingRabbitConsumer({
        exchange: 'state_accesses',
        queueName: 'state-changes-test',
        deadLetterExchange: 'state-changes-test_dlx',
    })
    async consumeEvents(stateChanges: any) {
        // console.dir(stateChanges, { depth: null })
        const decodedStateChanges = this.decodeStateChanges(stateChanges)
        if (Object.keys(decodedStateChanges).length === 0) {
            return;
        }
        const finalStates = getFinalStates(decodedStateChanges);
        console.dir(finalStates, { depth: null })
    }

    decodeStateChanges(stateChanges: StateChanges) {
        return decodeStateChangesRaw(stateChanges);
    }
}