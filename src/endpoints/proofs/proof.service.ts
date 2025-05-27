import { Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { ProofFilter } from "./entities/proof.filter";
import { ProofDto } from "./entities/proof.dto";

@Injectable()
export class ProofService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
    private readonly cacheService: CacheService,
  ) {
  }

  async getProof(identifierOrHash: string): Promise<ProofDto | undefined> {
    const isIdentifier = identifierOrHash.split('-').length > 2;
    const proofs = await this.getProofs(new QueryPagination({from: 0, size: 10000}));

    if (isIdentifier) {
      return proofs.find(proof => proof.identifier === identifierOrHash);
    } else {
      return proofs.find(proof => proof.hash === identifierOrHash);
    }
  }

  async getProofsCount(filter: ProofFilter): Promise<number> {
    const proofs = await this.getProofsWithFilters(filter);
    return proofs.length;
  }

  async getProofs(
    queryPagination: QueryPagination,
    filter?: ProofFilter,
  ): Promise<ProofDto[]> {
    if (!this.apiConfigService.isProofsFeatureEnabled()) {
      return [];
    }

    const {from, size} = queryPagination;
    const proofs = await this.getProofsWithFilters(filter);
    return proofs.slice(from, from + size);
  }

  async getProofsWithFilters(
    filter?: ProofFilter,
  ): Promise<ProofDto[]> {
    const proofs = await this.cacheService.getOrSet(
      CacheInfo.Proofs.key,
      async () => await this.getAllProofsRaw(),
      CacheInfo.Proofs.ttl,
    );

    return this.applyFilters(proofs, filter);
  }

  async getAllProofsRaw(): Promise<ProofDto[]> {
    // TODO: add a cron job that calls this and make it work for more than 10k proofs
    const { data } = await this.apiService.get(`${this.apiConfigService.getProofsServiceUrl()}/proofs?size=10000`);
    console.log('rawProofs', data);
    console.log(JSON.stringify(data, null, 2));
    return data;
  }

  private applyFilters(proofs: ProofDto[], filters: ProofFilter | undefined): ProofDto[] {
    if (!filters) {
      return proofs;
    }

    return proofs.filter((proof) => {
      return (
        (!filters.hash || proof.hash === filters.hash)
      );
    });
  }
}
