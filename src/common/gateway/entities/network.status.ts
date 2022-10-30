export class NetworkStatus {
  constructor(init?: Partial<NetworkStatus>) {
    Object.assign(this, init);
  }

  erd_cross_check_block_height: string = '';
  erd_current_round: number = 0;
  erd_epoch_number: number = 0;
  erd_highest_final_nonce: number = 0;
  erd_nonce: number = 0;
  erd_nonce_at_epoch_start: number = 0;
  erd_nonces_passed_in_current_epoch: number = 0;
  erd_round_at_epoch_start: number = 0;
  erd_rounds_passed_in_current_epoch: number = 0;
  erd_rounds_per_epoch: number = 0;
}
