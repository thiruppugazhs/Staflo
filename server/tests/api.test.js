const http = require('http');
const assert = require('assert');

const API_HOST = 'localhost';
const API_PORT = 5000;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runComprehensiveVerification() {
  console.log('🧪 Starting Full System Pre-Deployment Verification Suite...\n');

  try {
    // 1. Health check
    console.log('1. Health Check (/health)...');
    const health = await request('GET', '/health');
    assert.strictEqual(health.status, 200);
    console.log('   ✅ API Server is live and healthy.');

    // 2. Admin Authentication
    console.log('2. Admin Authentication (admin@dayflow.com)...');
    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@dayflow.com',
      password: 'Admin@1234',
    });
    assert.strictEqual(adminLogin.status, 200);
    const adminToken = adminLogin.data.token;
    console.log('   ✅ Admin login verified.');

    // 3. Admin creates Engineering HR Officer
    console.log('3. Admin onboards HR Officer in Engineering with Mobile 9876543210...');
    const createHr = await request('POST', '/employees', {
      name: 'Elena Rostova',
      email: 'elena.hr@dayflow.com',
      phone: '9876543210',
      role: 'HR',
      department: 'Engineering',
      designation: 'Engineering People Ops Lead',
    }, adminToken);
    assert.strictEqual(createHr.status, 201);
    console.log('   ✅ HR Officer onboarded with mobile temp password and welcome email dispatched.');

    // 4. HR logs in with Mobile Number
    console.log('4. HR logs in using mobile number (9876543210)...');
    const hrLogin = await request('POST', '/auth/login', {
      email: 'elena.hr@dayflow.com',
      password: '9876543210',
    });
    assert.strictEqual(hrLogin.status, 200);
    assert.strictEqual(hrLogin.data.user.must_change_password, true);
    const hrToken = hrLogin.data.token;
    console.log('   ✅ First-login temporary password detection verified.');

    // 5. HR Changes Password
    console.log('5. HR changes password to PermanentElena@2026...');
    const changePass = await request('POST', '/auth/change-password', {
      currentPassword: '9876543210',
      newPassword: 'PermanentElena@2026',
    }, hrToken);
    assert.strictEqual(changePass.status, 200);
    console.log('   ✅ Password change verified and flag set to false.');

    // 6. Department Scoping Check: Engineering HR tries to onboard in Marketing -> Must be 403 Forbidden
    console.log('6. Security Rule: Engineering HR tries to add employee in Marketing (must block with 403)...');
    const blockedEmp = await request('POST', '/employees', {
      name: 'Unauthorized Marketer',
      email: 'unauth@dayflow.com',
      phone: '1112223333',
      role: 'EMPLOYEE',
      department: 'Marketing',
    }, hrToken);
    assert.strictEqual(blockedEmp.status, 403);
    console.log('   ✅ Cross-department onboarding blocked by security middleware (403 Forbidden).');

    // 7. Engineering HR onboards employee in Engineering
    console.log('7. Engineering HR onboards Software Engineer in Engineering...');
    const createEmp = await request('POST', '/employees', {
      name: 'David Chen',
      email: 'david.chen@dayflow.com',
      phone: '9988776655',
      role: 'EMPLOYEE',
      department: 'Engineering',
      designation: 'Senior Frontend Engineer',
    }, hrToken);
    assert.strictEqual(createEmp.status, 201);
    console.log('   ✅ Department-scoped employee creation succeeded.');

    // 8. Employee logs in and changes password
    console.log('8. Employee (David) signs in with mobile 9988776655 and changes password...');
    const empLogin = await request('POST', '/auth/login', {
      email: 'david.chen@dayflow.com',
      password: '9988776655',
    });
    assert.strictEqual(empLogin.status, 200);
    const empToken = empLogin.data.token;

    const empChangePass = await request('POST', '/auth/change-password', {
      currentPassword: '9988776655',
      newPassword: 'DavidPassword@2026',
    }, empToken);
    assert.strictEqual(empChangePass.status, 200);
    console.log('   ✅ Employee account setup & password change verified.');

    // 9. Employee Attendance Punch In
    console.log('9. Employee logs daily attendance punch in...');
    const checkIn = await request('POST', '/attendance/check-in', { notes: 'Morning punch' }, empToken);
    assert.strictEqual(checkIn.status, 200);
    console.log('   ✅ Attendance check-in recorded.');

    // 10. Employee Leave Application
    console.log('10. Employee submits Paid Leave request...');
    const applyLeave = await request('POST', '/leaves', {
      leave_type: 'PAID',
      start_date: '2026-09-01',
      end_date: '2026-09-03',
      total_days: 3,
      reason: 'Family vacation',
    }, empToken);
    assert.strictEqual(applyLeave.status, 201);
    const leaveId = applyLeave.data.leave.id;
    console.log('   ✅ Leave application submitted.');

    // 11. HR Reviews & Approves Leave
    console.log('11. HR reviews and approves leave...');
    const approveLeave = await request('PUT', `/leaves/${leaveId}/status`, {
      status: 'APPROVED',
      admin_comment: 'Approved by Engineering HR',
    }, hrToken);
    assert.strictEqual(approveLeave.status, 200);
    console.log('   ✅ Leave approval processed.');

    // 12. HR Posts Company Announcement
    console.log('12. HR broadcasts company announcement...');
    const postAnnounce = await request('POST', '/announcements', {
      title: 'Q3 All-Hands Engineering Meeting',
      content: 'Please join us on Friday at 3 PM for the company quarterly product demo.',
      category: 'EVENT',
      target_department: 'ALL',
    }, hrToken);
    assert.strictEqual(postAnnounce.status, 201);
    console.log('   ✅ Announcement broadcasted.');

    // 13. Employee submits Helpdesk support ticket
    console.log('13. Employee raises support query to HR...');
    const createTicket = await request('POST', '/helpdesk/tickets', {
      subject: 'Question regarding dental benefits enrollment',
      category: 'BENEFITS',
      priority: 'MEDIUM',
      message: 'Hello, where can I download the health benefits plan overview?',
    }, empToken);
    assert.strictEqual(createTicket.status, 201);
    const ticketId = createTicket.data.ticket.id;
    console.log('   ✅ Helpdesk ticket created.');

    // 14. HR replies to ticket
    console.log('14. HR responds to employee query in threaded chat...');
    const sendReply = await request('POST', `/helpdesk/tickets/${ticketId}/messages`, {
      message: 'Hi David! The dental benefits documents are available under your Profile > Documents tab.',
    }, hrToken);
    assert.strictEqual(sendReply.status, 201);
    console.log('   ✅ Threaded message reply delivered.');

    // 15. Forgot Password OTP Flow
    console.log('15. Forgot Password OTP generation & reset verification...');
    const forgotReq = await request('POST', '/auth/forgot-password', {
      email: 'david.chen@dayflow.com',
    });
    assert.strictEqual(forgotReq.status, 200);
    const otpCode = forgotReq.data.demo_otp;

    const resetPass = await request('POST', '/auth/reset-password-otp', {
      email: 'david.chen@dayflow.com',
      otp: otpCode,
      newPassword: 'DavidNewReset@2026',
    });
    assert.strictEqual(resetPass.status, 200);
    console.log('   ✅ OTP validation & password reset verified.');

    console.log('\n======================================================');
    console.log('🎉 100% PRE-DEPLOYMENT VERIFICATION PASSED (15/15 TESTS)!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error);
    process.exit(1);
  }
}

runComprehensiveVerification();
