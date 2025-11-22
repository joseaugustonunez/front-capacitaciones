
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export const enviarCorreo = async (formData) => {
  try {
    const res = await fetch(`${backendUrl}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    return await res.json();
  } catch (error) {
    console.error("❌ Error en la API de email:", error);
    throw error;
  }
};
