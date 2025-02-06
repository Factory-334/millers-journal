import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { useState } from "react";
import {
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

const FormSchema = z.object({
	goalName: z.string(),
	goalCount: z.coerce.number().int(),
	range: z.object({
		start: z.date(),
		end: z.date(),
	}),
});

export function GoalForm({dismiss}: {dismiss: Function}) {
	const { newGoal } = window.millersAPI;

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	const [date, setDate] = useState<DateRange | undefined>({
		from: new Date(),
		to: addDays(new Date(), 7),
	});

	function onSubmit(data: z.infer<typeof FormSchema>) {
		const dbResult = newGoal({
			name: data.goalName,
			start: format(data.range.start, "yyyy-MM-dd"),
			end: format(data.range.end, "yyyy-MM-dd"),
			count: data.goalCount,
		}).then((response) => response);

		dismiss()
		console.log(dbResult);
	}

	return (
		<>
			<DialogTrigger asChild>
				<Button variant="ghost">
					{" "}
					<PlusIcon /> New Goal
				</Button>
			</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New Writing Goal</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								name="goalName"
								control={form.control}
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel>Name</FormLabel>
										<FormDescription>Give this goal a wonderful name</FormDescription>
										<FormControl>
											<Input
												className="w-[240px]"
												value={field.value}
												onChange={field.onChange}
												placeholder="A poem a day"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="goalCount"
								control={form.control}
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel>Word Count</FormLabel>
										<FormDescription>Set your word count target</FormDescription>
										<FormControl>
											<Input
												className="w-[160px]"
												placeholder="500"
												defaultValue={field.value}
												value={field.value}
												onChange={(e) => field.onChange(e.target.value)}
												type="number"
												min="1"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="range"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel>Date Range</FormLabel>
										<FormDescription>
											Set how long the this writing goal will be active
										</FormDescription>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant={"outline"}
														className={cn(
															"w-[240px] pl-3 text-left font-normal",
															!field.value && "text-muted-foreground"
														)}
													>
														<CalendarIcon className="h-4 w-4 opacity-50" />
														{field.value?.start ? (
															field.value?.end ? (
																<>
																	{format(field.value.start, "LLL dd, y")} -{" "}
																	{format(field.value.end, "LLL dd, y")}
																</>
															) : (
																format(field.value.start, "LLL dd, y")
															)
														) : (
															<span>Select date range</span>
														)}
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="range"
													defaultMonth={date?.from}
													selected={date}
													onSelect={(range) => {
														field.onChange({ start: range.from, end: range.to });
														setDate(range);
													}}
												/>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit">Create Goal</Button>
						</form>
					</Form>
				</DialogContent>
        </>
	);
}
