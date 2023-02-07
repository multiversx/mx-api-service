import { NotifierEvent } from "src/common/rabbitmq/entities/notifier.event";

export class EventNotification {
    hash: string = '';
    events: NotifierEvent[] = [];
}
