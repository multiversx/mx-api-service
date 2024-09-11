import http from 'k6/http';

const BASE_URL = 'http://localhost:3001';

export default function preloadCache() {
    const numberOfTokens = http.get(`${BASE_URL}/tokens/count`);
    http.get(`${BASE_URL}/tokens?size=${numberOfTokens}`);
    const numberOfNodes = http.get(`${BASE_URL}/nodes/count`);
    http.get(`${BASE_URL}/nodes?size=${numberOfNodes}`);
    const numberOfTags = http.get(`${BASE_URL}/tags/count`);
    http.get(`${BASE_URL}/tags?size=${numberOfTags}`);
}
