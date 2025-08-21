export class EventBoothResponseDto {
  id!: string;
  eventId!: string;
  exhibitorId!: string;
  uniqueCode!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  exhibitor?: {
    id: string;
    companyName: string;
    companyDescription?: string;
    logo?: string;
    email?: string;
    mobile?: string;
    uen?: string;
  };
}

export class CreateEventBoothDto {
  eventId!: string;
  exhibitorId!: string;
}
