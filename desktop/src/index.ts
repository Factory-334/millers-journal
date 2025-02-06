import {
	app,
	BrowserWindow,
	ipcMain,
	dialog,
	Notification,
	Tray,
	Menu,
	nativeImage,
} from "electron";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "path";
import { format } from "date-fns";
import { CronJob } from "cron";

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const CALENDAR_WINDOW_WEBPACK_ENTRY: string;
declare const CALENDAR_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const EDITOR_WINDOW_WEBPACK_ENTRY: string;
declare const EDITOR_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const TRAY_ICON_PATH = path.join(__dirname, "static/images/tray_icon.png");
const DATABASE_PATH = path.join(app.getPath("appData"), "millers-journal.db");
const CONFIG_PATH = path.join(app.getPath("userData"), "mj_config.json");
const INIT_SCRIPT_PATH = path.join(__dirname, "static/init.sql");

let tray;
let dailyMonitor: CronJob;

const db = new Database(DATABASE_PATH, {
	// verbose: console.log,
});

db.pragma("journal_mode = WAL");

let notificationJobs: NotificationJobStore = {};
let activeWindows: { [key: string]: BrowserWindow } = {};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	app.quit();
}

const createCalendarWindow = (): void => {
	if ("calendar" in activeWindows) {
		const calendarWindow = activeWindows["calendar"];
		calendarWindow.focus();
		return;
	}
	// Create the browser window.
	const calendarWindow = new BrowserWindow({
		show: false,
		minHeight: 600,
		minWidth: 800,
		titleBarStyle: "hidden",
		// expose window controlls in Windows/Linux
		...(process.platform !== "darwin" ? { titleBarOverlay: true } : {}),
		backgroundColor: "#FFFFF",
		webPreferences: {
			preload: CALENDAR_WINDOW_PRELOAD_WEBPACK_ENTRY,
		},
	});

	calendarWindow.loadURL(CALENDAR_WINDOW_WEBPACK_ENTRY).then(() => {
		calendarWindow.show();
	});

	calendarWindow.on("closed", () => {
		delete activeWindows["calendar"];
	});

	calendarWindow.on("focus", () => {
		calendarWindow.webContents.send("window-focus", true);
	});
	calendarWindow.on("blur", () => {
		calendarWindow.webContents.send("window-focus", false);
	});

	activeWindows["calendar"] = calendarWindow;
};

const createEditorWindow = (): void => {
	if ("editor" in activeWindows) {
		const calendarWindow = activeWindows["editor"];
		calendarWindow.focus();
		return;
	}

	const editorWindow = new BrowserWindow({
		show: false,
		frame: false,
		webPreferences: {
			preload: EDITOR_WINDOW_PRELOAD_WEBPACK_ENTRY,
		},
	});
	editorWindow.loadURL(EDITOR_WINDOW_WEBPACK_ENTRY).then(() => {
		editorWindow.maximize();
		editorWindow.show();
	});

	editorWindow.on("closed", () => {
		delete activeWindows["editor"];
	});

	activeWindows["editor"] = editorWindow;
};

const checkForTodaysGoal = () => {
	const discoveredGoals: DailyCheck[] = [];

	const today = format(new Date(), "yyyy-MM-dd");
	const findTodayGoal = db.prepare(
		"WITH todays_goals AS (SELECT * FROM goals WHERE date(start_date) <= date(@today) AND date(end_date) >= date(@today)) SELECT todays_goals.id as goal_id, todays_goals.count_target as count_target, entries.created_date as todays_entry, entries.word_count as entry_count FROM todays_goals LEFT JOIN entries ON entries.goal_id = todays_goals.id WHERE entries.word_count < todays_goals.count_target or entries.word_count is null"
	);
	const createReminder = db.prepare(
		"INSERT OR REPLACE INTO reminders (due_date, goal_percentage, goal_id) VALUES (@due_date, @goal_percentage, @goal_id) RETURNING *"
	);

	try {
		const dbResult = findTodayGoal.get({ today }) as DailyCheck;
		if (!dbResult) return;
		discoveredGoals.push(dbResult);
	} catch (e) {
		console.error("Unable to fetch goals for today", e);
	}
	discoveredGoals.forEach((goal) => {
		if (goal.todays_entry) {
			const goalPercentage = Math.round((goal.entry_count / goal.count_target) * 100);
			if (goalPercentage < 100) {
				const newReminder: NewReminder = {
					goal_id: goal.goal_id,
					goal_percentage: goalPercentage,
					due_date: today,
				};
				try {
					const goalReminder = createReminder.get(newReminder) as Reminder;
					setUpNotification(goalReminder);
				} catch (e) {
					console.error("Unable to set reminders for goals in-progress", e);
				}
			}
		} else {
			const newReminder: NewReminder = {
				goal_id: goal.goal_id,
				goal_percentage: 0,
				due_date: today,
			};
			try {
				const goalReminder = createReminder.get(newReminder) as Reminder;
				setUpNotification(goalReminder);
			} catch (e) {
				console.error("Unable to set reminders for goals outstanding", e);
			}
		}
	});
};

const setUpNotification = (reminder: Reminder) => {
	const notificationJob = CronJob.from({
		cronTime: "0 0 * * * *",
		onTick: function () {
			if (reminder.goal_percentage >= 100) {
				tearDownNotification(reminder.goal_id);
				return;
			}
			const goalNotification = new Notification({
				title: "Complete Today's Writing Goal",
				subtitle: `You are ${reminder.goal_percentage}% of the way there`,
			});
			goalNotification.on("click", () => {
				createCalendarWindow();
			});
			goalNotification.show();
		},
		start: true,
		timeZone: TIMEZONE,
	});
	notificationJobs[reminder.goal_id] = notificationJob;
};

const tearDownNotification = (goal_id: number) => {
	const activeReminder = notificationJobs[goal_id];
	if (!activeReminder) return;
	activeReminder.stop();
	delete notificationJobs[goal_id];
};

const setupApp = () => {
	try {
		const initScript = fs.readFileSync(INIT_SCRIPT_PATH, "utf8");
		db.exec(initScript);
		fs.writeFileSync(CONFIG_PATH, JSON.stringify({
			"initialized": new Date(),
			"version": app.getVersion()
		}))
	} catch (err) {
		dialog.showErrorBox("Miller's Journal failed setup, please check permissions", String(err));
		app.quit();
		return;
	}
};

app.on("ready", () => {
	if (!fs.existsSync(CONFIG_PATH)) {
		setupApp();
	}
	createCalendarWindow();
	checkForTodaysGoal();

	dailyMonitor = CronJob.from({
		cronTime: "0 0 9 * * *",
		onTick: function () {
			checkForTodaysGoal();
		},
		start: true,
		timeZone: TIMEZONE,
	});

	const icon = nativeImage.createFromPath(TRAY_ICON_PATH);
	tray = new Tray(icon);

	const contextMenu = Menu.buildFromTemplate([
		{ label: "Open Calendar", type: "normal", click: () => createCalendarWindow() },
		{ label: "Open Editor", type: "normal", click: () => createEditorWindow() },
		{ type: "separator" },
		{ label: "Quit Journal", type: "normal", click: () => app.quit() },
	]);
	tray.setContextMenu(contextMenu);
	tray.setToolTip("Miller's Journal");
});

app.on("before-quit", () => {
	Object.keys(notificationJobs).forEach((goalId) => {
		notificationJobs[parseInt(goalId)].stop();
	});
	dailyMonitor.stop();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	app.dock.hide();
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createCalendarWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on("show-editor", () => {
	createEditorWindow();
});

ipcMain.on("close-window", (event) => {
	const { sender } = event;
	sender.close();
});

ipcMain.handle("new-goal", async (_, arg: NewGoal): Promise<DBResponse> => {
	const insert = db.prepare(
		"INSERT INTO goals (name, count_target, start_date, end_date) VALUES (@name, @count, @start, @end) RETURNING *"
	);
	try {
		const dbResult = insert.get(arg);
		return { result: dbResult };
	} catch (err) {
		dialog.showErrorBox("Unable to create new goal", String(err));
		return { error: true };
	}
});

ipcMain.handle("load-entry", async (_, arg: EntryFetchParams): Promise<DBResponse> => {
	const fetch = db.prepare(
		"SELECT entries.created_date AS created_date, entries.content_html AS content_html, entries.word_count AS word_count, goals.id AS goal_id, goals.name as goal_name, goals.count_target AS count_target FROM entries LEFT JOIN goals ON entries.goal_id = goals.id WHERE entries.created_date = @date_key"
	);
	try {
		const entry = fetch.get(arg);
		return { result: entry };
	} catch (err) {
		console.error("Entry fetch failed:", String(err));
		return { error: "Unable to retrieve requested entry" };
	}
});

ipcMain.handle("sync-entry", async (_, arg): Promise<DBResponse> => {
	const upsert = db.prepare(
		"INSERT INTO entries (created_date, content_html, content_text, word_count, goal_id) VALUES (@created_date, @content_html, @content_text, @word_count, @goal_id) ON CONFLICT (created_date) DO UPDATE SET content_html=excluded.content_html, content_text=excluded.content_text, word_count=excluded.word_count "
	);
	try {
		upsert.run(arg);
		return { syncSuccess: true };
	} catch (err) {
		console.error("Last entry sync failed:", String(err));
		return { syncSuccess: false };
	}
});

ipcMain.handle("get-month-entries", async (_, arg: MonthEntriesParams): Promise<DBResponse> => {
	const entries = db.prepare(
		"SELECT created_date FROM entries_goals WHERE strftime('%Y-%m', created_date) = @month"
	);
	try {
		const resultEntries = entries.all(arg);
		return { result: resultEntries };
	} catch (err) {
		console.error("Entries fetch failed: ", String(err));
		return { error: "Unable to retrieve entries for the specified month" };
	}
});

ipcMain.handle("get-today-goal", async (_, arg: TodayGoalParam): Promise<DBResponse> => {
	const todayGoal = db.prepare(
		"SELECT id FROM goals WHERE date(start_date) <= date(@today) AND date(end_date) >= date(@today)"
	);
	try {
		const goalId = todayGoal.get(arg);
		return { result: goalId };
	} catch (error) {
		console.error("Goal fetch failed", error);
		return {
			error: "Unable to retreive goal ID for the specified date",
		};
	}
});
