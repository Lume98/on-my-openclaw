"use client";

import { useCallback, useEffect, useState } from "react";
import { useGateway } from "@/components/providers/gateway-provider";
import type { AsyncState } from "@/components/views/dashboard-components";

export function useGatewayQuery<T>(loader: () => Promise<T>, enabled = true): AsyncState<T> {
  const { connected } = useGateway();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !connected) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
    } finally {
      setLoading(false);
    }
  }, [enabled, connected, loader]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh, setData };
}
