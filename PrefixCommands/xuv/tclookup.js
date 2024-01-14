import truecallerjs from "truecallerjs":

async function lookup(number) {
  try {
    const searchData = {
      number: number,
      installationId: "a1i0b--kMjadQkMkO4DOIYtdvS2AM2N2x-0Uu6PHN_M3Sd8LFaeNM9B6x76cVrHw",
    };

    const response = await truecallerjs.search(searchData);

    const r = response.data.data[0];

    const data = [
      `**Name**: ${r?.name}`,
      `**City**: ${r.addresses[0].city}, ${response.getCountryDetails().name} ${response.getCountryDetails().flag}`,
      `**Carrier**: ${r.phones[0].carrier}`,
    ].join("\n");

    return data;
  } catch (e) {
    throw new Error("Error occurred", e);
  }
}