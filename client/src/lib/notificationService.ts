import { supabase } from './supabase';

export interface NotificationPayload {
  user_id?: string | null;
  type: 'admin_application' | 'faculty_application' | 'recommendation' | 'mapping' | 'interview' | 'selection' | 'rejection' | 'system';
  title: string;
  message: string;
  related_job_id?: string | null;
  related_application_id?: string | null;
}

// Native HTML5 BroadcastChannel for zero-latency cross-tab realtime messaging
export const nativeBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('udyoog_native_notifications')
  : null;

// Global Supabase broadcast channel fallback
export const realtimeNotificationChannel = supabase.channel('udyoog_realtime_notifications');

/**
 * Creates and dispatches a notification across local event buses and remote databases
 */
export async function sendNotification(payload: NotificationPayload) {
  try {
    const notifObj = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      user_id: payload.user_id || null,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      related_job_id: payload.related_job_id || null,
      related_application_id: payload.related_application_id || null,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // 1. Save to Global LocalStorage Queue (so every tab reads & syncs instantly)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('udyoog_global_notif_queue');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(notifObj);
        localStorage.setItem('udyoog_global_notif_queue', JSON.stringify(list.slice(0, 50)));
      } catch (err) {}

      // 2. Dispatch same-window CustomEvent
      window.dispatchEvent(new CustomEvent('udyoog_notification_event', { detail: notifObj }));

      // 3. Dispatch native cross-tab BroadcastChannel event
      if (nativeBroadcastChannel) {
        nativeBroadcastChannel.postMessage(notifObj);
      }
    }

    // 4. Insert into Supabase notifications table (if table exists)
    try {
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

      if (!error && data) {
        Object.assign(notifObj, data);
      }
    } catch (e) {}

    // 5. Try Supabase Realtime WebSocket broadcast
    try {
      realtimeNotificationChannel.send({
        type: 'broadcast',
        event: 'new_notification',
        payload: notifObj
      });
    } catch (e) {}

    return notifObj;
  } catch (err: any) {
    console.error('Notification dispatch error:', err.message);
  }
}

/**
 * 1. STUDENT APPLIES
 * Notifies Admins and Faculty when a student submits an application
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
    // Direct Broadcast to Admin Portal
    await sendNotification({
      user_id: null,
      type: 'admin_application',
      title: 'New application received',
      message: `${studentName} applied for ${jobTitle} at ${companyName}`,
      related_job_id: jobId
    });

    // Direct Broadcast to Faculty Portal
    await sendNotification({
      user_id: null,
      type: 'faculty_application',
      title: 'New student application',
      message: `${studentName} from ${department || 'General'} applied for ${jobTitle} at ${companyName}`,
      related_job_id: jobId
    });
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
