# Miller's Journal
A desktop app for building a daily writing habit.

The basic functionality of the app is as follows:

1. Create a daily writing goal with a word count
2. Write. Your words are automatically saved.
3. Until you hit your goal word count, you will receive notifications every hour until you have done so.

The application takes an "opinionated" approach to daily writing in the sense that:

- Entries cannot be deleted once they have been started
- Past entries cannot be edited
- There can only be a single entry for each day
- The editor attempts to "trap" your focus by taking up all available space on your screen

Miller's Journal is a cross-platform desktop application built with the following technologies:

- Electron
- Cron
- Better-SQLite
- React
- TailwindCSS
- Shadcn

## "Install" the App
Miller's Journal is a prototype/proof-of-concep used to explore the merits of offline-first app development. It has been minimally tested for the ARM64 MacOS. 

It should not be treated as "production-ready"...things are broken (e.g. notifications in the distributable) certainly break. That being said, if you would like to play around with it:

1. Clone this repository with `git clone`
2. Install the necessary dependencies with `yarn install`
3. Run the app with `yarn start`
4. For an unsigned distributable, use `yarn make`

## Future Developments
This application is prototype/proof-of-concept. There are no immediate plans to continue its developments, but there are ideas on where it could go. If you are curious, contact engineering at factory334 dot com for details.


