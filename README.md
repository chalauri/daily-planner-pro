# Daily Planner Pro

I want to build the application for planner. It will have the simple UI and functionality.

What user will be able to do:

- Register / Authorize

- On registration, email confirmation should be mandatory

- When user logs in, on the screen should be plans by default filtered on the same day

- There should be search by date, status, text (can be full text search or title search but not exact text)

- On screen should be button to add the plan (Title, Description optional, date, by default status should be TODO or OPEN)

- In the list of plans there should be a button(s) to mark concrete plan as DONE or NOT_DONE. Should be easy to differentiate 

- Optional but would be nice to be integration with Google Calendar and button to add the notification in calendar

- There should be background job to send user the notification on email by the end of day, around 23:55 about OPEN tasks/plans on concrete day that their statuses need to be updated

- I want to be able to see statistics after filtering. So statistics should run on the data which are filtered out

This is like MVP. What functionality would you add ?

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2ae51136-a2bf-49ed-ba42-9ab3f8d552d1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
