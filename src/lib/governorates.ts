// Temporarily Cairo/Giza only — fulfillment isn't set up for the rest of the
// country yet. This one list drives every governorate picker and zod
// validator (checkout, saved addresses), so restoring the full list here is
// all it takes to reopen shipping nationwide later.
export const EGYPT_GOVERNORATES = ["Cairo", "Giza"] as const;
