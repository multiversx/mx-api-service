import { Resolver } from "@nestjs/graphql";
import { Round } from "src/endpoints/rounds/entities/round";
import { RoundService } from "src/endpoints/rounds/round.service";
import { RoundQuery } from "./rounds.query";

@Resolver(() => Round)
export class RoundResolver extends RoundQuery {
  constructor(roundService: RoundService) {
    super(roundService);
  }
}
