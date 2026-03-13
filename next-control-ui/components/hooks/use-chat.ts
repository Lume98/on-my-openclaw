import { useMemo } from "react";

export function useChat() {
  return useMemo(
    () => ({
      note: "聊天逻辑已迁移到 `@/components/page-views` 的路由化页面实现中。",
    }),
    [],
  );
}
