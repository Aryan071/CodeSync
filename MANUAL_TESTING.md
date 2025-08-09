# 🧪 Manual Testing Guide for CodeSync

This guide provides step-by-step instructions for manually testing all features of CodeSync.

## Prerequisites

Before testing, ensure you have:
- ✅ CodeSync running locally or in development environment
- ✅ Multiple browser tabs/windows for collaboration testing
- ✅ Different browsers for cross-browser testing

## Getting Started

### 1. Start the Application

```bash
# Option 1: Using Docker (Recommended)
npm run docker:dev

# Option 2: Local development
npm run dev

# Wait for both services to start
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### 2. Access the Application

Open your browser and navigate to: `http://localhost:3000`

---

## Test Scenarios

### 🔐 **Authentication Testing**

#### **Test 1: User Registration**

**Steps:**
1. Navigate to `http://localhost:3000`
2. Click "Get Started" or "Sign Up"
3. Fill in the registration form:
   - Username: `testuser1`
   - Email: `testuser1@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click "Create Account"

**Expected Results:**
- ✅ Form validation works for all fields
- ✅ Password confirmation validation
- ✅ Email format validation
- ✅ Successful registration redirects to dashboard
- ✅ Welcome message displayed

#### **Test 2: User Login**

**Steps:**
1. If logged in, logout first
2. Go to login page
3. Enter credentials:
   - Email: `testuser1@example.com`
   - Password: `password123`
4. Click "Sign In"

**Expected Results:**
- ✅ Successful login redirects to dashboard
- ✅ User information displayed in header
- ✅ JWT token stored in localStorage

#### **Test 3: Form Validation**

**Steps:**
1. Try registering with:
   - Short username (< 3 characters)
   - Invalid email format
   - Short password (< 6 characters)
   - Mismatched password confirmation

**Expected Results:**
- ✅ Appropriate error messages shown
- ✅ Form submission prevented
- ✅ Error messages clear after fixing

#### **Test 4: Password Visibility Toggle**

**Steps:**
1. On login/register form
2. Click the eye icon next to password fields

**Expected Results:**
- ✅ Password visibility toggles
- ✅ Icon changes between eye/eye-slash
- ✅ Both password fields work independently (register)

---

### 🏠 **Dashboard Testing**

#### **Test 5: Dashboard Overview**

**Steps:**
1. Login and observe dashboard
2. Check all sections are displayed

**Expected Results:**
- ✅ Greeting message with username
- ✅ Statistics cards (Total, Owned, Collaborating rooms)
- ✅ Room list or empty state
- ✅ Search functionality
- ✅ Filter buttons (All, Owned, Collaborating)

#### **Test 6: Room Creation**

**Steps:**
1. Click "New Room" or "Create Your First Room"
2. Fill in room details:
   - Name: `Test Project`
   - Description: `Testing room creation`
   - Language: `JavaScript`
   - Max Collaborators: `5`
   - Check "Make room public"
3. Click "Create Room"

**Expected Results:**
- ✅ Modal opens properly
- ✅ Form validation works
- ✅ Room created successfully
- ✅ Redirected to editor after creation
- ✅ Success notification displayed

#### **Test 7: Room Management**

**Steps:**
1. Create multiple rooms
2. Test search functionality
3. Test filter buttons
4. Click on different rooms

**Expected Results:**
- ✅ Search filters rooms correctly
- ✅ Filter buttons work (All/Owned/Collaborating)
- ✅ Room cards display correct information
- ✅ Clicking room opens editor

---

### 📝 **Editor Testing**

#### **Test 8: Editor Interface**

**Steps:**
1. Open a room
2. Observe editor layout

**Expected Results:**
- ✅ File tree on left side
- ✅ Monaco editor in center
- ✅ Header with room name and controls
- ✅ User count and connection status
- ✅ Resizable panels

#### **Test 9: File Operations**

**Steps:**
1. Right-click in file tree
2. Create new file: `index.js`
3. Create new folder: `components`
4. Create file inside folder: `components/Header.jsx`
5. Try renaming files
6. Try deleting files

**Expected Results:**
- ✅ Context menu appears
- ✅ Files/folders created successfully
- ✅ Nested structure works
- ✅ Rename functionality works
- ✅ Delete confirmation works
- ✅ File tree updates in real-time

#### **Test 10: Code Editing**

**Steps:**
1. Click on a file in file tree
2. Start typing code
3. Test various editor features:
   - Syntax highlighting
   - Auto-completion
   - Bracket matching
   - Multi-line editing

**Expected Results:**
- ✅ File opens in editor
- ✅ Syntax highlighting works
- ✅ Code completion suggestions appear
- ✅ Editor responsive to all inputs
- ✅ File content saves automatically

#### **Test 11: Editor Tabs**

**Steps:**
1. Open multiple files
2. Switch between tabs
3. Close tabs using X button
4. Observe tab behavior

**Expected Results:**
- ✅ Tabs appear for open files
- ✅ Active tab highlighted
- ✅ Tab switching works
- ✅ Tab closing works
- ✅ File icons display correctly

---

### 🤝 **Real-time Collaboration Testing**

#### **Test 12: Multi-User Collaboration**

**Steps:**
1. Open room in Browser Tab 1 (User 1)
2. Copy room URL
3. Open new incognito window (Browser Tab 2)
4. Register/login as different user (User 2)
5. Navigate to same room URL
6. Both users should be in same room

**Expected Results:**
- ✅ Both users see each other in user list
- ✅ User count shows "2"
- ✅ Connection status shows "Connected"

#### **Test 13: Real-time Text Editing**

**Steps:**
1. User 1: Open a file and start typing
2. User 2: Observe the same file
3. User 2: Start typing in different location
4. Both users continue editing

**Expected Results:**
- ✅ Text appears instantly for other user
- ✅ No text conflicts or overwrites
- ✅ Both users can edit simultaneously
- ✅ Operational transformation works smoothly

#### **Test 14: Cursor Tracking**

**Steps:**
1. Both users in same file
2. Move cursors around
3. Make selections
4. Observe each other's cursors

**Expected Results:**
- ✅ User cursors visible with different colors
- ✅ Cursor positions update in real-time
- ✅ User names displayed near cursors
- ✅ Selections visible as colored highlights

#### **Test 15: File Synchronization**

**Steps:**
1. User 1: Create new file
2. User 2: Observe file tree
3. User 1: Delete a file
4. User 2: Observe changes
5. User 2: Rename a file
6. User 1: Observe changes

**Expected Results:**
- ✅ File operations sync instantly
- ✅ File tree updates for all users
- ✅ No lag or delay in synchronization

#### **Test 16: User Join/Leave**

**Steps:**
1. Start with User 1 in room
2. User 2 joins room
3. User 3 joins room
4. User 2 leaves room (closes tab)
5. User 3 remains

**Expected Results:**
- ✅ "User joined" notifications
- ✅ User count updates correctly
- ✅ "User left" notifications
- ✅ User list updates in real-time

---

### 🎨 **UI/UX Testing**

#### **Test 17: Theme Switching**

**Steps:**
1. Click theme toggle button (sun/moon icon)
2. Switch between light and dark themes
3. Navigate to different pages

**Expected Results:**
- ✅ Theme changes immediately
- ✅ All components adapt to theme
- ✅ Theme persists across page refreshes
- ✅ Editor theme changes accordingly

#### **Test 18: Responsive Design**

**Steps:**
1. Test on desktop (1920x1080)
2. Test on tablet (768x1024)
3. Test on mobile (375x667)
4. Resize browser window

**Expected Results:**
- ✅ Layout adapts to screen size
- ✅ File tree collapsible on mobile
- ✅ Touch interactions work
- ✅ No horizontal scrolling

#### **Test 19: Animations and Feedback**

**Steps:**
1. Observe page transitions
2. Watch loading states
3. Check button hover effects
4. Notice notification toasts

**Expected Results:**
- ✅ Smooth page transitions
- ✅ Loading spinners during operations
- ✅ Interactive feedback on buttons
- ✅ Success/error notifications work

---

### 🔒 **Security Testing**

#### **Test 20: Authentication Protection**

**Steps:**
1. Try accessing `/dashboard` without login
2. Try accessing `/editor/room-id` without login
3. Logout and try accessing protected routes

**Expected Results:**
- ✅ Redirected to login page
- ✅ Cannot access protected routes
- ✅ Proper authentication flow

#### **Test 21: Room Access Control**

**Steps:**
1. Create private room as User 1
2. Try accessing as User 2 (not invited)
3. Test public room access
4. Test room permissions

**Expected Results:**
- ✅ Private rooms require permission
- ✅ Public rooms accessible to all
- ✅ Appropriate error messages

---

### 🚀 **Performance Testing**

#### **Test 22: Load Time Testing**

**Steps:**
1. Open developer tools (F12)
2. Go to Network tab
3. Refresh page and measure load times
4. Test with slow network (throttling)

**Expected Results:**
- ✅ Page loads in < 3 seconds
- ✅ Works on slow connections
- ✅ Progressive loading

#### **Test 23: Memory Usage**

**Steps:**
1. Open Task Manager/Activity Monitor
2. Use application for extended period
3. Create/delete many files
4. Monitor memory usage

**Expected Results:**
- ✅ No memory leaks
- ✅ Stable memory usage
- ✅ Good performance over time

#### **Test 24: Large File Handling**

**Steps:**
1. Create file with 1000+ lines of code
2. Edit the large file
3. Test real-time collaboration with large files

**Expected Results:**
- ✅ Editor handles large files smoothly
- ✅ No lag during editing
- ✅ Collaboration still responsive

---

### 🌐 **Cross-Browser Testing**

#### **Test 25: Browser Compatibility**

**Browsers to Test:**
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Test on each browser:**
1. Complete authentication flow
2. Create and edit files
3. Test real-time collaboration
4. Check all UI components

**Expected Results:**
- ✅ Consistent behavior across browsers
- ✅ No browser-specific issues
- ✅ Same visual appearance

---

### 🐛 **Error Handling Testing**

#### **Test 26: Network Disconnection**

**Steps:**
1. Start editing a file
2. Disconnect network (airplane mode)
3. Continue typing
4. Reconnect network

**Expected Results:**
- ✅ "Disconnected" status shown
- ✅ Changes queued locally
- ✅ Auto-reconnection works
- ✅ Changes sync after reconnection

#### **Test 27: Server Errors**

**Steps:**
1. Stop backend server
2. Try performing operations
3. Restart server
4. Check error handling

**Expected Results:**
- ✅ Appropriate error messages
- ✅ Graceful degradation
- ✅ Recovery after server restart

---

## Test Completion Checklist

### 🔐 Authentication
- [ ] User registration works
- [ ] User login works
- [ ] Form validation works
- [ ] Password visibility toggle works
- [ ] Logout works

### 🏠 Dashboard
- [ ] Dashboard loads correctly
- [ ] Room creation works
- [ ] Room search/filter works
- [ ] Statistics display correctly
- [ ] Room navigation works

### 📝 Editor
- [ ] Editor interface loads
- [ ] File operations work
- [ ] Code editing works
- [ ] Editor tabs work
- [ ] Syntax highlighting works

### 🤝 Collaboration
- [ ] Multi-user access works
- [ ] Real-time text editing works
- [ ] Cursor tracking works
- [ ] File synchronization works
- [ ] User join/leave works

### 🎨 UI/UX
- [ ] Theme switching works
- [ ] Responsive design works
- [ ] Animations work
- [ ] Loading states work

### 🔒 Security
- [ ] Route protection works
- [ ] Room access control works
- [ ] Authentication required

### 🚀 Performance
- [ ] Good load times
- [ ] No memory leaks
- [ ] Large file handling

### 🌐 Cross-Browser
- [ ] Chrome works
- [ ] Firefox works
- [ ] Safari works
- [ ] Edge works

### 🐛 Error Handling
- [ ] Network errors handled
- [ ] Server errors handled
- [ ] Recovery mechanisms work

---

## Reporting Issues

When you find a bug during testing:

1. **Document the Issue:**
   - What were you trying to do?
   - What happened instead?
   - What should have happened?

2. **Steps to Reproduce:**
   - List exact steps to recreate the issue
   - Include any relevant data/inputs

3. **Environment Details:**
   - Browser and version
   - Operating system
   - Screen resolution
   - Network conditions

4. **Screenshots/Videos:**
   - Capture visual evidence
   - Record screen for complex interactions

5. **Console Errors:**
   - Check browser console (F12)
   - Include any error messages

---

## 🎉 Testing Complete!

Once you've completed all tests and verified the checklist:

✅ **CodeSync is ready for production!**

The application has been thoroughly tested and is ready to showcase to potential employers or deploy to production.

---

**Happy Testing! 🚀**
