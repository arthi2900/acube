# Password Reset Guide

This application provides **two methods** for password reset to ensure users can always recover their accounts.

---

## Method 1: Self-Service Password Reset (Email-Based)

### How It Works:
1. User clicks **"Forgot Password?"** link on the login page
2. User enters their registered email address
3. System sends a password reset link to their email
4. User clicks the link in the email
5. User is redirected to the reset password page
6. User enters and confirms their new password
7. Password is updated and user can log in

### User Flow:
```
Login Page → Forgot Password → Enter Email → Check Email → 
Click Reset Link → Enter New Password → Login
```

### Important Notes:
- **Email Configuration Required**: This method requires proper SMTP configuration in Supabase
- **Email Delivery**: If emails are not being received, check:
  - Supabase email settings in the dashboard
  - SMTP configuration
  - Spam/junk folders
  - Email service provider settings

### Configuring Email in Supabase:
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Configure SMTP settings or use Supabase's email service
3. Customize the password reset email template
4. Test email delivery

---

## Method 2: Admin-Initiated Password Reset (Direct)

### How It Works:
1. Admin logs into the system
2. Admin navigates to **User Management** page
3. Admin finds the user who needs password reset
4. Admin clicks **"Reset Password"** button next to the user
5. System generates a secure random password (can be customized)
6. Admin clicks **"Reset Password"** to confirm
7. New password is displayed to admin
8. Admin copies the password and shares it with the user securely
9. User logs in with the new password

### User Flow:
```
Admin Dashboard → User Management → Find User → 
Reset Password → Copy New Password → Share with User → 
User Logs In
```

### Features:
- ✅ **No Email Required**: Works even if email is not configured
- ✅ **Instant Reset**: Password is changed immediately
- ✅ **Auto-Generated Password**: Secure 10-character password with special characters
- ✅ **Customizable**: Admin can modify the generated password before applying
- ✅ **Copy to Clipboard**: One-click copy for easy sharing
- ✅ **Secure Display**: Password shown only once to admin

### Security Considerations:
- Only administrators can reset passwords
- New password is displayed only once
- Admin should share password through secure channels (in-person, phone, encrypted message)
- Users should change the password after first login
- Password meets minimum security requirements (6+ characters)

---

## Which Method to Use?

### Use Self-Service (Method 1) When:
- Email system is properly configured
- User has access to their registered email
- You want users to reset passwords independently
- Automated process is preferred

### Use Admin-Initiated (Method 2) When:
- Email system is not configured or not working
- User doesn't have access to their email
- Immediate password reset is needed
- User is in direct contact with admin
- Educational institution setting where admin support is available

---

## Best Practices

### For Administrators:
1. **Verify User Identity**: Confirm the user's identity before resetting password
2. **Secure Communication**: Share passwords through secure channels only
3. **Document Resets**: Keep track of password reset requests
4. **Encourage Password Change**: Ask users to change password after first login
5. **Use Strong Passwords**: If customizing, ensure password is strong

### For Users:
1. **Keep Email Updated**: Ensure your registered email is accessible
2. **Check Spam Folder**: Password reset emails might go to spam
3. **Change Password**: Change admin-provided password after first login
4. **Use Strong Passwords**: Choose passwords with mix of characters
5. **Don't Share Passwords**: Keep your password confidential

---

## Troubleshooting

### Email Not Received (Method 1):
1. Check spam/junk folder
2. Verify email address is correct in your profile
3. Wait a few minutes (email delivery can be delayed)
4. Contact administrator to use Method 2 instead

### Admin Reset Not Working (Method 2):
1. Ensure you have admin privileges
2. Check browser console for errors
3. Verify Supabase connection is active
4. Try refreshing the page and attempting again

---

## Technical Implementation

### Self-Service Reset:
- Uses Supabase Auth `resetPasswordForEmail()` method
- Sends secure token via email
- Token expires after set time period
- Password updated via `updateUser()` method

### Admin-Initiated Reset:
- **Secure Edge Function Implementation**: Uses Supabase Edge Function with service role key
- **Authentication Flow**:
  1. Frontend sends request to `reset-user-password` Edge Function
  2. Edge Function verifies admin's JWT token
  3. Edge Function checks user has admin role in database
  4. Edge Function uses service role key to call `auth.admin.updateUserById()`
  5. Password updated securely on backend
- **Security Features**:
  - Service role key never exposed to frontend
  - Role-based access control enforced
  - All operations logged on backend
  - CORS headers configured for security
- **Why Edge Function?**: 
  - Admin API requires service role key (elevated privileges)
  - Service role key must never be in frontend code
  - Edge Function acts as secure backend proxy
  - Prevents "user not allowed" errors

---

## Common Issues and Solutions

### "User Not Allowed" Error:
**Problem**: This error occurs when trying to use admin API methods from frontend with anon key.

**Solution**: The system now uses a secure Edge Function that properly handles admin operations with the service role key on the backend. Make sure:
1. You are logged in as an admin
2. Your session is active (try logging out and back in)
3. The Edge Function is deployed (check Supabase dashboard)

### Edge Function Not Found:
**Problem**: Error calling `reset-user-password` function.

**Solution**: 
1. Verify the Edge Function is deployed in Supabase dashboard
2. Check Edge Functions logs for errors
3. Ensure your Supabase project has Edge Functions enabled

---

## Support

If you encounter issues with password reset:
1. Try the alternative method
2. Contact your system administrator
3. Check this guide for troubleshooting steps
4. Verify your account is approved and not suspended
