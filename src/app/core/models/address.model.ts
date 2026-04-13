export interface Address {
  id: string;
  country: string;
  city: string;
  state: string;
  street: string;
  complement?: string;
  number: string;
  neighborhood: string;
  reference?: string;
  postalCode: string;
}

export interface CreateAddressPayload {
  country: string;
  city: string;
  state: string;
  street: string;
  complement?: string;
  number: string;
  neighborhood: string;
  reference?: string;
  postalCode: string;
}
