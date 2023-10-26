export interface ScDeploy {
  address: string;
  contract: string;
  deployTxHash: string;
  initialCodeHash: string;
  deployer: string;
  timestamp: number;
  upgrades: ScDeployUpgrade[];
}

export interface ScDeployUpgrade {
  upgrader: string;
  upgradeTxHash: string;
  codeHash: string;
  timestamp: number;
}
