import axios from 'axios';
import { config } from '../config/env.config';
import { fundAddress, sendTransaction, SendTransactionArgs } from './chain.simulator.operations';
import { ChainSimulatorUtils } from './test.utils';
import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import * as fs from 'fs';
import * as path from 'path';

async function testPpuCalculation() {
  try {
    console.log('Starting PPU calculation test...');

    // Wait for chain simulator to be ready
    console.log('Waiting for epoch 2...');
    await ChainSimulatorUtils.waitForEpoch(2);
    console.log('✓ Chain simulator reached epoch 2');

    // Fund test addresses
    const addresses = {
      shard0: config.aliceAddress,
      shard1: config.bobAddress,
    };

    // Fund all addresses
    for (const [shardName, address] of Object.entries(addresses)) {
      await fundAddress(config.chainSimulatorUrl, address);
      console.log(`✓ Funded address for ${shardName}: ${address}`);
    }

    // Deploy smart contract
    const pingPongAddress = await deployPingPongSmartContract(addresses.shard0);
    console.log(`✓ Deployed PingPong smart contract at address: ${pingPongAddress}`);

    // Start PPU monitoring in background
    const stopMonitoring = startContinuousPpuMonitoring();

    try {
      // Create transactions in batches to maintain continuous congestion
      await createContinuousCongestion(addresses, pingPongAddress);
    } finally {
      // Stop the monitoring when we're done
      stopMonitoring();
    }

    // Wait a bit for last transactions to be processed
    console.log('\nWaiting for final transactions to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Generate final report
    await getFinalPpuReport();

    console.log('\nPPU calculation test completed successfully!');
  } catch (error) {
    console.error('Error testing PPU calculation:', error);
    process.exit(1);
  }
}

/**
 * Deploy PingPong smart contract for testing contract interactions
 */
async function deployPingPongSmartContract(deployerAddress: string): Promise<string> {
  console.log('Deploying PingPong smart contract...');

  // Deploy the PingPong contract
  const scAddress = await ChainSimulatorUtils.deployPingPongSc(deployerAddress);

  // Wait a bit for deployment to be processed
  await new Promise(resolve => setTimeout(resolve, 3000));

  return scAddress;
}

interface PpuActivityReport {
  timestamp: string;
  shardId: number;
  lastBlock: number;
  fastPpu: number;
  fasterPpu: number;
  totalTransactions: number;
  mempoolAnalysis?: {
    calculatedFastPpu: number;
    calculatedFasterPpu: number;
    fastPpuDifference: number;
    fasterPpuDifference: number;
    transactionCount: number;
  };
}

function startContinuousPpuMonitoring() {
  let shouldContinue = true;

  const monitor = async () => {
    while (shouldContinue) {
      for (let shardId = 0; shardId <= 2; shardId++) {
        try {
          const response = await axios.get(`${config.apiServiceUrl}/transactions/ppu/${shardId}`);
          const ppuData = response.data;

          if (ppuData.Fast > 0 || ppuData.Faster > 0) {
            const timestamp = new Date().toISOString();
            console.log(`\nDetected PPU activity in shard ${shardId} at ${timestamp}:`);
            console.log(`- Last Block: ${ppuData.LastBlock}`);
            console.log(`- Fast PPU: ${ppuData.Fast}`);
            console.log(`- Faster PPU: ${ppuData.Faster}`);

            const activityReport: PpuActivityReport = {
              timestamp,
              shardId,
              lastBlock: ppuData.LastBlock,
              fastPpu: ppuData.Fast,
              fasterPpu: ppuData.Faster,
              totalTransactions: 0,
            };

            // Get mempool transactions for validation
            const poolResponse = await axios.get(`${config.apiServiceUrl}/pool?senderShard=${shardId}&size=10000`);
            const transactions = poolResponse.data;

            if (transactions.length > 0) {
              // Get network constants
              const networkResponse = await axios.get(`${config.apiServiceUrl}/constants`);
              const { minGasLimit, gasPerDataByte, gasPriceModifier } = networkResponse.data;

              // Calculate PPU for all transactions
              const ppuValues = transactions.map((tx: { data?: string; gasLimit: string; gasPrice: string }) => {
                const data = tx.data ? BinaryUtils.base64Decode(tx.data) : '';
                const gasLimit = Number(tx.gasLimit);
                const gasPrice = Number(tx.gasPrice);

                const dataCost = minGasLimit + data.length * gasPerDataByte;
                const executionCost = gasLimit - dataCost;
                const initiallyPaidFee = dataCost * gasPrice + executionCost * gasPrice * Number(gasPriceModifier);
                return Math.floor(initiallyPaidFee / gasLimit);
              });

              // Sort PPU values and calculate percentiles
              const sortedPpuValues = [...ppuValues].sort((a, b) => b - a);
              const fastIndex = Math.floor(transactions.length * 0.2); // 20th percentile
              const fasterIndex = Math.floor(transactions.length * 0.1); // 10th percentile

              console.log(`\nMempool Analysis for shard ${shardId}:`);
              console.log(`- Total transactions: ${transactions.length}`);
              console.log(`- Calculated Fast PPU (20th percentile): ${sortedPpuValues[fastIndex]}`);
              console.log(`- Calculated Faster PPU (10th percentile): ${sortedPpuValues[fasterIndex]}`);

              // Calculate and log the difference
              const fastDiff = ppuData.Fast > 0 ? Math.abs(ppuData.Fast - sortedPpuValues[fastIndex]) / ppuData.Fast : 0;
              const fasterDiff = ppuData.Faster > 0 ? Math.abs(ppuData.Faster - sortedPpuValues[fasterIndex]) / ppuData.Faster : 0;

              console.log(`- Fast PPU difference: ${(fastDiff * 100).toFixed(2)}%`);
              console.log(`- Faster PPU difference: ${(fasterDiff * 100).toFixed(2)}%`);

              activityReport.totalTransactions = transactions.length;
              activityReport.mempoolAnalysis = {
                calculatedFastPpu: sortedPpuValues[fastIndex],
                calculatedFasterPpu: sortedPpuValues[fasterIndex],
                fastPpuDifference: fastDiff,
                fasterPpuDifference: fasterDiff,
                transactionCount: transactions.length,
              };

              // Save the activity report
              const reportsDir = path.join(__dirname, '../../../reports/ppu-activity');
              if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
              }

              const safeTimestamp = timestamp.replace(/[:.]/g, '-');
              const filename = path.join(reportsDir, `ppu-activity-shard-${shardId}-${safeTimestamp}.json`);
              fs.writeFileSync(filename, JSON.stringify(activityReport, null, 2));
              console.log(`\nActivity report saved to: ${filename}`);
            }
          }
        } catch (error) {
          console.error(`Error monitoring PPU for shard ${shardId}:`, error);
        }
      }
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  // Start the monitoring process
  void monitor();

  // Return function to stop monitoring
  return () => {
    shouldContinue = false;
  };
}

interface PpuReportData {
  timestamp: string;
  batchNumber: number;
  shards: {
    [key: number]: {
      lastBlock: number;
      fastPpu: number;
      fasterPpu: number;
      totalTransactions: number;
      ppuDistribution?: {
        highest: number;
        fast: number;
        faster: number;
        lowest: number;
      };
      validation?: {
        fastDiff: number;
        fasterDiff: number;
      };
      transactionDistribution?: {
        regular: number;
        smartContract: number;
      };
    };
  };
}

function calculatePpuDifference(actualPpu: number, calculatedPpu: number): number {
  if (actualPpu === 0 || calculatedPpu === 0) {
    return 0;
  }

  // Calculate the relative difference as a percentage
  const relativeDiff = Math.abs(actualPpu - calculatedPpu) / Math.max(actualPpu, calculatedPpu);

  // We consider differences of less than 1% as acceptable
  return relativeDiff;
}

async function getFinalPpuReport(batchNumber?: number): Promise<PpuReportData> {
  const reportData: PpuReportData = {
    timestamp: new Date().toISOString(),
    batchNumber: batchNumber || 0,
    shards: {},
  };

  console.log('\n=== PPU Report' + (batchNumber ? ` after batch ${batchNumber}` : '') + ' ===');

  for (let shardId = 0; shardId <= 2; shardId++) {
    try {
      console.log(`\nShard ${shardId}:`);
      console.log('------------------------');

      // Get PPU data
      const ppuResponse = await axios.get(`${config.apiServiceUrl}/transactions/ppu/${shardId}`);
      const ppuData = ppuResponse.data;

      // Get mempool transactions
      const poolResponse = await axios.get(`${config.apiServiceUrl}/pool?senderShard=${shardId}&size=10000`);
      const transactions = poolResponse.data;

      reportData.shards[shardId] = {
        lastBlock: ppuData.LastBlock,
        fastPpu: ppuData.Fast,
        fasterPpu: ppuData.Faster,
        totalTransactions: transactions.length,
      };

      console.log(`Last Block: ${ppuData.LastBlock}`);
      console.log(`Fast PPU: ${ppuData.Fast}`);
      console.log(`Faster PPU: ${ppuData.Faster}`);
      console.log(`Total transactions in mempool: ${transactions.length}`);

      if (transactions.length > 0) {
        // Get network constants
        const networkResponse = await axios.get(`${config.apiServiceUrl}/constants`);
        const { minGasLimit, gasPerDataByte, gasPriceModifier } = networkResponse.data;

        // Calculate PPU distribution
        const ppuValues = transactions.map((tx: { data?: string; gasLimit: string; gasPrice: string }) => {
          const data = tx.data ? BinaryUtils.base64Decode(tx.data) : '';
          const gasLimit = Number(tx.gasLimit);
          const gasPrice = Number(tx.gasPrice);

          const dataCost = minGasLimit + data.length * gasPerDataByte;
          const executionCost = gasLimit - dataCost;
          const initiallyPaidFee = dataCost * gasPrice + executionCost * gasPrice * Number(gasPriceModifier);
          return Math.floor(initiallyPaidFee / gasLimit);
        });

        // Sort and get statistics
        const sortedPpuValues = [...ppuValues].sort((a, b) => b - a);
        const fastIndex = Math.floor(transactions.length * 0.2);
        const fasterIndex = Math.floor(transactions.length * 0.1);

        console.log('\nPPU Distribution:');
        console.log(`Highest PPU: ${sortedPpuValues[0]}`);
        console.log(`Calculated Fast PPU (20th percentile): ${sortedPpuValues[fastIndex]}`);
        console.log(`Calculated Faster PPU (10th percentile): ${sortedPpuValues[fasterIndex]}`);
        console.log(`Lowest PPU: ${sortedPpuValues[sortedPpuValues.length - 1]}`);

        reportData.shards[shardId].ppuDistribution = {
          highest: sortedPpuValues[0],
          fast: sortedPpuValues[fastIndex],
          faster: sortedPpuValues[fasterIndex],
          lowest: sortedPpuValues[sortedPpuValues.length - 1],
        };

        // Calculate differences using the new method
        const fastDiff = calculatePpuDifference(ppuData.Fast, sortedPpuValues[fastIndex]);
        const fasterDiff = calculatePpuDifference(ppuData.Faster, sortedPpuValues[fasterIndex]);

        console.log('\nPPU Analysis:');
        console.log(`Fast PPU from API: ${ppuData.Fast}`);
        console.log(`Fast PPU calculated (20th percentile): ${sortedPpuValues[fastIndex]}`);
        console.log(`Fast PPU difference: ${(fastDiff * 100).toFixed(2)}%`);

        console.log(`\nFaster PPU from API: ${ppuData.Faster}`);
        console.log(`Faster PPU calculated (10th percentile): ${sortedPpuValues[fasterIndex]}`);
        console.log(`Faster PPU difference: ${(fasterDiff * 100).toFixed(2)}%`);

        if (fastDiff > 0.1 || fasterDiff > 0.1) {
          console.log('\n⚠️ Warning: Large PPU difference detected!');
          console.log('This might indicate:');
          console.log('1. High mempool congestion');
          console.log('2. Rapid changes in gas prices');
          console.log('3. Potential calculation discrepancies');
        }

        reportData.shards[shardId].validation = {
          fastDiff: fastDiff,
          fasterDiff: fasterDiff,
        };

        // Transaction type distribution
        const scTransactions = transactions.filter((tx: { data?: string }) =>
          tx.data && BinaryUtils.base64Decode(tx.data).startsWith('ping')
        ).length;
        const regularTransactions = transactions.length - scTransactions;

        console.log('\nTransaction Distribution:');
        console.log(`Regular transactions: ${regularTransactions}`);
        console.log(`Smart Contract transactions: ${scTransactions}`);

        reportData.shards[shardId].transactionDistribution = {
          regular: regularTransactions,
          smartContract: scTransactions,
        };
      }
    } catch (error) {
      console.error(`Error getting final report for shard ${shardId}:`, error);
    }
  }

  // Save report to file
  const reportsDir = path.join(__dirname, '../../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(reportsDir, `ppu-report-${batchNumber ? `batch-${batchNumber}-` : ''}${timestamp}.json`);

  fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
  console.log(`\nReport saved to: ${filename}`);

  return reportData;
}

async function createContinuousCongestion(addresses: Record<string, string>, pingPongAddress: string) {
  console.log('Starting continuous congestion generation...');

  let batchNumber = 1;

  // Create transactions with realistic gas prices, including higher values
  const gasPrices = [
    1000000000,
    2000000000,
    3000000000,
    5000000000,
    7000000000,
    10000000000,
    15000000000,
    20000000000,
  ];

  // Create transactions with different data sizes, including larger ones
  const dataSizes = [
    '', // Empty data
    'small data field', // Small data
    'a'.repeat(100),    // Medium data
    'a'.repeat(500),    // Large data
    'a'.repeat(1000),   // Very large data
    'a'.repeat(2000),   // Extra large data
    'a'.repeat(5000),   // Huge data
    'a'.repeat(10000),   // Massive data
  ];

  // Smart contract function calls with varying complexity
  const scCalls = [
    'ping',
    'ping@01',
    'ping@0123456789',
    'ping@' + 'a'.repeat(100),  // Large argument
    'ping@' + 'a'.repeat(500),  // Very large argument
    'ping@' + 'a'.repeat(1000),  // Massive argument
  ];

  // Gas limits for smart contracts, including higher values
  const scGasLimits = [
    150000000,  // 150M
    200000000,  // 200M
    300000000,  // 300M
    400000000,   // 400M
  ];

  while (batchNumber <= 4) {
    console.log(`\nCreating transaction batch ${batchNumber}...`);

    // Create a mix of regular and smart contract transactions
    for (const [, sender] of Object.entries(addresses)) {
      // Regular transactions - create more heavy ones
      for (const gasPrice of gasPrices) {
        for (const dataField of dataSizes) {
          for (const receiver of Object.values(addresses)) {
            if (sender !== receiver) {
              // Add more transactions for higher gas prices
              const repeatCount = gasPrice >= 10000000000 ? 3 : 1; // Create more high-gas-price transactions

              for (let i = 0; i < repeatCount; i++) {
                await sendTransaction(
                  new SendTransactionArgs({
                    chainSimulatorUrl: config.chainSimulatorUrl,
                    sender: sender,
                    receiver: receiver,
                    dataField: dataField,
                    value: '1000000000000000000',
                    gasLimit: 50000000 + (dataField.length * 1500), // Adjust gas limit based on data size
                    nonceOffset: Math.floor(Math.random() * 5),
                    gasPrice: gasPrice.toString(),
                  })
                );
              }
            }
          }
        }
      }

      // Smart contract transactions - create more heavy ones
      for (const gasPrice of gasPrices) {
        for (const scCall of scCalls) {
          for (const gasLimit of scGasLimits) {
            // Add more transactions for higher gas prices
            const repeatCount = gasPrice >= 10000000000 ? 3 : 1;

            for (let i = 0; i < repeatCount; i++) {
              await sendTransaction(
                new SendTransactionArgs({
                  chainSimulatorUrl: config.chainSimulatorUrl,
                  sender: sender,
                  receiver: pingPongAddress,
                  dataField: scCall,
                  value: '1000000000000000000',
                  gasLimit: gasLimit,
                  nonceOffset: Math.floor(Math.random() * 5),
                  gasPrice: gasPrice.toString(),
                })
              );
            }
          }
        }
      }
    }

    console.log(`✓ Batch ${batchNumber} created`);

    // Generate and save report after each batch
    console.log('\nGenerating report for this batch...');
    await getFinalPpuReport(batchNumber);

    // Wait a bit before next batch to allow some transactions to be processed
    console.log('\nWaiting for transactions to be processed before next batch...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    batchNumber++;
  }
}

// Run the test
void testPpuCalculation(); 
