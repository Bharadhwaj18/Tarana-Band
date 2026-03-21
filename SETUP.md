# Tarana Website - Setup Guide

## Welcome! 🎸

Your Tarana band website is almost ready. Follow these steps to get everything configured and running.

## Step 1: Quick Start

Starting the development server:
```bash
npm run dev
```
Then visit `http://localhost:3000`

## Step 2: Set Up Supabase (Database & Authentication)

### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click "New Project"
3. Choose your organization, database name (e.g., "tarana"), and region
4. Create the project (this takes a minute)

### Get Your API Keys
1. Go to Project Settings (gear icon)
2. Copy your **Project URL** and **Anon Key**
3. Add these to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### Enable Email Authentication
1. In Supabase, go to **Authentication > Providers**
2. Enable **Email** and **Email OTP** (for password-free login)
3. Go to **Authentication > Users**
4. Click "Invite" and add your admin email

## Step 3: Create Database Tables

In Supabase console, go to **SQL Editor** and run these commands:

### Band Members
```sql
CREATE TABLE band_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL,
  image_url TEXT,
  order_position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Tours
```sql
CREATE TABLE tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  venue_name TEXT NOT NULL,
  city TEXT NOT NULL,
  ticket_link TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming',
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Merchandise
```sql
CREATE TABLE merchandise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  price DECIMAL(10, 2) NOT NULL,
  external_link TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Videos
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  video_type TEXT DEFAULT 'youtube',
  is_featured BOOLEAN DEFAULT false,
  order_position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Contact Submissions
```sql
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT now()
);
```

## Step 4: Set Up Email (Resend)

1. Go to [resend.com](https://resend.com) and sign up (free)
2. Copy your **API Key**
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=your_resend_api_key
   ADMIN_EMAIL=your@email.com
   ```

**Note:** The free plan supports personalized emails from `onboarding@resend.dev`. Contact submissions will be forwarded to your admin email.

## Step 5: Google Analytics

1. Go to [google.com/analytics](https://google.com/analytics)
2. Set up a new property for your website
3. Copy your **Measurement ID** (looks like `G-XXXXXXXXXX`)
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GA_ID=your_measurement_id
   ```

## Step 6: Set Up Tailwind Colors

Update `tailwind.config.ts` with your brand colors:

```typescript
colors: {
  primary: "#YOUR_PRIMARY_COLOR",
  secondary: "#YOUR_SECONDARY_COLOR",
}
```

Also update `app/globals.css`:
```css
:root {
  --primary: #YOUR_PRIMARY_COLOR;
  --secondary: #YOUR_SECONDARY_COLOR;
}
```

## Step 7: Environmental Variables Summary

Your `.env.local` should look like:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Resend Email
RESEND_API_KEY=re_xxx
ADMIN_EMAIL=admin@tarana.band

# Google Analytics
NEXT_PUBLIC_GA_ID=G-xxx
```

## Accessing the Admin Panel

### Login
1. Visit `http://localhost:3000/admin`
2. You'll be redirected to `/admin/login`
3. Sign in with your email and password (use the one you created in Supabase)
4. You'll see the admin dashboard

### Managing Content
- **Band Members:** Add all 7 members with photos and bios
- **Tours:** Add upcoming tour dates with ticket links
- **Merchandise:** Add products with external shop links
- **Videos:** Add YouTube links or self-hosted video URLs
- **Contact Messages:** View all messages sent through the contact form

## File Structure

```
/app
  ├── page.tsx              # Homepage
  ├── about/page.tsx        # About Us with band members
  ├── tours/page.tsx        # Tour dates
  ├── merch/page.tsx        # Merchandise
  ├── videos/page.tsx       # Videos gallery
  ├── contact/page.tsx      # Contact form
  ├── api/contact/route.ts  # Contact form API
  └── admin/
      ├── login/page.tsx    # Admin login
      ├── dashboard/page.tsx # Admin dashboard
      ├── members/page.tsx   # Manage band members
      ├── tours/page.tsx     # Manage tours
      ├── merch/page.tsx     # Manage merchandise
      └── videos/page.tsx    # Manage videos

/components
  ├── Navigation.tsx        # Main navigation
  ├── Footer.tsx           # Footer
  └── AdminLayout.tsx      # Admin panel layout

/lib
  └── supabase.ts          # Supabase client setup
```

## Deployment on Vercel

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repo
4. Add environment variables (from `.env.local`)
5. Deploy!

### Point Your Domain
1. Get your domain (Squier, GoDaddy, etc.)
2. In Vercel, update your domain settings
3. It should be live!

## Customization

### Update Brand Colors
Edit `tailwind.config.ts` and `app/globals.css` with your colors

### Update Typography
Change fonts in `app/layout.tsx` - currently using:
- Display: Righteous (bold headings)
- Body: Poppins (readable copy)

### Update Social Links
Edit `components/Footer.tsx` to add your actual social media URLs

### Update Contact Email
Change `ADMIN_EMAIL` in `.env.local`

## Testing Your Website

1. Visit homepage: `http://localhost:3000`
2. Navigate all public pages
3. Test contact form on `/contact`
4. Check admin panel: `/admin`
5. Add sample data through admin panel
6. Verify data appears on public pages

## Troubleshooting

### "Supabase keys not found"
- Make sure `.env.local` has correct values
- Restart dev server after editing env files

### Contact form not sending
- Check `RESEND_API_KEY` is valid
- Check `ADMIN_EMAIL` is set
- Verify Resend account is active

### Admin panel login not working
- Ensure you created an auth user in Supabase
- Check email/password are correct

### Images not loading
- Ensure image URLs are complete (https://...)
- Check Supabase storage is configured if using that

## Next Steps

1. ✅ Set up Supabase database
2. ✅ Configure Resend for emails
3. ✅ Add Google Analytics
4. ✅ Update brand colors/fonts
5. ✅ Add all band member info in admin
6. ✅ Add tour dates
7. ✅ Add merchandise
8. ✅ Upload videos
9. ✅ Test all forms
10. ✅ Deploy to Vercel

## Support

If you get stuck:
1. Check error messages in browser console (F12)
2. Check terminal for server errors
3. Verify all environment variables are set
4. Make sure all database tables exist

Good luck! 🎸🎵
