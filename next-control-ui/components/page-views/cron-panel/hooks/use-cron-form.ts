"use client";

import Form from "antd/es/form";
import { useCallback, useRef, useState } from "react";
import type { CronFormValues, CronJob } from "@/components/cron/cron-types";
import { DEFAULT_CRON_FORM } from "@/components/cron/cron-types";
import { jobToFormValues } from "@/components/cron/cron-utils";
import type { CronPanelForm } from "@/components/page-views/cron-panel/types";

/**
 * Cron表单逻辑Hook
 * 管理表单相关状态和逻辑
 */
export function useCronForm(): CronPanelForm {
  const [form] = Form.useForm<CronFormValues>();
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 监听表单字段变化
  const scheduleKind = Form.useWatch("scheduleKind", form) ?? DEFAULT_CRON_FORM.scheduleKind;
  const payloadKind = Form.useWatch("payloadKind", form) ?? DEFAULT_CRON_FORM.payloadKind;
  const deliveryMode = Form.useWatch("deliveryMode", form) ?? DEFAULT_CRON_FORM.deliveryMode;
  const scheduleExact = Form.useWatch("scheduleExact", form) ?? DEFAULT_CRON_FORM.scheduleExact;

  // 重置表单
  const resetForm = useCallback(() => {
    setEditingJobId(null);
    form.resetFields();
    form.setFieldsValue(DEFAULT_CRON_FORM);
  }, [form]);

  // 开始编辑
  const startEdit = useCallback(
    (job: CronJob) => {
      setEditingJobId(job.id);
      form.setFieldsValue(jobToFormValues(job));
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [form],
  );

  return {
    form,
    editingJobId,
    submitting,
    scheduleKind,
    payloadKind,
    deliveryMode,
    scheduleExact,
    resetForm,
    startEdit,
    setSubmitting,
  };
}
