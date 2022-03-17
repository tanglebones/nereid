const byteToHex: string[] = [];

for (let n = 0; n <= 0xff; ++n)
{
  const hexOctet = n.toString(16).padStart(2, "0");
  byteToHex.push(hexOctet);
}

export const uint8ArrayToHex = (uint8Array: Uint8Array) => {

  const hexOctets = []; // new Array(buff.length) is even faster (preallocates necessary array size), then use hexOctets[i] instead of .push()

  for (let i = 0; i < uint8Array.length; ++i)
    hexOctets.push(byteToHex[uint8Array[i]]);

  return hexOctets.join("");
};
