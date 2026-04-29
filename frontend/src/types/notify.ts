// ==================== NOTIFICATION TYPES (notify schema) ====================

import type { User } from './auth';

// Notification
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 
  | 'Academic' 
  | 'Fee' 
  | 'Exam' 
  | 'General' 
  | 'Placement'
  | 'Library'
  | 'Hostel'
  | 'Attendance';

export interface Notification {
  id: number;
  user_id: number;
  user?: User;
  
  title: string;
  message: string;
  type: NotificationType;
  category?: NotificationCategory;
  
  // Link to action
  action_url?: string;
  action_text?: string;
  
  // Related entity
  related_type?: string;
  related_id?: number;
  
  // Status
  is_read: boolean;
  read_at?: string;
  
  // Timing
  sent_at?: string;
  expires_at?: string;
  
  // Delivery
  channels: NotificationChannel[];
  
  created_at?: string;
}

export type NotificationChannel = 'InApp' | 'Email' | 'SMS' | 'Push';

// Notification Preference
export interface NotificationPreference {
  id: number;
  user_id: number;
  
  category: NotificationCategory;
  
  in_app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
}

// Notification Template
export interface NotificationTemplate {
  id: number;
  name: string;
  code: string;
  
  title_template: string;
  message_template: string;
  
  type: NotificationType;
  category: NotificationCategory;
  
  default_channels: NotificationChannel[];
  
  is_active: boolean;
}

// Scheduled Notification
export interface ScheduledNotification {
  id: number;
  template_id?: number;
  template?: NotificationTemplate;
  
  title: string;
  message: string;
  
  // Recipients
  recipient_type: 'All' | 'Role' | 'Department' | 'Course' | 'Individual';
  recipient_role?: string;
  recipient_ids?: number[];
  
  // Schedule
  scheduled_at: string;
  timezone: string;
  
  // Status
  status: 'Pending' | 'Sent' | 'Failed' | 'Cancelled';
  sent_at?: string;
  
  // Results
  total_recipients?: number;
  successful_count?: number;
  failed_count?: number;
}

// Email Queue
export interface EmailQueue {
  id: number;
  to_email: string;
  to_name?: string;
  
  subject: string;
  body_html?: string;
  body_text?: string;
  
  from_email?: string;
  from_name?: string;
  
  reply_to?: string;
  
  status: 'Pending' | 'Sent' | 'Failed' | 'Bounced';
  
  priority: number;
  
  sent_at?: string;
  error_message?: string;
  
  created_at: string;
}

// SMS Queue  
export interface SmsQueue {
  id: number;
  phone_number: string;
  message: string;
  
  status: 'Pending' | 'Sent' | 'Failed';
  
  sent_at?: string;
  error_message?: string;
  
  created_at: string;
}

// Push Notification Token
export interface PushToken {
  id: number;
  user_id: number;
  
  token: string;
  device_type: 'Web' | 'iOS' | 'Android';
  device_name?: string;
  
  is_active: boolean;
  last_used_at?: string;
  
  created_at: string;
}

// Announcement (Broadcast)
export interface Announcement {
  id: number;
  title: string;
  content: string;
  
  // Target Audience
  target_type: 'All' | 'Role' | 'College' | 'Department' | 'Program' | 'Batch';
  target_roles?: string[];
  target_college_ids?: number[];
  target_department_ids?: number[];
  target_program_ids?: number[];
  
  // Schedule
  publish_at: string;
  expire_at?: string;
  
  // Status
  is_published: boolean;
  is_urgent: boolean;
  
  // Media
  attachment_url?: string;
  
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}
