import axios from "axios";

axios.defaults.adapter = 'fetch';
axios.defaults.headers.common['Connection'] = 'close';
console.log('Axios default adapter set to fetch and Connection header set to close');
