create table if not exists entries (
    created_date text primary key,
    content_text text not null,
	content_html text not null,
	word_count real not null default 0,
    goal_id integer references goals(id)
);

create table if not exists goals (
    id integer primary key autoincrement,
	name text not null,
	count_target real not null,
	start_date text not null,
	end_date text not null,
	updated text not null default current_date,
	created text not null default current_date,
	check(count_target > 0),
	check(date(end_date) > date(start_date))
);

create table if not exists reminders (
	due_date text primary key, 
	goal_percentage real not null default 0,
	goal_id integer references goals(id),
	check(goal_percentage >= 0 and goal_percentage <= 100)
);

create view if not exists entries_goals (created_date, word_count, count_target, goal_name, goal_percent) as 
select entries.created_date, entries.word_count, goals.count_target, goals.name, (entries.word_count / goals.count_target)
from entries left join goals on entries.goal_id = goals.id;

create trigger if not exists entry_update after update on entries for each row
begin 
	update reminders set goal_percentage = round((new.word_count / (select count_target from goals where id = new.goal_id)) * 100, 0)
	where due_date = new.created_date;
end;

create trigger if not exists reminder_percent_update after update on reminders for each row
when new.goal_percentage >= 100
begin
	delete from reminders where due_date = new.due_date;
end;