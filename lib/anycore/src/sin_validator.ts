const luhnLookup = {0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 1, 6: 3, 7: 5, 8: 7, 9: 9} as Record<string, number>;
export const sinValidator = (sin?: string) => {
  if (sin?.match(/^[-\d\s]+$/)) {
    const digits = sin?.replace(/\D/g, "");
    return (digits?.length === 9) && (
      (+digits[0] +
        luhnLookup[digits[1]] +
        +digits[2] +
        luhnLookup[digits[3]] +
        +digits[4] +
        luhnLookup[digits[5]] +
        +digits[6] +
        luhnLookup[digits[7]] +
        +digits[8])
      % 10 === 0
    );
  }
  return false;
};
