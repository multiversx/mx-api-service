import { ApiProperty } from "@nestjs/swagger";

export class ProofDto {
  @ApiProperty({ example: 'ABC-00aabb', description: 'The ID of the proof collection' })
  collectionId?: string;

  @ApiProperty({ example: 'ABC-00aabb-05', description: 'Unique identifier for the proof' })
  identifier?: string;

  @ApiProperty({ example: 'Proof of Authenticity', description: 'Name of the proof' })
  name?: string;

  @ApiProperty({ example: 123456, description: 'The proof numeric nonce value' })
  nonce?: number;

  @ApiProperty({
    example: { key1: 'value1', key2: 'value2' },
    description: 'Key-value properties of the proof',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  properties?: Record<string, string>;

  @ApiProperty({ example: ['art', 'digital'], description: 'Tags associated with the proof', isArray: true })
  tags?: string[];

  @ApiProperty({ example: ['https://example.com/resource'], description: 'URIs related to the proof', isArray: true })
  uris?: string[];

  @ApiProperty({ example: '0xabc123hash', description: 'Hash value of the proof content' })
  hash?: string;

  @ApiProperty({ example: 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th', description: 'Address of the creator' })
  creator?: string;

  constructor(init?: Partial<ProofDto>) {
    Object.assign(this, init);
  }
}
