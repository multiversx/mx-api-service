import { CollectionTraitAttribute } from "./collection.trait.attribute";

export class CollectionTrait {
  name: string = '';
  occurrenceCount: number = 0;
  occurrencePercenta: number = 0;
  attributes: CollectionTraitAttribute[] = [];
}
