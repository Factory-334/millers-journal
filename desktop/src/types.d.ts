import { CronJob } from "cron"

export {}

declare global {
    interface NewGoal {
        name: string,
        count: number,
        start: string,
        end: string
    }

    interface Goal{
        id: number,
        name: string,
        count_target: number,
        start_date: string,
        end_date: string,
        updated: string,
        created: string,
    }
    
    interface Entry{
        created_date: string,
        word_count: number,
        content_html: string,
        content_text: string,
        goal_id: number | null,
        goal_name: string | null,
        count_target: number | null
    }

    interface MonthEntry{
        created_date: string
    }

    interface EntryFetchParams{
        date_key: string
    }

    interface DBResponse {
        result?: any
        error?: any
        syncSuccess?: boolean
    }

    interface DailyCheck {
        goal_id: number,
        goal_name: string,
        count_target: number,
        todays_entry: string | null,
        entry_count: number | null
    }

    interface NewReminder{
        due_date: string,
        goal_id: number,
        goal_percentage: number
    }

    interface Reminder extends NewReminder{
        active: boolean
    }

    interface NotificationJobStore{
        [key: number]: CronJob
    }

    interface MonthEntriesParams{
        month: string
    }

    interface TodayGoalParam {
        today: string
    }
}