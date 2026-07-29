const fetch = require('node-fetch');

const latihanUrls = [
  "https://docs.google.com/forms/d/e/1FAIpQLSc-n8g7QXy7DSxQQejQRd_pTNLBXWn_TP-xZ3bRZ5E8t1c3OA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSef4EcnvWHR60O_EIB7qIO0U0zUmcm3HrsjNcLetuThW5XG6w/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSd0bONUryHMIn76nGcqHCTaoK8PeeQPfOJJ-YuxCed9-raUyw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSejE0UfX09Cw3gCQZzwxlzMc4FWFPUTZZ09WEWsXhewIPM1RA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSc_6hI8ebzYS4MJSEetGinqpI7I0Y8kfRXeXFAt1myVpB1cSA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdqe9f47Aj9DYUeGWh6YeHJdYsSBbtvsGqF-OhshkvmnkvgVQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScbwXaq9SddVloetw7TfBhDdER1qjlZX3gJQ5fJOr7YRFI64Q/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSd9gY3Ugw-Cuh409gZwSu481-jlKFzwgXoQcqson_KUMxgkSQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScvmx2Nj0KYCZnNG3NLJuDAq211755ovkpjVqDX9psyo8iWww/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSe5ZttCZ-xrpLIPQNttc5eBCKGdp-3-sD3_XAzhmU1ToSo-HA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfW8ofw_OgD6gSBH7QLJwcrSZu6OLXlpb3j8ijJAPqE1sLR1Q/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfNBYzjEyehuZJuLqgJqVf5IqrVpC9ZnHZn4Wk67pEBaEuqjg/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSe3pSQHVwYnaH6bTlBm48DSqvD8yI4kD21T79hl3i9izwkX6g/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfqu_Uv1AlF2ZYwk3mPFSdI1UJHnz3U4C3xXYmwDd3IWZtD4g/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfPX91UrrzwLegxFG3iKniR2qejygspaAVuLTyg5-EFcxNmPw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdEqw92MzIH9xh0Cw1NNQMdsEga9ptzmMGgaN_NYyjivfTIvw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSeWGCM_Weo85AZKJL5hFaAuttFWAA9cxjHgH6Xv_KRIpM_ThQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSd489-hU0hzpTIP5Yjb8CbIygqoKhs1mtaruPgDGO-x42ir0w/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScri7JmBFisJTpPb24Y5uI4pN4w7tth2LZq_1OCFPg155hAfQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdhE_fT4GyoXq-aUxNUA5tCFgR-Pn2u5F_SwbmhunQMez0Vpw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSddQh4DsfeVQg1BTCSWyAMQmpFjOe_1UuceDOmj7nErvM08XQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSeIVhMkCXv6V6YpJMd6sWD_x041GB37FzCiaxtsTZCEx5ocIw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScBbusD352ruC8IlmONED3jcnOSaRU8NASi65C7JdA_3aeyHQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSeKvbFoLoLQCLsfIrtdJNFjFIlNKclrZmWJja52DSVdwBaMXw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSevDCxpA2F9ugQQ36gVHAWaUYnpUgDZsDbRwRG5WQnnLZ8_RQ/viewform?authuser=0"
];

const vocabQuizUrls = [
  "https://docs.google.com/forms/d/e/1FAIpQLScWxBvxgP4kHnPdH7jbKDz-p10v2-1mumYftDjkr04jFBAHhQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSewrJe2ENqYZmGr4W7Nl9A8zyHAHL0tpgwPXma8sgICCi2HmQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSebBD-sPw2qnod-0PUI76wIqt5m25AgfErpy-9ujJNReMFFpg/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdcRGWYeejoRYwsnA0VT9Nrh-Ylg9AHKBAWUlwpS3tSQToXaw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdF7nNC0Q7KQQ8yYLKlz-2qoiQI704k_wvjlVskbBTGhpWb9A/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSc9Vxh2exwIOYamWWnN1IDj7OAYa0YPsNGjonicW9UGzhANpw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfWiBE1FLY0AhAsbOw7q9Ddmm9Exm_D54_4CF014JKFTRsdWg/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdSSFNFTJKzU2lEWV4zQdlJVa-uTs2pmLiPJBcaowp68WKWRg/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfaMsRqYxBRoVpmoGFs5sClLeDrD8FUPA0HJlUn3mXdB_v12Q/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSehwoVr3WmKw4yilPfJ3x3aKaYcRsoW3qWDXdJbPmO_txxpmA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSebQXuWp27KlB73tbvRv9u6uLVtigga4iT8VtFMKdXgfyRqTQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSeXuAuR-W11hwfWTQAF0K52UdevyYoidXMDkllO1mClDBaI1A/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSc3GUVWPmGt6qTOvQRELcX2QlTHW8ItTekRrR5ZMipJ-aTxXA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSceNy55LI96FD02sCxrLxDHjbEPwyUfP1IJpI4lopx2dGFIsg/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdqgmWBSZ2mbQbH950Ok0ku63ZE_J9hvfFuYLdOvG5hbF0qDQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScYMCX7D7zLiRdPPwVus49E8y09ffyl0SDGGAuHm-KFArba2g/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSelm_D6IMbSxsbL1fKdq35jL4ODqDtQiqOz_eSJLe07L-AVNw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSc03TuVMrHgeqHzQdm-JyAHGhkUn82GfEzxQ2hgX1YZSUF30Q/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSeYiD2cY6jjcDAts8O9-oZVZnX_bDDdlCpM2R91ooTQhbiiOw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfW_-udYAiw1vqhvQCoqRFrizJSRCQOvvtAkrWGSyJy1u1Kfw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScAUSb_V24ZlAm5OQsAWlOsZFD68tMhX1Fc4wkqZaFa3g0jcA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSc0O2uXCO4hit4ec1MnXvf31FybkZNVQInP2hTmbIbDgnsgWw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfdTo4pmiw0thl9zaBwGyiIUg_PLceoHkedu2Xq5M1BqlcFfw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScnG9MgAQECuM5Kvkr-2pzsFA6htmJNdzmtUFLRAnTqkJDekQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdeFmQZzxLfp-5SUjhnic_om4jIoKpLUcGUGMz1SMxKGpcJWA/viewform?authuser=0"
];

async function inspectAll() {
  console.log("=== Latihan URLs Titles ===");
  for (let i = 0; i < latihanUrls.length; i++) {
    const res = await fetch(latihanUrls[i]);
    const html = await res.text();
    const startPrefix = 'var FB_PUBLIC_LOAD_DATA_ = ';
    const startIdx = html.indexOf(startPrefix);
    const dataStart = startIdx + startPrefix.length;
    let bracketCount = 0, endIdx = -1;
    for (let j = dataStart; j < html.length; j++) {
      if (html[j] === '[') bracketCount++;
      else if (html[j] === ']') { bracketCount--; if (bracketCount === 0) { endIdx = j; break; } }
    }
    const parsed = JSON.parse(html.substring(dataStart, endIdx + 1));
    const title = parsed[1][8] || parsed[3];
    console.log(`Latihan Index ${i}: ${title}`);
  }

  console.log("\n=== Vocab Quiz URLs Titles ===");
  for (let i = 0; i < vocabQuizUrls.length; i++) {
    const res = await fetch(vocabQuizUrls[i]);
    const html = await res.text();
    const startPrefix = 'var FB_PUBLIC_LOAD_DATA_ = ';
    const startIdx = html.indexOf(startPrefix);
    const dataStart = startIdx + startPrefix.length;
    let bracketCount = 0, endIdx = -1;
    for (let j = dataStart; j < html.length; j++) {
      if (html[j] === '[') bracketCount++;
      else if (html[j] === ']') { bracketCount--; if (bracketCount === 0) { endIdx = j; break; } }
    }
    const parsed = JSON.parse(html.substring(dataStart, endIdx + 1));
    const title = parsed[1][8] || parsed[3];
    console.log(`Vocab Index ${i}: ${title}`);
  }
}

inspectAll().catch(console.error);
