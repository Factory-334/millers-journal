const { contextBridge: calBridge, ipcRenderer: calRender } = require("electron");

calBridge.exposeInMainWorld("millersAPI", {
	showEditor: () => calRender.send("show-editor"),
	newGoal: async (goal: NewGoal) => await calRender.invoke("new-goal", goal),
	loadEntry: async (params: EntryFetchParams) => await calRender.invoke("load-entry", params),
	getMonthEntries: async (params: MonthEntriesParams) =>
		await calRender.invoke("get-month-entries", params),
	windowFocusHandler: (callback: Function) => calRender.on('window-focus', (_, value: boolean) => callback(value))
});
