export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

export function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

export async function safeFetch(url) {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error("Fetch error:", url, res.status);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("Network error:", url, err);
    return null;
  }
}

