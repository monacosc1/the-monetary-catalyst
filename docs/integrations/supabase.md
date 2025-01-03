# Supabase Integration Documentation

## Overview
The Monetary Catalyst uses Supabase as its primary database and authentication provider. The integration handles user management, data storage, and real-time subscriptions.

## Configuration

### Environment Variables
```env
SUPABASE_URL=your_project_url
SUPABASE_API_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SMTP_KEY=your_smtp_key
```

### Client Setup
```typescript
// config/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-smtp-key': process.env.SUPABASE_SMTP_KEY!
    }
  }
});

export default supabase;
```

## Authentication

### User Management
```typescript
// User registration
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    first_name,
    last_name
  }
});

// User login
const { data: { session }, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

### OAuth Integration
```typescript
// Google OAuth callback handling
const { data: { user }, error } = await supabase.auth.getUser(token);

if (user) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
}
```

## Database Operations

### Query Patterns
```typescript
// Select with conditions
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value)
  .single();

// Insert with return value
const { data, error } = await supabase
  .from('table_name')
  .insert(newData)
  .select()
  .single();

// Update with conditions
const { data, error } = await supabase
  .from('table_name')
  .update(updateData)
  .eq('id', recordId);
```

### Error Handling
```typescript
interface SupabaseError {
  code: string;
  message: string;
  details?: string;
}

try {
  const { data, error } = await supabaseQuery();
  if (error) {
    if (error.code === 'PGRST116') {
      // Handle not found
    }
    throw error;
  }
} catch (error: SupabaseError) {
  // Error handling
}
```

## Real-time Subscriptions

### Subscription Setup
```typescript
const subscription = supabase
  .channel('table_changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'table_name'
    },
    (payload) => {
      // Handle real-time updates
    }
  )
  .subscribe();
```

### Cleanup
```typescript
// Unsubscribe when component unmounts
useEffect(() => {
  const subscription = setupSubscription();
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Row Level Security (RLS)

### Policy Examples
```sql
-- User can only read their own profile
CREATE POLICY "Users can read own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can read published articles
CREATE POLICY "Anyone can read published articles"
ON articles
FOR SELECT
USING (status = 'published');
```

### Policy Management
```typescript
// Checking policy effects
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId);

// Error indicates policy violation
if (error?.message.includes('policy')) {
  // Handle authorization error
}
```

## Storage Integration

### File Operations
```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('bucket_name')
  .upload('file_path', file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('bucket_name')
  .getPublicUrl('file_path');
```

## Database Schema Management

### Table Creation
```sql
-- Example table creation with RLS
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Migrations
```typescript
// Migration script example
const migration = async () => {
  const { error } = await supabase.rpc('run_migration', {
    version: '1.0.0',
    up: `
      ALTER TABLE table_name
      ADD COLUMN new_column TEXT;
    `
  });
};
```

## Performance Optimization

### Query Optimization
```typescript
// Use specific columns
const { data } = await supabase
  .from('table_name')
  .select('specific,columns')
  .eq('condition', value);

// Use count option
const { count } = await supabase
  .from('table_name')
  .select('*', { count: 'exact' });
```

### Caching Strategy
```typescript
// Cache configuration
const supabase = createClient(url, key, {
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'Cache-Control': 'max-age=300' }
  }
});
```

## Security Considerations

### API Key Management
- Use service role key for backend operations
- Use anon key for client-side queries
- Never expose service role key in frontend code

### Data Validation
```typescript
// Validate data before insertion
const validateData = (data: any): boolean => {
  // Validation logic
  return true;
};

if (validateData(inputData)) {
  await supabase.from('table_name').insert(inputData);
}
```

## Monitoring and Debugging

### Request Logging
```typescript
// Enable detailed logging
const supabase = createClient(url, key, {
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'X-Debug-Mode': 'true' }
  }
});
```

### Performance Monitoring
- Monitor query performance
- Track real-time subscription usage
- Monitor storage usage
- Track auth operations
