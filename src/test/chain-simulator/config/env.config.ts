import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '.env'),
});

export const config = {
  chainSimulatorUrl: process.env.CHAIN_SIMULATOR_URL || 'http://localhost:8085',
  apiServiceUrl: process.env.API_SERVICE_URL || 'http://localhost:3001',
}; 
