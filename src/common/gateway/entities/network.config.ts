
export class NetworkConfig {
  constructor(init?: Partial<NetworkConfig>) {
    Object.assign(this, init);
  }

  erd_adaptivity: boolean = false;
  erd_chain_id: string = '';
  erd_denomination: number = 0;
  erd_gas_per_data_byte: number = 0;
  erd_gas_price_modifier: string = '0';
  erd_hysteresis: string = '0';
  erd_latest_tag_software_version: string = '0';
  erd_max_gas_per_transaction: number = 0;
  erd_meta_consensus_group_size: number = 0;
  erd_min_gas_limit: number = 0;
  erd_min_gas_price: number = 0;
  erd_min_transaction_version: number = 0;
  erd_num_metachain_nodes: number = 0;
  erd_num_nodes_in_shard: number = 0;
  erd_num_shards_without_meta: number = 0;
  erd_rewards_top_up_gradient_point: string = '0';
  erd_round_duration: number = 0;
  erd_rounds_per_epoch: number = 0;
  erd_shard_consensus_group_size: number = 0;
  erd_start_time: number = 0;
  erd_top_up_factor: string = '0';
}
