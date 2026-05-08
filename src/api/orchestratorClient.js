import axios from "axios";

const orchestratorClient = axios.create({
  baseURL: import.meta.env.VITE_API_ORCHESTRATOR_URL,
  timeout: 60000,
});

export default orchestratorClient;
