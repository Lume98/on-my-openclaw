import type { FormInstance } from "antd";
import type {
  CronFormValues,
  CronJob,
  CronJobsEnabledFilter,
  CronJobsLastStatusFilter,
  CronJobsScheduleKindFilter,
  CronJobsSortBy,
  CronRunScope,
  CronRunsStatusFilter,
  CronRunEntry,
  CronSortDir,
} from "@/components/cron/cron-types";
import type { AsyncState } from "@/components/page-views/shared/dashboard-components";
import type { CronStatus } from "@/lib/types";

/**
 * Cron面板过滤器状态集合
 */
export interface CronPanelFilters {
  // 任务过滤器
  jobQuery: string;
  setJobQuery: (value: string) => void;
  jobEnabledFilter: CronJobsEnabledFilter;
  setJobEnabledFilter: (value: CronJobsEnabledFilter) => void;
  jobScheduleFilter: CronJobsScheduleKindFilter;
  setJobScheduleFilter: (value: CronJobsScheduleKindFilter) => void;
  jobLastStatusFilter: CronJobsLastStatusFilter;
  setJobLastStatusFilter: (value: CronJobsLastStatusFilter) => void;
  jobSortBy: CronJobsSortBy;
  setJobSortBy: (value: CronJobsSortBy) => void;
  jobSortDir: CronSortDir;
  setJobSortDir: (value: CronSortDir) => void;

  // 运行记录过滤器
  runsScope: CronRunScope;
  setRunsScope: (value: CronRunScope) => void;
  runsJobId: string | null;
  setRunsJobId: (value: string | null) => void;
  runsQuery: string;
  setRunsQuery: (value: string) => void;
  runsStatusFilter: CronRunsStatusFilter;
  setRunsStatusFilter: (value: CronRunsStatusFilter) => void;
  runsSortDir: CronSortDir;
  setRunsSortDir: (value: CronSortDir) => void;

  // 重置方法
  resetJobFilters: () => void;
}

/**
 * Cron面板操作回调集合
 */
export interface CronPanelActions {
  onToggleJob: (job: CronJob) => Promise<void>;
  onRunJob: (job: CronJob) => Promise<void>;
  onDeleteJob: (job: CronJob) => Promise<void>;
  onEditJob: (job: CronJob) => void;
}

/**
 * Cron面板数据状态
 */
export interface CronPanelData {
  status: AsyncState<CronStatus>;
  jobs: AsyncState<{ jobs?: CronJob[]; total?: number }>;
  runs: AsyncState<{ entries?: CronRunEntry[]; total?: number }>;
  loading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
}

/**
 * Cron面板表单状态
 */
export interface CronPanelForm {
  form: FormInstance<CronFormValues>;
  editingJobId: string | null;
  submitting: boolean;
  scheduleKind: "at" | "every" | "cron";
  payloadKind: "systemEvent" | "agentTurn";
  deliveryMode: "none" | "announce" | "webhook";
  scheduleExact: boolean;
  resetForm: () => void;
  startEdit: (job: CronJob) => void;
  setSubmitting: (value: boolean) => void;
}
