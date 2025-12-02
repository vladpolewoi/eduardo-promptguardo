export function injectScript({ id, src }: { id: string; src: string }) {
  const existing = document.getElementById(id);

  if (existing) {
    existing.remove();
  }

  const script = document.createElement('script');

  script.id = id;
  script.src = src;

  (document.head || document.documentElement).appendChild(script);
}

