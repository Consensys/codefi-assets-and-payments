import axios from 'axios';

const createAxiosClient = (config = {}) => axios.create(config);

export default createAxiosClient;
