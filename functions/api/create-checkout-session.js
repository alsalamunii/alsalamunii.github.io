export async function onRequest(context) {

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
