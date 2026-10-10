import { useSyncExternalStore } from "react";
import { getContentVersion, subscribeContent } from "./index";

/** Re-render the calling component whenever content is edited. */
export const useContentVersion = () => useSyncExternalStore(subscribeContent, getContentVersion);
