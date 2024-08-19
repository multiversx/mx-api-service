import http from 'k6/http';

const BASE_URL = 'http://localhost:3001';

export default function () {
    http.get(`${BASE_URL}/tokens`);
    http.get(`${BASE_URL}/nodes`);
}