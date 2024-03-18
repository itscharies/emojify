export function numberToEncodedLetter(number: number): string {
  //Takes any number and converts it into a base (dictionary length) letter combo. 0 corresponds to an empty string.
  //It converts any numerical entry into a positive integer.
  if (isNaN(number)) {
    throw new Error("NaN");
  }
  number = Math.abs(Math.floor(number));

  const dictionary = "abcdefghijklmnopqrstuvwxyz";
  let index: number = number % dictionary.length;
  let quotient: number = number / dictionary.length;
  let result: string | undefined;

  if (number <= dictionary.length) {
    return dictionary.charAt(number);
  } //Number is within single digit bounds of our encoding letter alphabet

  if (quotient >= 1) {
    //This number was bigger than our dictionary, recursively perform this function until we're done
    if (index === 0) {
      quotient--;
    } //Accounts for the edge case of the last letter in the dictionary string
    result = numberToEncodedLetter(quotient);
  }

  if (index === 0) {
    index = dictionary.length;
  } //Accounts for the edge case of the final letter; avoids getting an empty string

  return result + dictionary.charAt(index);
}
