/** Client build id embedded at Next build time. */
export function getLocalAppBuildId(): string {
  const value = process.env.NEXT_PUBLIC_APP_BUILD_ID?.trim();
  return value || "local-dev";
}
