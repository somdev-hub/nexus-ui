import GlobalConfig from "@/global.config";

/**
 * Custom hook to access WOWO configuration in a read-only manner
 * @returns {Readonly<typeof GlobalConfig.wowoFeatures>} Read-only WOWO features configuration
 *
 * @example
 * const wowoConfig = useWOWO();
 * console.log(wowoConfig.auth); // access only, cannot modify
 */
export function useWOWO() {
  return Object.freeze({ ...GlobalConfig.wowoFeatures });
}
