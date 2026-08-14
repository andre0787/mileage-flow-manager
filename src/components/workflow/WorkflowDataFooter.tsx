import { useWorkflowData } from "@/lib/workflowData";

/**
 * WorkflowDataFooter — resolve `dataDate` via useWorkflowData() (React 19 use()).
 * Separado da página para que apenas este campo suspenda no Suspense do footer,
 * sem bloquear o restante do layout.
 */
export function WorkflowDataFooter() {
  const { dataDate } = useWorkflowData();
  return <>{dataDate}</>;
}
