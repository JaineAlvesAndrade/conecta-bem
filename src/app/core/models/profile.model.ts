export interface UserProfile {
  fullName: string;
  cpfCnpj: string;
  birthDate: string; // ISO date string, e.g. "1995-06-15"
  email: string;
  gender: Gender;
  phone: string;
  instagram: string;
  linkedin: string;
}

export interface UpdatePasswordPayload {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON_BINARY',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'
}