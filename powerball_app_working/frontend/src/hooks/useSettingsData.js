import useAsync from "./useAsync";
import { fetchSettings } from "../lib/api";

export default function useSettingsData() {
    return useAsync(fetchSettings, [], { immediate: true });
}
