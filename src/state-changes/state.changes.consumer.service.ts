import { CompetingRabbitConsumer } from "src/common/rabbitmq/rabbitmq.consumers";
import { StateChanges } from "./entities";
import { decodeStateChangesRaw, getFinalStates } from "./utils/state-changes.utils";
import { AccountDetails, AccountDetailsRepository } from "src/common/indexer/db";
import { Injectable } from "@nestjs/common";
import { TokenWithBalance } from "src/endpoints/tokens/entities/token.with.balance";
// import { ApiConfigService } from "src/common/api-config/api.config.service";

@Injectable()
export class StateChangesConsumerService {
    constructor(
        // private readonly apiConfigService: ApiConfigService,
        private readonly accountDetailsRepository: AccountDetailsRepository,
    ) { }

    @CompetingRabbitConsumer({
        exchange: 'state_accesses',
        queueName: 'state-changes-test',
        deadLetterExchange: 'state-changes-test_dlx',
    })
    async consumeEvents(stateChanges: any) {
        try {
            // console.dir(stateChanges, { depth: null })
            const decodedStateChanges = this.decodeStateChanges(stateChanges)
            if (Object.keys(decodedStateChanges).length === 0) {
                return;
            }

            const finalStates = getFinalStates(decodedStateChanges);
            const transformedStates = this.transformFinalStatesToDbFormat(finalStates);
            await this.accountDetailsRepository.updateAccounts(transformedStates);

        } catch (error) {
            console.error(`Error consuming state changes:`, error);
            throw error;
        }
    }

    private decodeStateChanges(stateChanges: StateChanges) {
        return decodeStateChangesRaw(stateChanges);
    }

    private transformFinalStatesToDbFormat(finalStates: Record<string, StateChanges>) {
        const transformed: AccountDetails[] = [];
        for (const [_key, value] of Object.entries(finalStates)) {
            const newAccountState = value.accountState;
            const tokens = [...value.esdtState.Fungible]; // TODO: add other token types

            if (newAccountState) {
                transformed.push(new AccountDetails({
                    ...newAccountState,
                    tokens: tokens.map(t => new TokenWithBalance({
                        identifier: t.identifier,
                        nonce: parseInt(t.nonce),
                        balance: t.value,
                    })),
                }));
            }

        }
        // console.dir(transformed, { depth: null })
        return transformed;
    }
}