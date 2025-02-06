import "../styles.css";
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { GoalForm } from "@/components/composed/GoalForm";
import { Dialog } from "@/components/ui/dialog";

const CalendarWindow = () => {
	const { showEditor, loadEntry, getMonthEntries, windowFocusHandler } = window.millersAPI;
	const today = format(new Date(), "yyyy-MM-dd");
	const month = format(today, "yyyy-MM");
	const [date, setDate] = useState<Date | undefined>(new Date());
	const [currentMonth, setCurrentMonth] = useState<string>(month);
	const [currentEntry, setEntry] = useState<Entry>();
	const [monthDataDisplay, updateMonthDataDisplay] = useState<MonthEntry[]>();
	const [windowFocus, setWindowFocus] = useState<boolean>(true);
	const [goalModal, openGoalModal] = useState<boolean>(false);

	windowFocusHandler((value: boolean) => {
		setWindowFocus(value);
	});

	useEffect(() => {
		(async () => {
			const foundEntries = await getMonthEntries({ month: currentMonth });
			const newEntries = foundEntries.result;
			updateMonthDataDisplay(newEntries);
		})();
	}, [currentMonth]);

	useEffect(() => {
		(async () => {
			const dateKey = format(date, "yyyy-MM-dd");
			const foundEntry = await loadEntry({ date_key: dateKey });
			if (foundEntry.result) {
				const entry = foundEntry.result as Entry;
				setEntry(entry);
			} else {
				setEntry(null);
			}
		})();
	}, [date, windowFocus, goalModal]);

	const formatGoalLabel = () => {
		const goalPercentage = Math.round((currentEntry.word_count / currentEntry.count_target) * 100);
		return `${currentEntry.goal_name}, ${`${goalPercentage}% complete`}`;
	};

	const handleDateSelection = (newDate: Date) => {
		if (date?.getTime() === newDate.getTime()) return;
		setDate(newDate);
	};

	const handleMonthChange = (newMonth: Date) => {
		const selectedMonth = format(newMonth, "yyyy-MM");
		setCurrentMonth(selectedMonth);
	};

	const highlightedDates = () => {
		if (!monthDataDisplay) return [];
		return monthDataDisplay.map((entry) => {
			const [year, month, day] = entry.created_date.split("-").map(Number);
			return new Date(year, month - 1, day);
		});
	};

	return (
		<div className="flex flex-col h-full fixed px-4 pt-8 w-full ">
			<div className="flex flex-row h-full">
				<div>
					<Calendar
						modifiers={{
							highlighted: highlightedDates(),
						}}
						modifiersClassNames={{
							highlighted: "bg-green-100",
						}}
						mode="single"
						selected={date}
						onSelect={handleDateSelection}
						onMonthChange={handleMonthChange}
						required
					/>
					<div className="mt-3">
						<Dialog open={goalModal} onOpenChange={(open) => openGoalModal(open)}>
							<GoalForm dismiss={() => openGoalModal(false)} />
						</Dialog>
					</div>
				</div>
				<div className="flex flex-col flex-grow h-full w-full">
					<div className="flex flex-row justify-end mb-4 h-12 w-full">
						<Button disabled={format(date, "yyyy-MM-dd") != today} onClick={() => showEditor()}>
							Open Editor
						</Button>
					</div>
					{currentEntry && (
						<div className="px-4 text-green-600 font-medium">
							{currentEntry.goal_id ? formatGoalLabel() : null}
						</div>
					)}
					<ScrollArea className="p-4">
						{currentEntry ? (
							<div className="text-left">
								<p className="text-sm font-bold mb-2">{format(date, "MMMM do, yyyy")}</p>
								<div
									className="flex flex-col space-y-2"
									dangerouslySetInnerHTML={{ __html: currentEntry.content_html }}
								/>
							</div>
						) : (
							<div>{`There is no entry for ${format(date, "MMMM do, yyyy")}`}</div>
						)}
					</ScrollArea>
				</div>
			</div>
		</div>
	);
};

const root = createRoot(document.getElementById("root"));
root.render(<CalendarWindow />);
