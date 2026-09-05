import "@testing-library/jest-dom";

if (typeof (global as any).Response === "undefined") {
  (global as any).Response = class Response {
    ok = true;
    status = 200;
    json = () => Promise.resolve({});
    text = () => Promise.resolve("");
  };
}

if (typeof (global as any).Request === "undefined") {
  (global as any).Request = class Request {};
}

if (typeof (global as any).Headers === "undefined") {
  (global as any).Headers = class Headers {
    append() {}
    get() { return null; }
    has() { return false; }
    set() {}
  };
}

if (typeof global.fetch === "undefined") {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    })
  ) as any;
}

if (typeof window !== "undefined") {
  if (typeof window.fetch === "undefined") window.fetch = global.fetch;
  if (typeof (window as any).Response === "undefined") (window as any).Response = (global as any).Response;
  if (typeof (window as any).Request === "undefined") (window as any).Request = (global as any).Request;
  if (typeof (window as any).Headers === "undefined") (window as any).Headers = (global as any).Headers;
}
