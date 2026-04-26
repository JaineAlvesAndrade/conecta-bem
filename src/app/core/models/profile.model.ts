export interface UserProfile {
  fullName: string;
  cpfOrCnpj: string;
  birthDate: string; // ISO date string, e.g. "1995-06-15"
  email: string;
  gender: string;
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

export const GenderLabels = {
  [Gender.MALE]: 'Masculino',
  [Gender.FEMALE]: 'Feminino',
  [Gender.NON_BINARY]: 'Não binário',
  [Gender.OTHER]: 'Outro',
  [Gender.PREFER_NOT_TO_SAY]: 'Prefiro não informar'
};