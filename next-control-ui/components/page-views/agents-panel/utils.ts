export function normalizeAgentLabel(agent: {
  id: string;
  name?: string;
  identity?: { name?: string };
}) {
  return agent.name?.trim() || agent.identity?.name?.trim() || agent.id;
}

export function resolveAgentEmoji(agent: { identity?: { emoji?: string; avatar?: string } }) {
  const emoji = agent.identity?.emoji?.trim();
  if (emoji && emoji.length <= 4) {
    return emoji;
  }
  const avatar = agent.identity?.avatar?.trim();
  if (avatar && avatar.length <= 4) {
    return avatar;
  }
  return "";
}

export function formatBytes(bytes?: number) {
  if (bytes == null || !Number.isFinite(bytes)) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[i]}`;
}

export function formatRelative(ms?: number) {
  if (ms == null || !Number.isFinite(ms)) {
    return "—";
  }
  const d = Date.now() - ms;
  if (d < 60_000) {
    return "刚刚";
  }
  if (d < 3600_000) {
    return `${Math.floor(d / 60_000)} 分钟前`;
  }
  if (d < 86400_000) {
    return `${Math.floor(d / 3600_000)} 小时前`;
  }
  return `${Math.floor(d / 86400_000)} 天前`;
}

export function formatNextRun(ms?: number | null) {
  if (ms == null || !Number.isFinite(ms)) {
    return "—";
  }
  const d = new Date(ms);
  return d.toLocaleString("zh-CN");
}
