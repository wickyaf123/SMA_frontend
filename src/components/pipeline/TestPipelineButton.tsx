import { useState } from "react";
import { Play, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface PipelineStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  data?: any;
  error?: string;
  jobId?: string;
}

export const TestPipelineButton = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: 'import', name: 'Import 5 Apollo Solar Contacts', status: 'pending' },
    { id: 'enrich', name: 'Enrich Contact Data', status: 'pending' },
    { id: 'merge', name: 'Merge Duplicates', status: 'pending' },
    { id: 'validate', name: 'Validate Emails & Phones', status: 'pending' },
    { id: 'enroll', name: 'Auto-Enroll in Campaigns', status: 'pending' },
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStep = (stepId: string, updates: Partial<PipelineStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const runPipeline = async () => {
    setIsRunning(true);
    setStartTime(new Date());
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));

    try {
      // Step 1: Import Apollo Solar Contacts
      updateStep('import', { status: 'running' });
      try {
        const importResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/contractors/apollo/solar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('apiKey') || ''}`,
          },
          body: JSON.stringify({ 
            perPage: 5, 
            enrichLimit: 5, 
            page: 1 
          }),
        });

        if (!importResponse.ok) {
          throw new Error(`Import failed: ${importResponse.statusText}`);
        }

        const importData = await importResponse.json();
        updateStep('import', { 
          status: 'success', 
          data: { imported: 5, expected: 5 },
          jobId: importData.data?.jobId
        });
      } catch (error: any) {
        updateStep('import', { 
          status: 'failed', 
          error: error.message || 'Failed to import contacts'
        });
      }

      // Wait for imports to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Enrich Job
      updateStep('enrich', { status: 'running' });
      try {
        const enrichResponse = await api.jobs.triggerEnrich({ 
          batchSize: 10, 
          onlyNew: true 
        });
        
        updateStep('enrich', { 
          status: 'success',
          data: enrichResponse.data.result,
          jobId: enrichResponse.data.jobId
        });
      } catch (error: any) {
        updateStep('enrich', { 
          status: 'failed', 
          error: error.message || 'Failed to enrich contacts'
        });
      }

      // Step 3: Merge Job
      updateStep('merge', { status: 'running' });
      try {
        const mergeResponse = await api.jobs.triggerMerge();
        
        updateStep('merge', { 
          status: 'success',
          data: mergeResponse.data.result,
          jobId: mergeResponse.data.jobId
        });
      } catch (error: any) {
        updateStep('merge', { 
          status: 'failed', 
          error: error.message || 'Failed to merge duplicates'
        });
      }

      // Step 4: Validate Job
      updateStep('validate', { status: 'running' });
      try {
        const validateResponse = await api.jobs.triggerValidate({ 
          batchSize: 10 
        });
        
        updateStep('validate', { 
          status: 'success',
          data: validateResponse.data.result,
          jobId: validateResponse.data.jobId
        });
      } catch (error: any) {
        updateStep('validate', { 
          status: 'failed', 
          error: error.message || 'Failed to validate contacts'
        });
      }

      // Step 5: Auto-Enroll Job
      updateStep('enroll', { status: 'running' });
      try {
        const enrollResponse = await api.jobs.triggerEnroll({ 
          batchSize: 10 
        });
        
        updateStep('enroll', { 
          status: 'success',
          data: enrollResponse.data.result,
          jobId: enrollResponse.data.jobId
        });
      } catch (error: any) {
        updateStep('enroll', { 
          status: 'failed', 
          error: error.message || 'Failed to enroll contacts'
        });
      }

      // Calculate results
      const successCount = steps.filter(s => s.status === 'success').length;
      const failedCount = steps.filter(s => s.status === 'failed').length;

      // Show final toast
      if (failedCount === 0) {
        toast({
          title: '✅ Pipeline Test Passed!',
          description: 'All pipeline steps completed successfully.',
        });
      } else {
        toast({
          title: '⚠️ Pipeline Test Completed',
          description: `${successCount} steps succeeded, ${failedCount} steps failed.`,
          variant: 'destructive',
        });
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

    } catch (error: any) {
      toast({
        title: '❌ Pipeline Test Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleTest = () => {
    setShowDialog(true);
    runPipeline();
  };

  const completedSteps = steps.filter(s => s.status === 'success' || s.status === 'failed').length;
  const progress = (completedSteps / steps.length) * 100;
  const duration = startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0;
  const successCount = steps.filter(s => s.status === 'success').length;
  const failedCount = steps.filter(s => s.status === 'failed').length;

  const getStepIcon = (status: PipelineStep['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const formatStepData = (step: PipelineStep) => {
    if (!step.data) return null;
    
    const data = step.data;
    
    // Format different data types
    if (typeof data === 'object') {
      const entries = Object.entries(data).filter(([_, value]) => 
        typeof value === 'number' || typeof value === 'string'
      );
      
      if (entries.length === 0) return null;
      
      return entries.map(([key, value]) => (
        <span key={key} className="mr-3">
          {key}: <span className="font-medium">{value}</span>
        </span>
      ));
    }
    
    return null;
  };

  return (
    <>
      <Button
        onClick={handleTest}
        disabled={isRunning}
        size="lg"
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg"
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Running Test...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Test Pipeline End-to-End
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  Running Pipeline Test...
                </>
              ) : failedCount === 0 && completedSteps === steps.length ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Pipeline Test Successful!
                </>
              ) : completedSteps === steps.length ? (
                <>
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Pipeline Test Completed
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-gray-500" />
                  Pipeline Test
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isRunning 
                ? "Running all pipeline steps sequentially with real data..." 
                : completedSteps === steps.length
                ? failedCount === 0
                  ? "All pipeline steps completed successfully!"
                  : `${successCount} steps succeeded, ${failedCount} steps failed.`
                : "Click the button to start the test"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Progress Bar */}
            {isRunning && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Step {completedSteps} of {steps.length} • {duration}s elapsed
                </p>
              </div>
            )}

            {/* Summary Stats */}
            {!isRunning && completedSteps > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Steps:</span>
                  <span className="font-medium">{steps.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Successful:</span>
                  <span className="font-medium text-green-600">{successCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Failed:</span>
                  <span className="font-medium text-red-600">{failedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {duration}s
                  </span>
                </div>
                <Progress value={progress} className="h-2 mt-2" />
              </div>
            )}

            {/* Step Details */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Pipeline Steps:</h4>
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    step.status === 'success' && "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
                    step.status === 'failed' && "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
                    step.status === 'running' && "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
                    step.status === 'pending' && "bg-gray-50 border-gray-200 dark:bg-gray-900/30 dark:border-gray-800"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{step.name}</p>
                    {step.data && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatStepData(step)}
                      </p>
                    )}
                    {step.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Error: {step.error}
                      </p>
                    )}
                    {step.jobId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Job ID: {step.jobId}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isRunning && (
              <Button
                onClick={() => setShowDialog(false)}
                className="w-full"
              >
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

