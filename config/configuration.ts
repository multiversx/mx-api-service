import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

const YAML_CONFIG_FILENAME = 'config.yaml';

export default () => {
    const filePath = join(__dirname, YAML_CONFIG_FILENAME);
    console.log('Trying to load config file from:', filePath);
    console.log('__dirname:', __dirname);
    console.log('process.cwd():', process.cwd());

    try {
        const config = yaml.load(readFileSync(filePath, 'utf8'));
        return config as Record<string, any>;
    } catch (error) {
        console.error('Error loading the config file:', error);
        throw error;
    }
};
