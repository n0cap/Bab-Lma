import type {
  UserRole,
  Locale,
  ServiceType,
  OrderStatus,
  CleanType,
  TeamType,
  AssignmentStatus,
  OfferStatus,
  ActorRole,
} from './enums';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: UserRole;
  locale: Locale;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Professional {
  id: string;
  userId: string;
  skills: ServiceType[];
  bio: string | null;
  rating: number;
  totalSessions: number;
  reliability: number;
  zones: string[];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  clientId: string;
  serviceType: ServiceType;
  status: OrderStatus;
  floorPrice: number;
  finalPrice: number | null;
  tipAmount: number;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail {
  id: string;
  orderId: string;
  // ménage
  surface: number | null;
  cleanType: CleanType | null;
  teamType: TeamType | null;
  squadSize: number | null;
  // cuisine
  guests: number | null;
  dishes: string | null;
  // childcare
  children: number | null;
  hours: number | null;
  // shared
  notes: string | null;
}

export interface OrderAssignment {
  id: string;
  orderId: string;
  professionalId: string;
  isLead: boolean;
  status: AssignmentStatus;
  assignedAt: string;
  confirmedAt: string | null;
}

export interface StatusEvent {
  id: string;
  orderId: string;
  seq: number;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  actorUserId: string;
  actorRole: ActorRole;
  reason: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  orderId: string;
  seq: number;
  senderId: string;
  senderRole: ActorRole;
  content: string;
  clientMessageId: string | null;
  createdAt: string;
}

export interface NegotiationOffer {
  id: string;
  orderId: string;
  seq: number;
  offeredBy: string;
  amount: number;
  status: OfferStatus;
  acceptedAt: string | null;
  createdAt: string;
}

export interface Rating {
  id: string;
  orderId: string;
  clientId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
}
