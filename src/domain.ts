export const bookingStatuses = [
  "request_submitted",
  "awaiting_owner",
  "accepted",
  "rejected",
  "awaiting_payment",
  "payment_completed",
  "handover_pending",
  "handover_completed",
  "rental_active",
  "return_pending",
  "return_completed",
  "deposit_refund_pending",
  "deposit_refunded",
  "cancelled",
  "disputed",
  "completed",
] as const;

export type FullBookingStatus = (typeof bookingStatuses)[number];
export type DeliveryMethod =
  "owner_delivery" | "renter_pickup" | "meeting_point";

export const bookingTransitions: Record<
  FullBookingStatus,
  readonly FullBookingStatus[]
> = {
  request_submitted: ["awaiting_owner", "cancelled"],
  awaiting_owner: ["accepted", "rejected", "cancelled"],
  accepted: ["awaiting_payment", "cancelled"],
  rejected: [],
  awaiting_payment: ["payment_completed", "cancelled"],
  payment_completed: ["handover_pending", "cancelled", "disputed"],
  handover_pending: ["handover_completed", "cancelled", "disputed"],
  handover_completed: ["rental_active", "disputed"],
  rental_active: ["return_pending", "disputed"],
  return_pending: ["return_completed", "disputed"],
  return_completed: ["deposit_refund_pending", "disputed"],
  deposit_refund_pending: ["deposit_refunded", "disputed"],
  deposit_refunded: ["completed"],
  cancelled: [],
  disputed: [
    "return_completed",
    "deposit_refund_pending",
    "deposit_refunded",
    "completed",
    "cancelled",
  ],
  completed: [],
};

export function canTransition(from: FullBookingStatus, to: FullBookingStatus) {
  return bookingTransitions[from].includes(to);
}

export function assertValidDateRange(start: string, end: string) {
  const from = new Date(`${start}T00:00:00Z`);
  const to = new Date(`${end}T00:00:00Z`);
  if (
    !start ||
    !end ||
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    to <= from
  ) {
    throw new Error("Təhvil tarixi götürülmə tarixindən sonra olmalıdır.");
  }
  return Math.ceil((to.getTime() - from.getTime()) / 86400000);
}

export function calculateBooking(input: {
  dailyPrice: number;
  start: string;
  end: string;
  commissionRate: number;
  deposit: number;
  deliveryFee?: number;
}) {
  const days = assertValidDateRange(input.start, input.end);
  const rental = round(input.dailyPrice * days);
  const commission = round((rental * input.commissionRate) / 100);
  const delivery = round(input.deliveryFee ?? 0);
  const deposit = round(input.deposit);
  return {
    days,
    rental,
    commission,
    delivery,
    deposit,
    total: round(rental + commission + delivery + deposit),
  };
}

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
