import { describe, expect, it } from "vitest";
import {
  assertValidDateRange,
  calculateBooking,
  canTransition,
} from "./domain";
import { bookingMath, daysBetween, listings } from "./lib";

describe("booking finance", () => {
  it("keeps the refundable deposit separate and calculates the total", () => {
    expect(
      calculateBooking({
        dailyPrice: 20,
        start: "2026-11-10",
        end: "2026-11-13",
        commissionRate: 10,
        deposit: 50,
        deliveryFee: 5,
      }),
    ).toEqual({
      days: 3,
      rental: 60,
      commission: 6,
      deposit: 50,
      delivery: 5,
      total: 121,
    });
  });
  it("rejects invalid date ranges", () => {
    expect(() => assertValidDateRange("2026-11-13", "2026-11-10")).toThrow();
    expect(daysBetween("2026-11-13", "2026-11-10")).toBe(0);
  });
  it("rounds browser price calculations to currency precision", () => {
    expect(bookingMath(listings[0], "2026-11-10", "2026-11-13")).toEqual({
      days: 3,
      rental: 90,
      fee: 4.95,
      deposit: 50,
      delivery: 0,
      total: 144.95,
    });
  });
});

describe("booking state machine", () => {
  it("allows valid transitions and blocks invalid skips", () => {
    expect(canTransition("awaiting_owner", "accepted")).toBe(true);
    expect(canTransition("awaiting_owner", "payment_completed")).toBe(false);
    expect(canTransition("completed", "rental_active")).toBe(false);
  });
});
