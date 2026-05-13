export default {
  async fetch(request) {

    const url = new URL(request.url);

    if (url.pathname === "/create-checkout-session") {

      return new Response(
        JSON.stringify({
          success: true,
          message: "Bunny Worker Works 🐰"
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    }

    return new Response("Bunny API Running 🐰");

  }
}
