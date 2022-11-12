export class NetworkEconomics {
  constructor(init?: Partial<NetworkEconomics>) {
    Object.assign(this, init);
  }

  erd_dev_rewards: string = '';
  erd_epoch_for_economics_data: number = 0;
  erd_inflation: string = '0';
  erd_total_base_staked_value: string = '0';
  erd_total_fees: string = '0';
  erd_total_supply: string = '0';
  erd_total_top_up_value: string = '0';
}
