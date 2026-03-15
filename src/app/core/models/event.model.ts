export interface Event {
  id: number;
  title: string;
  description: string;
  organization: string;
  location: string;
  date: string;
  hoursPerWeek: string;
  enrolledCount: number;
  maxEnrolled?: number;
  tags: string[];
  imageUrl: string;
  points: number;
  urgent?: boolean;
  category: string;
}