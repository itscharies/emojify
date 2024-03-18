const dictionary = "abcdefghijklmnopqrstuvwxyz";

export function numberToEncodedLetter(number: number): string | undefined {
  //Takes any number and converts it into a base (dictionary length) letter combo. 0 corresponds to an empty string.
  //It converts any numerical entry into a positive integer.
  if (isNaN(number)) {
    return undefined;
  }
  number = Math.abs(Math.floor(number));
  let index = number % dictionary.length;
  let quotient = number / dictionary.length;
  let result;

  if (number <= dictionary.length) {
    return numToLetter(number);
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

  return result + numToLetter(index);

  function numToLetter(number: number): string | undefined {
    //Takes a letter between 0 and max letter length and returns the corresponding letter
    if (number > dictionary.length || number < 0) {
      return undefined;
    }
    if (number === 0) {
      return "";
    } else {
      return dictionary.charAt(number - 1);
    }
  }
}
