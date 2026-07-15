import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { App } from "antd";

import { createModelChannel, normalizeFixedBaseUrl, useConfigStore } from "@/stores/use-config-store";

export function ClientRootInit({ children }: { children: ReactNode }) {
    const { message } = App.useApp();
    const handledConfigParams = useRef(false);
    const updateConfig = useConfigStore((state) => state.updateConfig);
    const config = useConfigStore((state) => state.config);
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);

    useEffect(() => {
        if (handledConfigParams.current) return;
        const searchParams = new URLSearchParams(window.location.search);
        const fragmentParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const rawBaseUrl = fragmentParams.get("baseUrl") || fragmentParams.get("baseurl") || searchParams.get("baseUrl") || searchParams.get("baseurl");
        const baseUrl = rawBaseUrl ? normalizeFixedBaseUrl(rawBaseUrl) : "";
        const apiKey = fragmentParams.get("apiKey") || fragmentParams.get("apikey");
        const legacyApiKey = searchParams.get("apiKey") || searchParams.get("apikey");
        if (!rawBaseUrl && !apiKey && !legacyApiKey) return;
        handledConfigParams.current = true;
        searchParams.delete("baseUrl");
        searchParams.delete("baseurl");
        searchParams.delete("apiKey");
        searchParams.delete("apikey");
        fragmentParams.delete("baseUrl");
        fragmentParams.delete("baseurl");
        fragmentParams.delete("apiKey");
        fragmentParams.delete("apikey");
        window.history.replaceState(null, "", `${window.location.pathname}${searchParams.size ? `?${searchParams}` : ""}${fragmentParams.size ? `#${fragmentParams}` : ""}`);
        if (legacyApiKey && !apiKey) {
            openConfigDialog(false);
            message.warning("为避免密钥进入服务器日志，API Key 请通过 URL #apiKey 片段导入");
            return;
        }
        const firstChannel = config.channels[0];
        updateConfig(
            "channels",
            firstChannel
                ? config.channels.map((channel, index) =>
                      index === 0
                          ? {
                                ...channel,
                                ...(baseUrl ? { baseUrl } : {}),
                                ...(apiKey ? { apiKey } : {}),
                            }
                          : channel,
                  )
                : [createModelChannel({ id: "default", name: "默认渠道", baseUrl: baseUrl || undefined, apiKey: apiKey || "" })],
        );
        if (baseUrl) updateConfig("baseUrl", baseUrl);
        if (apiKey) updateConfig("apiKey", apiKey);
        openConfigDialog(false);
        message.success("已安全导入本地直连配置");
    }, [config.channels, message, openConfigDialog, updateConfig]);

    return <>{children}</>;
}
