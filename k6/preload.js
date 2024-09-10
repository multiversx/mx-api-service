import http from 'k6/http';

const BASE_URL = 'http://localhost:3001';

export default function preloadCache() {
    const numberofTokens = http.get(`${BASE_URL}/tokens/count`);
    http.get(`${BASE_URL}/tokens?size=${numberofTokens}`);
    const numberofNodes = http.get(`${BASE_URL}/nodes/count`);
    http.get(`${BASE_URL}/nodes?size=${numberofNodes}`);
    const numberofTags = http.get(`${BASE_URL}/tags/count`);
    http.get(`${BASE_URL}/tags?size=${numberofTags}`);
}
