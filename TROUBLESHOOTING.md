# Troubleshooting Database Connection

## Issue: DNS Resolution Error (ENOTFOUND)

If you're getting `ENOTFOUND db.vwfrzzynuolmsfdbxphe.supabase.co`, try these solutions:

### 1. Check Supabase Project Status

1. Go to: https://supabase.com/dashboard/project/vwfrzzynuolmsfdbxphe
2. Verify the project is **active** (not paused)
3. If paused, click "Restore project"

### 2. Get the Correct Connection String

1. Go to: https://supabase.com/dashboard/project/vwfrzzynuolmsfdbxphe/settings/database
2. Look for **Connection string** section
3. Use the **URI** format (not the direct connection)
4. It should look like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

### 3. Try Connection Pooler URL

Supabase provides two connection types:
- **Direct connection**: `db.vwfrzzynuolmsfdbxphe.supabase.co:5432`
- **Connection pooler**: `aws-0-[region].pooler.supabase.com:6543` (recommended)

Update your `.env.local`:

```env
# Try the pooler URL instead
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:rvQGAMjkJ870rlJ5@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 4. Verify Network Connectivity

```bash
# Test DNS resolution
nslookup db.vwfrzzynuolmsfdbxphe.supabase.co

# Test connection
psql "postgresql://postgres:rvQGAMjkJ870rlJ5@db.vwfrzzynuolmsfdbxphe.supabase.co:5432/postgres"
```

### 5. Alternative: Use Supabase Client Instead

If direct PostgreSQL connection doesn't work, you can use Supabase's REST API:

```typescript
// Use Supabase client for queries instead of direct PostgreSQL
import { createClient } from '@supabase/supabase-js'
```

## Quick Fix: Get Fresh Connection String

1. Go to Supabase Dashboard → Settings → Database
2. Copy the **Connection string** (URI format)
3. Update `.env.local` with the new string
4. Try `npm run db:push` again

## Still Having Issues?

- Check Supabase status page: https://status.supabase.com/
- Verify your project hasn't been deleted
- Try creating a new Supabase project if needed
- Check firewall/proxy settings

