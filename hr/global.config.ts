const ENABLE = true;
const DISABLE = false;

// Read from environment variable, default to true if not set
const authEnabled = process.env.NEXT_PUBLIC_WOWO_AUTH !== "false";

const GlobalConfig = {
  wowoFeatures: {
    auth: ENABLE,
    useDummyData: !authEnabled, // Use dummy data when auth is disabled
    nexusDirectUrl: process.env.NEXT_PUBLIC_NEXUS_DIRECT_URL || "http://localhost:3001",
  },
};

export default GlobalConfig;
