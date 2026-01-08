import { useState, useCallback } from "react";

export const useHistory = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [historyStep, setHistoryStep] = useState(0);

  const saveHistory = useCallback(
    (newState: T) => {
      // Prevent saving identical states to avoid duplicates in the stack
      const currentHistoryStr = JSON.stringify(history[historyStep]);
      const newStateStr = JSON.stringify(newState);
      if (currentHistoryStr === newStateStr) return;

      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(newState);
      if (newHistory.length > 50) newHistory.shift();

      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    },
    [history, historyStep]
  );

  const undo = useCallback(() => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      return history[prevStep];
    }
    return null;
  }, [historyStep, history]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      return history[nextStep];
    }
    return null;
  }, [historyStep, history]);

  return {
    current: history[historyStep],
    saveHistory,
    undo,
    redo,
    historyStep,
    canUndo: historyStep > 0,
    canRedo: historyStep < history.length - 1,
  };
};
