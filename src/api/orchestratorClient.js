import axios from "axios";
import { demoApiAdapter } from "./demoApi";
import { isDemoMode } from "../config/env";

const orchestratorClient = axios.create({
  baseURL: import.meta.env.VITE_API_ORCHESTRATOR_URL,
  timeout: 60000,
  ...(isDemoMode ? { adapter: demoApiAdapter } : {}),
});

export default orchestratorClient;
