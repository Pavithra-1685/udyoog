import { supabase } from './supabase';

export interface NotificationPayload {
  user_id?: string | null;
  type: 'admin_application' | 'faculty_application' | 'recommendation' | 'mapping' | 'interview' | 'selection' | 'rejection' | 'system';
  title: string;
  message: string;
  related_job_id?: string | null;
  related_application_id?: string | null;
}

// Global broadcast channel for instant real-time events across browsers
export const realtimeNotificationChannel = supabase.channel('udyoog_realtime_notifications');
// Note: Listeners call .on() before .subscribe() to satisfy Supabase Realtime lifecycle

/**
 * Creates and persists a notification, broadcasting it in real time
 */
export async function sendNotification(payload: NotificationPayload) {
  try {
    // 1. Insert into Supabase notifications table
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: payload.user_id || null,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        related_job_id: payload.related_job_id || null,
        related_application_id: payload.related_application_id || null,
        is_read: false
      }])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Notification table insert info:', error.message);
    }

    // 2. Broadcast via Supabase Realtime channel so UI updates instantly without page refresh
    realtimeNotificationChannel.send({
      type: 'broadcast',
      event: 'new_notification',
      payload: data || {
        ...payload,
        id: 'temp-' + Date.now(),
        is_read: false,
        created_at: new Date().toISOString()
      }
    });

    return data;
  } catch (err: any) {
    console.error('Notification dispatch error:', err.message);
  }
}

/**
 * 1. STUDENT APPLIES
 * Notifies Admins and relevant Faculty when a student submits an application
 */
export async function notifyStudentApplied({
  studentId,
  studentName,
  department,
  jobTitle,
  companyName,
  jobId
}: {
  studentId: string;
  studentName: string;
  department: string;
  jobTitle: string;
  companyName: string;
  jobId: string;
}) {
  try {
    // Fetch Admins & Faculty user IDs
    const { data: staffProfiles } = await supabase
      .from('profiles')
      .select('user_id, role, branch')
      .in('role', ['admin', 'faculty']);

    const admins = staffProfiles?.filter(p => p.role === 'admin') || [];
    const facultyList = staffProfiles?.filter(p => p.role === 'faculty') || [];

    // Notify Admins
    for (const admin of admins) {
      await sendNotification({
        user_id: admin.user_id,
        type: 'admin_application',
        title: 'New application received',
        message: `${studentName} applied for ${jobTitle} at ${companyName}`,
        related_job_id: jobId
      });
    }

    // Fallback broadcast if no specific admins listed
    if (admins.length === 0) {
      await sendNotification({
        user_id: null,
        type: 'admin_application',
        title: 'New application received',
        message: `${studentName} applied for ${jobTitle} at ${companyName}`,
        related_job_id: jobId
      });
    }

    // Notify Faculty (Matching department or all faculty)
    const targetFaculty = facultyList.filter(f => !f.branch || f.branch === department || department.toLowerCase().includes((f.branch || '').toLowerCase()));
    const finalFaculty = targetFaculty.length > 0 ? targetFaculty : facultyList;

    for (const faculty of finalFaculty) {
      await sendNotification({
        user_id: faculty.user_id,
        type: 'faculty_application',
        title: 'New student application',
        message: `${studentName} from ${department || 'General'} applied for ${jobTitle} at ${companyName}`,
        related_job_id: jobId
      });
    }
  } catch (err: any) {
    console.error('Error sending student apply notification:', err);
  }
}

/**
 * 2. FACULTY RECOMMENDS STUDENT
 */
export async function notifyFacultyRecommended({
  studentId,
  jobTitle,
  companyName,
  jobId
}: {
  studentId: string;
  jobTitle: string;
  companyName: string;
  jobId?: string;
}) {
  return sendNotification({
    user_id: studentId,
    type: 'recommendation',
    title: 'Faculty Recommendation',
    message: `Your faculty has recommended you for ${jobTitle} at ${companyName}.`,
    related_job_id: jobId
  });
}

/**
 * 3. ADMIN MAPS STUDENT
 */
export async function notifyAdminMapped({
  studentId,
  jobTitle,
  companyName,
  jobId
}: {
  studentId: string;
  jobTitle: string;
  companyName: string;
  jobId?: string;
}) {
  return sendNotification({
    user_id: studentId,
    type: 'mapping',
    title: 'Application Mapped',
    message: `You have been mapped to ${jobTitle} at ${companyName} by the placement team.`,
    related_job_id: jobId
  });
}

/**
 * 4. INTERVIEW SCHEDULED
 */
export async function notifyInterviewScheduled({
  studentId,
  jobTitle,
  companyName,
  date,
  time,
  jobId
}: {
  studentId: string;
  jobTitle: string;
  companyName: string;
  date?: string;
  time?: string;
  jobId?: string;
}) {
  const timeDetails = date && time ? `is scheduled for ${date} at ${time}.` : 'has been scheduled.';
  return sendNotification({
    user_id: studentId,
    type: 'interview',
    title: 'Interview Scheduled',
    message: `Your interview for ${jobTitle} at ${companyName} ${timeDetails}`,
    related_job_id: jobId
  });
}

/**
 * 5. SELECTED & 6. REJECTED or Status Changes
 */
export async function notifyStatusChanged({
  studentId,
  status,
  jobTitle,
  companyName,
  jobId
}: {
  studentId: string;
  status: string;
  jobTitle: string;
  companyName: string;
  jobId?: string;
}) {
  const normStatus = status.toLowerCase();
  
  if (normStatus === 'selected' || normStatus === 'placed' || normStatus === 'offered') {
    return sendNotification({
      user_id: studentId,
      type: 'selection',
      title: '🎉 Congratulations!',
      message: `You have been selected for ${jobTitle} at ${companyName}.`,
      related_job_id: jobId
    });
  }

  if (normStatus === 'rejected') {
    return sendNotification({
      user_id: studentId,
      type: 'rejection',
      title: 'Application Status Updated',
      message: `Your application for ${jobTitle} at ${companyName} has been updated.`,
      related_job_id: jobId
    });
  }

  if (normStatus === 'interviewing' || normStatus === 'interview_scheduled') {
    return notifyInterviewScheduled({ studentId, jobTitle, companyName, jobId });
  }

  if (normStatus === 'faculty_recommended') {
    return notifyFacultyRecommended({ studentId, jobTitle, companyName, jobId });
  }
}
