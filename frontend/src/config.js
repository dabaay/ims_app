const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const BASE_URL = API_URL.replace('/api', '');

export const config = {
    apiUrl: API_URL,
    baseUrl: BASE_URL,
    storageUrl: `${BASE_URL}/storage`,
};

export default config;
