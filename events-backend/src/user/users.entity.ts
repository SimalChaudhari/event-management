import { EventAgenda } from 'agenda/agenda.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { Order } from 'order/order.entity';
import { AddressEntity } from './address.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToMany,
} from 'typeorm';

export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Speaker = 'speaker',
  Exhibitor = 'exhibitor',
  Moderator = 'moderator',
}
export enum AuthProvider {
  LOCAL = 'local',
  OAUTH = 'oauth',
}
export enum Industry {
  Accounting = 'Accounting',
  AdministrationOfficeSupport = 'Administration & Office Support',
  AdvertisingArtsMedia = 'Advertising, Arts & Media',
  BankingFinancialServices = 'Banking & Financial Services',
  CallCentreCustomerService = 'Call Centre & Customer Service',
  CommunityServicesDevelopment = 'Community Services & Development',
  Construction = 'Construction',
  ConsultingStrategy = 'Consulting & Strategy',
  DesignArchitecture = 'Design & Architechture',
  EducationTraining = 'Education & Training',
  Engineering = 'Engineering',
  FarmingAnimalsConservation = 'Farming, Animals & Conservation',
  GovernmentDefence = 'Government & Defence',
  HealthcareMedical = 'Healthcare & Medical',
  HospitalityTourism = 'Hospitality & Tourism',
  HumanResourcesRecruitment = 'Human Resources & Recruitment',
  InformationCommunicationTechnology = 'Information & Communication Technology',
  InsuranceSuperannuation = 'Insurance & Superannuation',
  Legal = 'Legal',
  ManufacturingTransportLogistics = 'Manufacturing, Transport & Logistics',
  MarketingCommunications = 'Marketing & Communications',
  MiningResourcesEnergy = 'Mining, Resources & Energy',
  RealEstateProperty = 'Real Estate & Property',
  RetailConsumerProducts = 'Retail & Consumer Products',
  Sales = 'Sales',
  ScienceTechnology = 'Science & Technology',
  SportRecreation = 'Sport & Recreation',
  TradesServices = 'Trades & Services',
  Others = 'Others',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  firstName!: string; // Updated field

  @Column({ type: 'varchar' })
  lastName!: string; // Updated field

  @Column({ type: 'varchar', unique: true })
  email!: string; // Updated field

  @Column()
  password!: string; // Updated field

  @Column({ nullable: true })
  mobile?: string; // Updated field - Made optional for social login

  @Column({ nullable: true })
  salutation?: string; // Mr., Mrs., Dr., etc.

  @Column({ nullable: true })
  company?: string; // Company/Organization name

  @Column({
    type: 'enum',
    enum: Industry,
    nullable: true,
  })
  industry?: Industry; // Industry sector

  @Column({ nullable: true })
  designation?: string; // Job designation/title

  @Column({
    type: 'enum',
    enum: UserRole,
    // default: UserRole.Admin,
  })
  role?: UserRole;

  @Column({ default: false })
  isMember!: boolean; // Updated field

  @Column({ default: false })
  biometricEnabled!: boolean; // Updated field

  @Column({ nullable: true })
  countryCurrency?: string; // Updated field

  @Column({ nullable: true, type: 'text' })
  profilePicture?: string; // Updated field

  @Column({ nullable: true, type: 'text' })
  linkedinProfile?: string; // Updated field

  @Column({ nullable: true })
  resetToken?: string; // Updated field

  @Column({ nullable: true, type: 'timestamp' })
  resetTokenExpiry?: Date; // Updated field

  @Column({ default: false })
  isVerify!: boolean; // Updated field

  @Column({ nullable: true })
  otp?: string; // Updated field

  @Column({ nullable: true, type: 'timestamp' })
  otpExpiry?: Date; // Updated field



  @Column({ nullable: true })
  refreshToken?: string; // Add this field

  // Optional field for Terms & Conditions acceptance
  @Column({ nullable: true, default: false })
  acceptTerms!: boolean;

  // Social Login Fields
  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  authProvider!: AuthProvider;

  @Column({ nullable: true })
  socialId?: string; // ID from social provider

  @Column({ nullable: true })
  socialAccessToken?: string; // Access token from social provider

  @Column({ nullable: true })
  socialRefreshToken?: string; // Refresh token from social provider

  @Column({ nullable: true })
  socialTokenExpiry?: Date; // Token expiry from social provider

  @Column({ default: true })
  isActive!: boolean; // User account active status

  // Speaker-specific fields - now in separate SpeakerProfile entity
  // companyName, position, description moved to speaker_profiles table

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders?: Order[];

  @OneToMany(() => FavoriteEvent, (favoriteEvent) => favoriteEvent.user)
  favoriteEvents?: FavoriteEvent[];

  // Speaker relationship - when user has Speaker role
  @OneToMany('EventSpeaker', 'speaker')
  eventSpeakers?: any[];

  // Speaker profile relationship - one-to-one with SpeakerProfile
  @OneToOne('SpeakerProfile', 'user')
  speakerProfile?: any;

  // Exhibitor relationship - when user has Exhibitor role
  @OneToMany('Exhibitor', 'user')
  exhibitorProfile?: any[];

  @OneToMany(() => EventAgenda, (agenda) => agenda.user)
  agendas?: EventAgenda[];

  // Programme sessions relationship - speakers can be tagged to sessions
  @ManyToMany('ProgrammeSession', 'speakers')
  programmeSessions?: any[];

  // Address relationship - one user can have multiple addresses
  @OneToMany(() => AddressEntity, (address) => address.user)
  addresses?: AddressEntity[];

  // Moderator relationship - when user has Moderator role
  @OneToMany('ModeratorEvent', 'moderator')
  moderatorEvents?: any[];
  
}
