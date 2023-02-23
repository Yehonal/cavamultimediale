import { useState, useMemo, createContext } from "react";
import { NavigateFunction } from "react-router-dom";

export interface IAppContext {
  globalNavigator?: NavigateFunction;
  showSkipIntro?: boolean;
}

export type AppContextType = {
  ctx: IAppContext;
  setAppCtx: {
    (
      appContext: IAppContext | { (appContext: IAppContext): IAppContext }
    ): void;
  };
};

export function useAppStatus() {
  const [ctx, setAppCtx] = useState<IAppContext>({});

  return useMemo(() => ({ ctx, setAppCtx }), [ctx, setAppCtx]);
}

export const AppContext = createContext({} as AppContextType);
