const ENABLE = true;
const DISABLE = false;

const authEnabled = process.env.NEXT_PUBLIC_WOWO_AUTH !== "false";

const GlobalConfig = {
  wowoFeatures: {
    auth: ENABLE,
    useDummyData: !authEnabled,
    nexusDirectUrl: process.env.NEXT_PUBLIC_NEXUS_DIRECT_URL || "http://localhost:3001",
  },
};

export default GlobalConfig;
