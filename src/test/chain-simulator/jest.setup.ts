import axios from "axios";

axios.defaults.adapter = 'fetch';
axios.defaults.headers.common['Connection'] = 'close';
