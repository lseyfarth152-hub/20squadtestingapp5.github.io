# Connect Alert Desk to real users

## 1. Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create an account.
2. Select **New project**. Pick an organisation, project name, database password, and region. Keep the database password somewhere safe; do not put it into this website.
3. Wait until the project status says it is ready.

## 2. Create the shared database

1. In the Supabase project, choose **SQL Editor** in the left menu.
2. Select **New query**.
3. Open `supabase-setup.sql` beside this file, copy all its contents, paste it into the editor, and select **Run**.
4. You should see successful completion messages. The script creates secure tables and Row Level Security policies.

## 3. Set the live-site address

1. Go to **Authentication > URL Configuration**.
2. Put your deployed `.io` address in **Site URL**, such as `https://your-site.io`.
3. Add both `https://your-site.io` and `https://your-site.io/**` to Redirect URLs, then save.

## 4. Create the first administrator

1. Go to **Authentication > Users** and select **Add user**.
2. Create your own email address and a strong password. Select **Auto Confirm User** if that option is shown.
3. Copy that new user’s UUID from the user list.
4. Go back to **SQL Editor**, create a new query, replace `PASTE-USER-UUID-HERE` below, and run it:

```sql
update public.profiles
set display_name = 'Your name', role = 'admin'
where id = 'PASTE-USER-UUID-HERE';
```

Only this account can send alerts or manage members once the app is connected.

## 5. Get the two browser-safe connection values

1. Select **Connect** near the top of your Supabase dashboard, or open **Settings > API Keys**.
2. Copy the **Project URL** and the **Publishable key** (`sb_publishable_...`).
3. Do **not** copy or share a Secret key or the database password. They must never be put in the website.

## 6. Send me these two items

Reply with:

- Your deployed `.io` site address
- The Project URL and Publishable key

I will then replace the browser-only demo with Supabase sign-in, real-time alert delivery, persistent Confirm/Decline responses, and admin member management.

## What will work afterwards

- Alerts arrive immediately for signed-in members on different devices.
- Confirm/Decline is saved and appears for the administrator.
- Refreshing does not sign users out because Supabase keeps a secure session.
- The browser can buzz while the site is open.

For buzzing after a browser/app is closed, we can add web push notifications as a follow-up. That needs one additional notification-provider setup.
