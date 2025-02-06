export interface IElectronAPI {
    showEditor: () => Promise<void>,
    closeCurrentWindow: () => Promise<void>,
    newGoal: (goal: NewGoal) => Promise<DBResponse>,
    syncEntry: (entry: Omit<Entry, "goal_name"| "count_target">) => Promise<DBResponse>,
    loadEntry: (params: EntryFetchParams) => Promise<DBResponse>,
    getMonthEntries: (params: MonthEntriesParams) => Promise<DBResponse>,
    entryGoalId: (params: TodayGoalParam) => Promise<DBResponse>,
    windowFocusHandler: (callback: Function) => void
}
  
  declare global {
    interface Window {
      millersAPI: IElectronAPI
    }
  }