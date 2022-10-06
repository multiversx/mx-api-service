import { CollectionTraitSummaryAttribute } from "./collection.trait.summary.attribute";

export class CollectionTraitSummary {
  name: string = '';
  occurrenceCount: number = 0;
  occurrencePercentage: number = 0;
  attributes: CollectionTraitSummaryAttribute[] = [];
}
