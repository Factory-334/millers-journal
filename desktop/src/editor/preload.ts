const { contextBridge: editorBridge, ipcRenderer: editorRender } = require("electron");

editorBridge.exposeInMainWorld("millersAPI", {
	closeCurrentWindow: () => editorRender.send("close-window"),
	syncEntry: async (entry: Omit<Entry, "goal_name"| "count_target">) => await editorRender.invoke("sync-entry", entry),
	loadEntry: async (params: EntryFetchParams) => await editorRender.invoke("load-entry", params),
	entryGoalId: async (params: TodayGoalParam) => await editorRender.invoke("get-today-goal", params)
});
