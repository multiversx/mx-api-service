export interface ScDeploy {
  address: string;
  contract: string;
  deployTxHash: string;
  deployer: string;
  timestamp: number;
  upgrades: ScDeployUpgrade[];
}

export interface ScDeployUpgrade {
  upgrader: string;
  upgradeTxHash: string;
  timestamp: number;
}
