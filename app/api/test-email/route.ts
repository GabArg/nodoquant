import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET() {
  try {
    const data = await resend.emails.send({
      from: "NodoQuant <hola@nodoquant.com>",
      to: "guidobroccoli@hotmail.com",
      subject: "Bienvenido a NodoQuant 🚀",
      html: `
        <p>Hola Guido 👋</p>
        <p>Este es un test real desde NodoQuant.</p>
        <p>Estamos verificando el sistema de emails.</p>
        <p>Si recibís esto, todo funciona perfecto 🚀</p>
      `,
    });

    return Response.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error });
  }
}