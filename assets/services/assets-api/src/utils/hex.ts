export const ASCIIToHexa = (str: string, fillTo: number): string => {
  const arr1: Array<string> = [];
  for (let n = 0, l = str.length; n < l; n++) {
    const hex: string = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  for (let m = str.length; m < fillTo; m++) {
    arr1.push('0');
    arr1.push('0');
  }
  return arr1.join('');
};

export const hexaToASCII = (str1: string): string => {
  const hex: string = str1.toString();
  let str = '';
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
};

export const numberToHexa = (num: number, pushTo: number): string => {
  const arr1: Array<string> = [];
  const str: string = num.toString(16);
  if (str.length % 2 === 1) {
    arr1.push('0');
    pushTo -= 1;
  }
  for (let m = str.length / 2; m < pushTo; m++) {
    arr1.push('0');
    arr1.push('0');
  }
  for (let n = 0, l = str.length; n < l; n++) {
    const hex: string = str.charAt(n);
    arr1.push(hex);
  }
  return arr1.join('');
};

// 0x
// 7465737400000000000000000000000000000000000000000000000000000000
// 5ee861f300000000000000000000000000000000000000000000000000000000
