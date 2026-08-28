export type FormalType = "Hall Formal" | "MCR Guest Dinner";

export type FormalPriceRecord = {
  college: string;
  university: "Oxford" | "Cambridge";
  hallFormalPrice: number | null;
  mcrGuestDinnerPrice: number | null;
  currency: "GBP";
  notes?: string;
};

export const formalPriceDatabase: FormalPriceRecord[] = [
  {
    college: "St Catherine’s College",
    university: "Oxford",
    hallFormalPrice: 18,
    mcrGuestDinnerPrice: 35,
    currency: "GBP",
  },
  {
    college: "Merton College",
    university: "Oxford",
    hallFormalPrice: 22,
    mcrGuestDinnerPrice: 45,
    currency: "GBP",
  },
  {
    college: "New College",
    university: "Oxford",
    hallFormalPrice: 20,
    mcrGuestDinnerPrice: 40,
    currency: "GBP",
  },
  {
    college: "Reuben College",
    university: "Oxford",
    hallFormalPrice: 18,
    mcrGuestDinnerPrice: 38,
    currency: "GBP",
  },
  {
    college: "Wolfson College",
    university: "Oxford",
    hallFormalPrice: 16,
    mcrGuestDinnerPrice: 35,
    currency: "GBP",
  },
  {
    college: "Trinity College Cambridge",
    university: "Cambridge",
    hallFormalPrice: 25,
    mcrGuestDinnerPrice: 50,
    currency: "GBP",
  },
  {
    college: "King’s College Cambridge",
    university: "Cambridge",
    hallFormalPrice: 28,
    mcrGuestDinnerPrice: 55,
    currency: "GBP",
  },
];

export function getReferenceFormalPrice(
  college: string,
  formalType: FormalType
) {
  const record = formalPriceDatabase.find((item) => item.college === college);

  if (!record) return null;

  if (formalType === "Hall Formal") {
    return record.hallFormalPrice;
  }

  if (formalType === "MCR Guest Dinner") {
    return record.mcrGuestDinnerPrice;
  }

  return null;
}

export function isPriceAboveWarningLimit(
  price: number,
  referencePrice: number | null
) {
  if (!referencePrice) return false;

  return price > referencePrice * 1.1;
}