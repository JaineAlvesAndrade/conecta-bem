export enum EventCategory {
  ENVIRONMENT = 'ENVIRONMENT',
  SOCIAL = 'SOCIAL',
  EDUCATION = 'EDUCATION',
  HEALTH = 'HEALTH',
  ANIMAL_WELFARE = 'ANIMAL_WELFARE',
  OTHER = 'OTHER'
}

export const EventCategoryLabels: Record<EventCategory, string> = {
  [EventCategory.ENVIRONMENT]: 'Meio Ambiente',
  [EventCategory.SOCIAL]: 'Social',
  [EventCategory.EDUCATION]: 'Educação',
  [EventCategory.HEALTH]: 'Saúde',
  [EventCategory.ANIMAL_WELFARE]: 'Bem-estar Animal',
  [EventCategory.OTHER]: 'Outro'
};

export interface Event {
  id: string;
  title: string;
  description: string;
  addressId: string;
  category: EventCategory;
  startsAt: string;
  endsAt: string;
  capacity: number;
  enrolledCount?: number;
  // Campos opcionais para compatibilidade com dados mockados
  organization?: string;
  location?: string;
  imageUrl?: string;
  urgent?: boolean;
  points?: number;
}