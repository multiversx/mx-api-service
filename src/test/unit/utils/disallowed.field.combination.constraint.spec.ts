import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { DisallowedFieldCombination } from '../../../utils/disallowed.field.combination.constraint';

@DisallowedFieldCombination()
class TestDto {
  // Fields used by the constraint
  address?: string;
  sender?: string;
  receiver?: string;
  relayer?: string;

  static getFieldsSubstitutions() {
    return {
      address: ['sender', 'receiver', 'relayer'],
    } as Record<string, string[]>;
  }
}

@DisallowedFieldCombination()
class NoMappingDto {
  // Intentionally no getFieldsSubstitutions()
  foo?: string;
}

describe('DisallowedFieldCombinationConstraint', () => {
  it('is valid when only main field is provided', () => {
    const dto = new TestDto();
    dto.address = 'erd1...';

    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
  });

  it('is valid when only conflicting fields are provided (no main field)', () => {
    const dto = new TestDto();
    dto.sender = 'erd1...';

    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
  });

  it('is invalid when main field and one conflicting field are provided', () => {
    const dto = new TestDto();
    dto.address = 'erd1...';
    dto.sender = 'erd1...';

    const errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    const constraintMsg = errors[0].constraints?.['disallowedFieldCombination'];
    expect(constraintMsg).toBeDefined();
    expect(constraintMsg).toContain("You cannot provide 'address' simultaneously with: sender");
  });

  it('is invalid and reports all conflicting fields that are present', () => {
    const dto = new TestDto();
    dto.address = 'erd1...';
    dto.sender = 'erd1...';
    dto.receiver = 'erd1...';

    const errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    const constraintMsg = errors[0].constraints?.['disallowedFieldCombination'] as string;
    expect(constraintMsg).toBeDefined();
    expect(constraintMsg).toContain("You cannot provide 'address' simultaneously with:");
    expect(constraintMsg).toContain('sender');
    expect(constraintMsg).toContain('receiver');
  });

  it('is valid when class does not expose mapping function', () => {
    const dto = new NoMappingDto();
    dto.foo = 'bar';

    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
  });
});
