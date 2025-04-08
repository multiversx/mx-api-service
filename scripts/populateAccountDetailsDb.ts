const { MongoClient } = require("mongodb");
import scAddressData from "./scAddressTemplate.json";
import walletAddressData from "./walletAddressTemplate.json";
import axios from "axios";
import { AddressUtils } from '@multiversx/sdk-nestjs-common';
const fs = require('fs');

const MONGO_URI = "mongodb://root:secret@localhost:27017"; // Replace with your MongoDB URI
const DATABASE_NAME = "api"; // Replace with your database name
const COLLECTION_NAME = "account-details";
const ELASTICSEARCH_URL = "https://index.multiversx.com";

async function fetchFirstPageFromElastic(url: string, size: number) {
    let addresses: any[] = [];
    let scrollId = null;

    try {
        // First request to initialize sc
        const body = {
            size,
            query: { match_all: {} },
        }
        let response: any = await axios.post(`${url}/accounts/_search?scroll=5m`, body);
        scrollId = response.data._scroll_id;
        addresses = response.data.hits.hits.map((hit: any) => hit._source.address);
        // Fetch next batches

        return { addresses, scrollId };
    } catch (error) {
        console.error("Error fetching accounts from ElasticSearch:", error);
        return { addresses: [], scrollId: null };
    }
}

async function scroll(url: string, scrollId: string) {
    try {
        let response = await axios.post(`${url}/_search/scroll`, {
            scroll: '20m',
            scroll_id: scrollId,
        });

        scrollId = response.data._scroll_id;

        const addresses: any[] = response.data.hits.hits.map((hit: any) => hit._source.address);
        return { addresses, scrollId };
    } catch (error) {
        console.error(error);
        return { addresses: [], scrollId: null };
    }
}
async function populateAccountDetailsDb() {
    const client = new MongoClient(MONGO_URI, {
        tls: true,
        tlsAllowInvalidHostnames: true,
        tlsAllowInvalidCertificates: true,
    });
    const iterations = 100;
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);
        await collection.createIndex({ address: 1 }, { unique: true });
        const scrollSize = 1000;
        let addresses: any[] = [];
        let scrollId: any = null;
        for (let i = 1; i <= iterations; i++) {
            ({ addresses, scrollId } = i === 1
                ? await fetchFirstPageFromElastic(ELASTICSEARCH_URL, scrollSize)
                : await scroll(ELASTICSEARCH_URL, scrollId));

            console.log(`Fetched ${addresses.length} addresses from ElasticSearch`);
            const scAddressDocuments: any[] = [];
            const walletAddressDocuments: any[] = [];
            // console.log(addresses)
            for (const address of addresses) {
                if (AddressUtils.isSmartContractAddress(address)) {
                    scAddressDocuments.push({
                        ...scAddressData,
                        address
                    });
                } else {
                    walletAddressDocuments.push({
                        ...walletAddressData,
                        address
                    });
                }
            }
            const filePath = './addresses.txt';
            await fs.promises.appendFile(filePath, addresses.join('\n') + '\n', 'utf8');
            console.log(`Wrote ${addresses.length} addresses to ${filePath}`);

            const result = await collection.insertMany(scAddressDocuments.concat(walletAddressDocuments));
            console.log(`Inserted ${result.insertedCount} documents into the collection`);
            console.log(`${iterations - i} iterations left`);
            await new Promise(resolve => setTimeout(resolve, 1000));

        }
    } catch (error) {
        console.error("Error populating account-details collection:", error);
    } finally {
        await client.close();
        console.log("MongoDB connection closed");
    }
}

populateAccountDetailsDb();