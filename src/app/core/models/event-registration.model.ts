export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'DISMISSED';

export interface EventRegistrationResponse {
  id: string;
  eventId: string;
  volunteerId: string;
  status: RegistrationStatus;
  justification: string | null;
  organizerFeedback: string | null;
  feedbackRating: number | null;
  feedbackCreatedAt: string | null;
  registeredAt: string;
  statusUpdatedAt: string;
}

export type NotificationType = 'pending_enrollment' | 'enrollment_changed';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  eventId: string;
  timestamp: string;
  read: boolean;
}
