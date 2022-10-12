import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { applyDecorators } from '@nestjs/common';

/** Competing Consumer which will be handled by only one instance of the microservice.
 * Make sure the exchange exists.
 */
export const CompetingRabbitConsumer = (config: {
  queueName: string;
  exchange: string;
  deadLetterExchange?: string;
}) => {
  return applyDecorators(
    RabbitSubscribe({
      queue: config.queueName,
      exchange: config.exchange,
      routingKey: '',
      queueOptions: {
        autoDelete: false,
        durable: true,
        arguments: {
          'x-queue-type': 'classic',
          'x-queue-mode': 'lazy',
          'x-single-active-consumer': true,
        },
        deadLetterExchange: config.deadLetterExchange,
      },
    }),
  );
};
