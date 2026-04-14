const query = "coca";
const count = 50;
const hash = "3eca26a431d4646a8bbce2644b78d3ca734bf8b4ba46afe4269621b64b0fb67d";
const baseUrl = "https://www.disco.com.ar";

function encodeBase64(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

function encodeUrl(str) {
  return encodeURIComponent(str);
}

function buildVariables(query, count) {
  return {
    productOriginVtex: true,
    simulationBehavior: "default",
    hideUnavailableItems: true,
    advertisementOptions: {
      showSponsored: true,
      sponsoredCount: 2,
      repeatSponsoredProducts: false,
      advertisementPlacement: "autocomplete",
    },
    fullText: query,
    count,
    shippingOptions: [],
    variant: null,
    origin: "autocomplete",
  };
}

function buildExtensions(query, count, hash) {
  return {
    persistedQuery: {
      version: 1,
      sha256Hash: hash,
      sender: "vtex.store-resources@0.x",
      provider: "vtex.search-graphql@0.x",
    },
    variables: encodeBase64(JSON.stringify(buildVariables(query, count))),
  };
}

const extensions = JSON.stringify(buildExtensions(query, count, hash));
const params = new URLSearchParams({
  workspace: "master",
  maxAge: "medium",
  appsEtag: "remove",
  domain: "store",
  locale: "es-AR",
  operationName: "productSuggestions",
  variables: "{}",
  extensions: extensions,
});

const url = `${baseUrl}/_v/segment/graphql/v1/?${params.toString()}`;
console.log("URL:", url);

// Test the fetch
fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "es-AR,es;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": baseUrl + "/",
    "Origin": baseUrl,
    "Sec-Fetch-Dest": "fetch",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
  },
}).then(r => {
  console.log("Response status:", r.status);
  return r.json();
}).then(data => {
  console.log("Data:", JSON.stringify(data, null, 2));
  if (data.data?.productSuggestions?.products) {
    console.log("Products found:", data.data.productSuggestions.products.length);
  }
  if (data.errors) {
    console.log("Errors:", data.errors);
  }
}).catch(err => console.error("Error:", err.message));
