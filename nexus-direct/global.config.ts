const ENABLE = true;
const DISABLE = false;

// Read from environment variable, default to true if not set
const authEnabled = process.env.NEXT_PUBLIC_WOWO_AUTH !== "false";

const GlobalConfig = {
  wowoFeatures: {
    auth: authEnabled,
    useDummyData: !authEnabled, // Use dummy data when auth is disabled
  },
};

export default GlobalConfig;
