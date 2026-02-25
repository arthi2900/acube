# Storage Monitoring Feature - Implementation Guide

## Overview
The Storage Monitoring feature allows administrators to track file and database storage usage for all users in real-time. This feature provides comprehensive visibility into storage consumption across the system.

## Access
- **URL**: `/admin/storage`
- **Role Required**: Admin only
- **Navigation**: Admin Dashboard → Storage Monitoring card

## Features

### 1. Statistics Dashboard
Four key metrics displayed at the top:
- **Total Users**: Count of all users in the system
- **Total File Storage**: Sum of all file storage across users
- **Total Database Storage**: Sum of all database storage across users
- **Total Storage**: Combined file and database storage

### 2. User Storage Table
Detailed table showing per-user storage breakdown:
- Username
- Email
- Role (with color-coded badges)
- File Storage (formatted in Bytes/KB/MB/GB/TB)
- Database Storage (formatted in Bytes/KB/MB/GB/TB)
- Total Storage (formatted in Bytes/KB/MB/GB/TB)
- Last Calculated timestamp

### 3. Search Functionality
Search users by:
- Username
- Email
- Role

### 4. Real-Time Refresh
Manual refresh button to recalculate storage:
1. Calculates file storage from Supabase storage buckets
2. Recalculates database storage from all tables
3. Updates the display with fresh data

## How It Works

### File Storage Calculation
- Scans all Supabase storage buckets
- Identifies files belonging to each user
- Sums up file sizes per user
- Stores results in `storage_usage` table

### Database Storage Calculation
Calculates storage from user-related data in tables:
- `profiles`: User profile data
- `questions`: Questions created by user (created_by)
- `exams`: Exams created by teacher (teacher_id)
- `exam_attempts`: Student exam attempts (student_id)
- `exam_answers`: Student answers (via attempt_id)
- `question_papers`: Question papers created (created_by)
- `login_history`: User login records (user_id)
- `active_sessions`: Active user sessions (user_id)

Uses PostgreSQL's `pg_column_size()` function to calculate actual storage size.

### Storage Update Process
1. Admin clicks "Refresh Storage" button
2. Edge function `calculate-storage` is invoked
3. File storage is calculated for all users
4. Database storage is recalculated via RPC function
5. Results are stored in `storage_usage` table
6. UI refreshes to show updated data

**Important**: On first use, click "Refresh Storage" to populate initial data for all users.

## Database Schema

### storage_usage Table
```sql
CREATE TABLE storage_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  file_storage_bytes BIGINT,
  database_storage_bytes BIGINT,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id)
);
```

### RPC Functions
- `calculate_user_database_size(user_id)`: Calculate DB size for one user
- `get_all_users_storage()`: Get storage data for all users
- `update_user_storage_usage(user_id, file_bytes)`: Update storage record
- `recalculate_all_storage()`: Recalculate all users' storage

## Security
- All storage data protected by Row Level Security (RLS)
- Only admins can view and manage storage data
- Edge function requires admin authentication
- RPC functions verify admin role before execution

## Usage Tips

### Initial Setup
1. Navigate to Admin Dashboard
2. Click "Storage Monitoring" card
3. Click "Refresh Storage" to calculate initial data
4. Wait for calculation to complete (may take a few moments)

### Regular Monitoring
- Check storage data periodically
- Use search to find specific users
- Sort by total storage to identify high-usage users
- Monitor "Last Calculated" timestamp for data freshness

### Performance Considerations
- Storage calculation may take time for large datasets
- Avoid frequent refreshes (recommended: once per day)
- Search is client-side and instant
- Table loads quickly after initial calculation

## Troubleshooting

### No Data Showing
- **Solution**: Click "Refresh Storage" to calculate initial data
- Ensure you're logged in as admin
- Check browser console for errors
- First-time use requires manual refresh to populate data

### Calculation Takes Long Time
- Normal for systems with many users or large files
- Wait for completion (toast notification will appear)
- Don't refresh the page during calculation

### Storage Values Seem Incorrect
- File storage only counts files in Supabase storage buckets
- Database storage uses PostgreSQL's pg_column_size()
- Values are estimates, not exact disk usage
- Recalculate to get fresh data

### User Shows 0 Bytes Despite Having Data
- Click "Refresh Storage" to recalculate
- Ensure the user has created content (questions, exams, etc.)
- Check that the user_id matches in the database
- Verify the calculate_user_database_size function is working

## Technical Details

### File Storage
- Calculated by edge function `calculate-storage`
- Scans all buckets in Supabase storage
- Groups files by user_id folder structure
- Sums metadata.size for all files

### Database Storage
- Calculated by RPC function `calculate_user_database_size`
- Uses pg_column_size() on all user-related rows
- Includes overhead from PostgreSQL storage
- Aggregates across multiple tables

### Display Formatting
- Bytes: 0-1023 bytes
- KB: 1024 bytes - 1 MB
- MB: 1 MB - 1 GB
- GB: 1 GB - 1 TB
- TB: 1 TB and above

## Future Enhancements
Potential improvements for future versions:
- Automatic periodic recalculation
- Storage usage trends over time
- Storage quotas per user/role
- Email alerts for high storage usage
- Export storage reports to CSV
- Storage usage charts and graphs
